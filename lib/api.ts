// Fall back to prod so a missing/un-inlined env var never points requests at
// `undefined/api/...`. Set EXPO_PUBLIC_API_URL in .env to override (then restart
// Metro with `npx expo start -c` so the new value is inlined).
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://calmapp.co';

let currentAuthToken: string | null = null;
// Absolute epoch-ms when the current token expires (null = unknown/none).
let currentTokenExpiresAt: number | null = null;

export function setAuthToken(token: string | null, expiresAt?: number | null) {
    currentAuthToken = token;
    currentTokenExpiresAt = token ? (expiresAt ?? null) : null;
}

export function getAuthToken(): string | null {
    return currentAuthToken;
}

// --- Auth bridge ---
// Lets this transport layer persist a refreshed token / trigger sign-out without
// importing React or SecureStore. AuthStateProvider registers the handlers.
interface AuthBridge {
    onTokenRefreshed?: (token: string, expiresIn: number | null) => void;
    onAuthExpired?: () => void;
}

let authBridge: AuthBridge | null = null;

export function setAuthBridge(bridge: AuthBridge | null) {
    authBridge = bridge;
}

const isAuthPath = (path: string) => path.startsWith("/api/auth/");

// Single-flight token refresh: concurrent 401s share one /api/auth/refresh call.
let refreshPromise: Promise<string> | null = null;

function refreshToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const res = await apiPost<ApiAuthRefreshResponse>(
                "/api/auth/refresh",
                undefined,
                { _skipAuthRetry: true },
            );
            currentAuthToken = res.token;
            currentTokenExpiresAt =
                typeof res.expires_in === "number"
                    ? Date.now() + res.expires_in * 1000
                    : null;
            authBridge?.onTokenRefreshed?.(res.token, res.expires_in ?? null);
            return res.token;
        })().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

/**
 * Refresh the auth session now (single-flight). Used proactively on app
 * launch/foreground when the token is at/near expiry. Throws if refresh fails.
 */
export function refreshAuthSession(): Promise<string> {
    return refreshToken();
}

/** Epoch-ms the current token expires at (null if unknown). */
export function getTokenExpiresAt(): number | null {
    return currentTokenExpiresAt;
}

export interface Envelope<T> {
    status: number;
    message: string;
    data: T;
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public payload?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

interface ApiRequestOptions {
    locale?: "ar" | "en";
    token?: string;
    signal?: AbortSignal;
    // Internal: skip the 401 auto-refresh/retry (used by the refresh call itself).
    _skipAuthRetry?: boolean;
    // Internal: marks the one allowed retry after a refresh (prevents loops).
    _retried?: boolean;
}

async function request<T>(
    method: string,
    path: string,
    body: unknown,
    opts: ApiRequestOptions,
): Promise<T> {
    const headers: Record<string, string> = {
        Accept: "application/json",
        "Accept-Language": opts.locale ?? "ar",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = opts.token ?? currentAuthToken;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: opts.signal,
    });

    let envelope: Envelope<T> | null = null;
    try {
        envelope = (await res.json()) as Envelope<T>;
    } catch {
        throw new ApiError(res.status, `Invalid JSON from ${path}`);
    }

    const status = envelope?.status ?? res.status;
    if (!res.ok || status >= 400) {
        // Expired JWT: refresh once and replay the request transparently. Skip
        // auth endpoints and anything already retried to avoid loops. The failed
        // 401 never reached business logic, so replaying a POST is safe.
        const canRetry =
            status === 401 &&
            !opts._skipAuthRetry &&
            !opts._retried &&
            Boolean(token) &&
            !isAuthPath(path);
        if (canRetry) {
            try {
                const newToken = await refreshToken();
                return request<T>(method, path, body, {
                    ...opts,
                    token: newToken,
                    _retried: true,
                });
            } catch {
                authBridge?.onAuthExpired?.();
            }
        }
        throw new ApiError(
            status,
            envelope?.message ?? res.statusText,
            envelope?.data,
        );
    }
    return envelope.data;
}

export const apiGet = <T>(path: string, opts: ApiRequestOptions = {}) =>
    request<T>("GET", path, undefined, opts);

export const apiPost = <T>(
    path: string,
    body?: unknown,
    opts: ApiRequestOptions = {},
) => request<T>("POST", path, body ?? {}, opts);

export const apiPatch = <T>(
    path: string,
    body?: unknown,
    opts: ApiRequestOptions = {},
) => request<T>("PATCH", path, body ?? {}, opts);

export const apiDelete = <T>(path: string, opts: ApiRequestOptions = {}) =>
    request<T>("DELETE", path, undefined, opts);

// --- Home-screen response types ---

export interface ApiCountry {
    id: string;
    country_code: string;
    dial_code: string;
    name_en: string;
    name_ar: string;
    avatar: string;
}

export interface ApiCity {
    id: string;
    name_en: string;
    name_ar: string;
    avatar: string;
    country_id: string;
    // /api/cities now ships each city's areas inline (ordered by name; [] if
    // none). Other endpoints that embed a city may omit this.
    areas?: ApiCityArea[];
}

export interface ApiPlaceType {
    id: string;
    name_en: string;
    name_ar: string;
    icon: string;
}

export interface ApiCityArea {
    id: string;
    name_en: string;
    name_ar: string;
}

export type WeekDay =
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";

export interface ApiPlacePhoto {
    id: string;
    url: string;
    // The amenity this photo belongs to; null/absent = general gallery photo.
    attribute_id?: string | null;
    // Canonical order across the whole place (section + within-section).
    sort_order?: number;
    // Slot in the "shown outside" showcase: 0 = cover, then 1,2,… ; null = not
    // featured.
    featured_order?: number | null;
}

// The curated showcase (already ordered; [0] is the cover). On every payload.
export interface ApiFeaturedPhoto {
    id: string;
    url: string;
    attribute_id: string | null;
}

// Grouped "view images" gallery — detail endpoint only, already grouped by
// amenity and ordered by min_sort_order.
export interface ApiPhotoGroup {
    attribute_id: string | null;
    attribute: {
        id: string;
        name_en: string;
        name_ar: string;
        icon: string | null;
    } | null;
    min_sort_order: number;
    photos: {
        id: string;
        url: string;
        sort_order: number;
        featured_order: number | null;
    }[];
}

export interface ApiPlace {
    id: string;
    title: string;
    description: string;
    price: number;
    per_day_prices: Record<WeekDay, number>;
    check_in_time: string;
    check_out_time: string;
    // When true, checkout falls on the day AFTER the booking's last day.
    checkout_next_day?: boolean;
    max_guests?: number | null;
    rules: string | null;
    // Convenience: first featured photo's URL, else first gallery photo.
    cover_photo_url: string | null;
    photos: ApiPlacePhoto[];
    // The "shown outside" showcase, already ordered. May be absent on lean
    // list payloads.
    featured_photos?: ApiFeaturedPhoto[];
    type: ApiPlaceType;
    city: ApiCity;
    city_area: ApiCityArea | null;
    likes_count: number;
    rating: { avg: number | null; count: number };
    is_liked: boolean;
    created_at: string;
}

export interface ApiPlaceList {
    id: string;
    name_en: string;
    name_ar: string;
    description_en: string | null;
    description_ar: string | null;
    icon: string;
    sort_order: number;
    places: ApiPlace[];
}

// --- Place detail extras ---

export interface ApiAttributeGroup {
    id: string;
    name_en: string;
    name_ar: string;
}

export interface ApiAttributeDef {
    id: string;
    name_en: string;
    name_ar: string;
    icon: string | null;
    type: string;
    // Admin-controlled: show in a prominent "Highlights" section. The
    // attributes array itself is already returned pre-sorted by sort_order.
    is_highlighted?: boolean;
    sort_order?: number;
    group: ApiAttributeGroup;
}

export interface ApiPlaceAttribute {
    id: string;
    value: string | number | boolean | null;
    description: string | null;
    attribute: ApiAttributeDef;
}

export interface ApiPlaceReview {
    id: string;
    rate: number;
    comment: string | null;
    // First name only; may be null.
    reviewer_name: string | null;
    // Full avatar URL (S3 or absolute); null when the reviewer has none.
    reviewer_avatar_url: string | null;
    created_at: string;
}

export interface ApiPlaceHost {
    id: string;
    name: string;
    joined_at: string;
}

export interface ApiPlaceDetail extends ApiPlace {
    attributes: ApiPlaceAttribute[];
    // Grouped gallery for the "view all images" screen (detail only).
    photo_groups: ApiPhotoGroup[];
    reviews_recent: ApiPlaceReview[];
    host: ApiPlaceHost;
}

export interface ApiSettings {
    support_phone: string;
    support_email: string;
}

export const getSettings = (opts?: ApiRequestOptions) =>
    apiGet<ApiSettings>("/api/settings", opts);

export const getCountries = (opts?: ApiRequestOptions) =>
    apiGet<ApiCountry[]>("/api/countries", opts);

// Cities ship with their areas inline — enough to render the city → area
// picker in one call.
export const getCities = (opts?: ApiRequestOptions) =>
    apiGet<ApiCity[]>("/api/cities", opts);

export const getPlaceTypes = (opts?: ApiRequestOptions) =>
    apiGet<ApiPlaceType[]>("/api/place-types", opts);

export const getPlaceLists = (opts?: ApiRequestOptions) =>
    apiGet<ApiPlaceList[]>("/api/place-lists", opts);

export const getMostLikedPlaces = (opts?: ApiRequestOptions) =>
    apiGet<ApiPlace[]>("/api/places/most-liked", opts);

export const getPlace = (id: string, opts?: ApiRequestOptions) =>
    apiGet<ApiPlaceDetail>(`/api/places/${id}`, opts);

// --- Search ---

export interface SearchPlacesParams {
    city_id: string;
    city_area_id?: string;
    q?: string;
    place_type_ids?: string[];
    amenities?: string[];
    price_min?: number;
    price_max?: number;
    guests?: number;
    check_in?: string;
    check_out?: string;
    sort?: "most_liked" | "price_asc" | "price_desc";
    page?: number;
    per_page?: number;
}

export const searchPlaces = (
    params: SearchPlacesParams,
    opts?: ApiRequestOptions,
) => {
    const qs = new URLSearchParams();
    qs.set("city_id", params.city_id);
    qs.set("page", String(params.page ?? 1));
    qs.set("per_page", String(params.per_page ?? 20));
    if (params.city_area_id) qs.set("city_area_id", params.city_area_id);
    if (params.q) qs.set("q", params.q);
    if (params.price_min != null) qs.set("price_min", String(params.price_min));
    if (params.price_max != null) qs.set("price_max", String(params.price_max));
    if (params.guests != null) qs.set("guests", String(params.guests));
    if (params.sort) qs.set("sort", params.sort);
    (params.place_type_ids ?? []).forEach((id) =>
        qs.append("place_type_ids[]", id),
    );
    (params.amenities ?? []).forEach((id) => qs.append("amenities[]", id));
    if (params.check_in && params.check_out) {
        qs.set("check_in", params.check_in);
        qs.set("check_out", params.check_out);
    }
    return apiGet<ApiPaginated<ApiPlace>>(
        `/api/places/search?${qs.toString()}`,
        opts,
    );
};

// --- Filter options for a city (drives the filters modal) ---

export interface ApiFilterArea {
    id: string;
    name_en: string;
    name_ar: string;
    places_count: number;
}

export interface ApiFilterType {
    id: string;
    name_en: string;
    name_ar: string;
    icon: string;
    places_count: number;
}

export interface ApiFilterAmenityItem {
    id: string;
    name_en: string;
    name_ar: string;
    icon: string | null;
    places_count: number;
}

export interface ApiFilterAmenityGroup {
    group: { id: string; name_en: string; name_ar: string };
    items: ApiFilterAmenityItem[];
}

export interface ApiPlaceFilters {
    city_id: string;
    currency: string;
    price: { min: number; max: number };
    guests: { min: number; max: number };
    areas: ApiFilterArea[];
    place_types: ApiFilterType[];
    amenities: ApiFilterAmenityGroup[];
}

export const getPlaceFilters = (cityId: string, opts?: ApiRequestOptions) =>
    apiGet<ApiPlaceFilters>(`/api/places/filters?city_id=${cityId}`, opts);

// --- Unavailable / blocked calendar dates ---

export interface ApiUnavailableRange {
    start_date: string;
    end_date: string;
}

export interface ApiUnavailableDates {
    place_id: string;
    from: string;
    to: string;
    unavailable_dates: string[];
    unavailable_ranges: ApiUnavailableRange[];
}

export const getUnavailableDates = (
    id: string,
    params?: { from?: string; to?: string },
    opts?: ApiRequestOptions,
) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const query = qs.toString();
    return apiGet<ApiUnavailableDates>(
        `/api/places/${id}/unavailable-dates${query ? `?${query}` : ""}`,
        opts,
    );
};

// --- Availability & pricing quote ---

export interface ApiQuoteDay {
    date: string;
    weekday: string;
    price: number;
    available: boolean;
}

export interface ApiQuotePricing {
    subtotal: number;
    // Service fee is now baked into the per-day price, so these may be absent.
    service_fee_percentage?: number;
    service_fee?: number;
    vat_percentage: number;
    vat: number;
    total: number;
    total_minor: number;
}

export interface ApiQuote {
    place_id: string;
    check_in: string;
    check_out: string;
    days: number;
    guests: number | null;
    max_guests: number | null;
    currency: string;
    bookable: boolean;
    dates_available: boolean;
    guests_ok: boolean;
    unavailable_dates: string[];
    breakdown: ApiQuoteDay[];
    pricing: ApiQuotePricing;
}

export const getPlaceQuote = (
    id: string,
    params: { check_in: string; check_out: string; guests?: number },
    opts?: ApiRequestOptions,
) => {
    const qs = new URLSearchParams({
        check_in: params.check_in,
        check_out: params.check_out,
    });
    if (params.guests != null) qs.set("guests", String(params.guests));
    return apiGet<ApiQuote>(`/api/places/${id}/quote?${qs.toString()}`, opts);
};

// --- Bookings & payment ---

export type BookingApiStatus =
    | "pending_payment"
    | "confirmed"
    | "expired"
    | "canceled_by_host"
    | "canceled_by_guest"
    | "completed";

export interface ApiBookingPayment {
    id: string;
    method: string | null;
    status: string;
    url: string;
}

export interface ApiBookingPricing {
    subtotal: number;
    vat_percentage: number;
    vat: number;
    total: number;
    total_minor: number;
}

export interface ApiBooking {
    id: string;
    // Short, user-friendly code (e.g. "CB-7K9P2Q") for support / display.
    reference: string;
    place_id: string;
    status: BookingApiStatus;
    start_date: string;
    end_date: string;
    check_in_time: string;
    check_out_time: string;
    guests: number | null;
    currency: string;
    pricing: ApiBookingPricing;
    payment: ApiBookingPayment;
    expires_at: string | null;
    confirmed_at: string | null;
    created_at: string;
}

export const createBooking = (
    placeId: string,
    body: { check_in: string; check_out: string; guests?: number },
    opts?: ApiRequestOptions,
) => apiPost<ApiBooking>(`/api/places/${placeId}/bookings`, body, opts);

export const getBookingPaymentStatus = (
    bookingId: string,
    opts?: ApiRequestOptions,
) => apiGet<ApiBooking>(`/api/bookings/${bookingId}/payment-status`, opts);

// ⑥ Release a still-unpaid hold (safe anytime — re-verifies first: a paid
// booking becomes confirmed, an unpaid one expires, a confirmed one is a no-op).
export const cancelBooking = (bookingId: string, opts?: ApiRequestOptions) =>
    apiPost<ApiBooking>(`/api/bookings/${bookingId}/cancel`, undefined, opts);

// The list endpoint embeds a lightweight place summary so the row renders with
// no extra calls.
export interface ApiBookingPlaceSummary {
    id: string;
    title: string;
    cover_photo_url: string | null;
    type: { name_en: string; name_ar: string; icon: string };
    city: { name_en: string; name_ar: string };
    city_area: { name_en: string; name_ar: string } | null;
}

// --- Reviews ---

export type ReviewApiStatus = "under_review" | "published" | "blocked";

// The guest's own review as embedded on a booking (the place block + reviewer
// name are NOT included here — only on the public place page / host list).
export interface ApiBookingReview {
    id: string;
    rate: number;
    comment: string | null;
    status: ReviewApiStatus;
    created_at: string;
}

export interface ApiBookingListItem extends ApiBooking {
    place: ApiBookingPlaceSummary;
    // The guest's review for THIS booking's place (any status), or null.
    // Present only on GET /api/bookings.
    review: ApiBookingReview | null;
    // True only when the booking is completed AND review === null.
    can_review: boolean;
}

// Submit a review for a completed booking. 201 → the review (under_review).
export const submitReview = (
    bookingId: string,
    body: { rate: number; comment?: string },
    opts?: ApiRequestOptions,
) =>
    apiPost<ApiBookingReview>(
        `/api/bookings/${bookingId}/reviews`,
        body,
        opts,
    );

// Delete the caller's own review (allowed while under_review/published).
export const deleteReview = (reviewId: string, opts?: ApiRequestOptions) =>
    apiDelete<null>(`/api/reviews/${reviewId}`, opts);

export const getBookings = (
    params?: { page?: number; per_page?: number },
    opts?: ApiRequestOptions,
) => {
    const qs = new URLSearchParams({
        page: String(params?.page ?? 1),
        per_page: String(params?.per_page ?? 20),
    });
    return apiGet<ApiPaginated<ApiBookingListItem>>(
        `/api/bookings?${qs.toString()}`,
        opts,
    );
};

// Still-payable holds (pending_payment, expires_at > now) for the "finish your
// payment" home card. Returns the same row shape as the bookings list.
export const getPendingBookings = (opts?: ApiRequestOptions) =>
    apiGet<{ items: ApiBookingListItem[] }>("/api/bookings/pending", opts);

export const likePlace = (placeId: string, opts: ApiRequestOptions) =>
    apiPost<{ is_liked: boolean }>(
        `/api/places/${placeId}/like`,
        undefined,
        opts,
    );

export const unlikePlace = (placeId: string, opts: ApiRequestOptions) =>
    apiDelete<{ is_liked: boolean }>(`/api/places/${placeId}/like`, opts);

// --- Host (acting on the user's own places) ---

export interface ApiHostGuest {
    id: string;
    name: string | null;
    phone: string | null;
}

export interface ApiHostBookingItem extends ApiBookingListItem {
    guest: ApiHostGuest;
}

export type HostReviewStatus =
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected";

export interface ApiHostListing {
    id: string;
    title: string;
    cover_photo_url: string | null;
    price: number;
    max_guests: number | null;
    type: { id: string; name_en: string; name_ar: string; icon: string };
    city: { id: string; name_en: string; name_ar: string };
    city_area: { id: string; name_en: string; name_ar: string } | null;
    status: "active" | "inactive";
    review_status: HostReviewStatus;
    rejection_reason: string | null;
    likes_count: number;
    bookings_count: number;
    rating: { avg: number | null; count: number };
    created_at: string;
}

export interface ApiHostEarnings {
    currency: string;
    bookings_count: number;
    total: number;
    total_minor: number;
    paid: number;
    paid_minor: number;
    not_paid: number;
    not_paid_minor: number;
}

export const getHostBookings = (
    params?: { page?: number; per_page?: number },
    opts?: ApiRequestOptions,
) => {
    const qs = new URLSearchParams({
        page: String(params?.page ?? 1),
        per_page: String(params?.per_page ?? 20),
    });
    return apiGet<ApiPaginated<ApiHostBookingItem>>(
        `/api/host/bookings?${qs.toString()}`,
        opts,
    );
};

export const getHostListings = (
    params?: { page?: number; per_page?: number },
    opts?: ApiRequestOptions,
) => {
    const qs = new URLSearchParams({
        page: String(params?.page ?? 1),
        per_page: String(params?.per_page ?? 20),
    });
    return apiGet<ApiPaginated<ApiHostListing>>(
        `/api/host/listings?${qs.toString()}`,
        opts,
    );
};

export const getHostEarnings = (opts?: ApiRequestOptions) =>
    apiGet<ApiHostEarnings>("/api/host/earnings", opts);

// --- Favorites (the user's liked places, paginated) ---

export interface ApiPagination {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more: boolean;
}

export interface ApiPaginated<T> {
    items: T[];
    pagination: ApiPagination;
}

export const getFavorites = (
    params?: { page?: number; per_page?: number },
    opts?: ApiRequestOptions,
) => {
    const qs = new URLSearchParams({
        page: String(params?.page ?? 1),
        per_page: String(params?.per_page ?? 20),
    });
    return apiGet<ApiPaginated<ApiPlace>>(
        `/api/favorites?${qs.toString()}`,
        opts,
    );
};

// --- Auth (phone + OTP) ---

export type OtpChannel = "phone" | "email";

export interface ApiAuthUser {
    id: string;
    name: string | null;
    avatar_url: string | null;
    gender: "male" | "female" | null;
    age: number | null;
    birth_date: string | null;
    phone: string | null;
    email: string | null;
    country_id: string | null;
    role: "user" | "admin";
    is_host?: boolean;
    phone_verified_at: string | null;
    email_verified_at: string | null;
    created_at: string;
}

export interface ApiAuthVerifyResponse {
    token: string;
    token_type: "bearer";
    expires_in: number;
    user: ApiAuthUser;
}

export interface ApiAuthRefreshResponse {
    token: string;
    token_type: "bearer";
    expires_in: number;
}

export interface ApiOtpRequestResponse {
    phone: string;
    expires_at?: string | null;
    expires_in?: number | null;
    retry_after?: number | null;
}

export const requestOtp = (
    type: OtpChannel,
    phone: string,
    opts: ApiRequestOptions = {},
) =>
    apiPost<ApiOtpRequestResponse>(
        "/api/auth/otp/request",
        { type, phone },
        opts,
    );

export const verifyOtp = (
    type: OtpChannel,
    phone: string,
    otp: string,
    opts: ApiRequestOptions = {},
) =>
    apiPost<ApiAuthVerifyResponse>(
        "/api/auth/otp/verify",
        { type, phone, otp },
        opts,
    );

export const logoutUser = (opts: ApiRequestOptions = {}) =>
    apiPost<null>("/api/auth/logout", undefined, opts);

export const refreshAuthToken = (opts: ApiRequestOptions = {}) =>
    apiPost<ApiAuthRefreshResponse>("/api/auth/refresh", undefined, opts);

// --- Profile (get & update) ---

export interface UpdateProfileFields {
    name?: string;
    gender?: "male" | "female";
    age?: number;
    birth_date?: string; // YYYY-MM-DD
    email?: string;
}

export interface AvatarUpload {
    uri: string;
    name: string;
    type: string; // e.g. image/jpeg
}

export const getUser = (opts?: ApiRequestOptions) =>
    apiGet<ApiAuthUser>("/api/user", opts);

// Field-only update (no picture) — JSON PATCH.
export const updateProfile = (
    fields: UpdateProfileFields,
    opts?: ApiRequestOptions,
) => apiPatch<ApiAuthUser>("/api/user", fields, opts);

// Picture (optionally + fields) — multipart POST. Don't set Content-Type so
// fetch attaches the multipart boundary itself.
export async function updateProfileWithAvatar(
    fields: UpdateProfileFields,
    avatar: AvatarUpload | null,
    opts: ApiRequestOptions = {},
): Promise<ApiAuthUser> {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null && v !== "")
            form.append(k, String(v));
    }
    if (avatar) {
        // RN FormData file shape.
        form.append("avatar", avatar as unknown as Blob);
    }
    const token = opts.token ?? currentAuthToken;
    const send = async (bearer: string | null): Promise<ApiAuthUser> => {
        const headers: Record<string, string> = {
            Accept: "application/json",
            "Accept-Language": opts.locale ?? "ar",
        };
        if (bearer) headers.Authorization = `Bearer ${bearer}`;
        const res = await fetch(`${BASE_URL}/api/user`, {
            method: "POST",
            headers,
            body: form,
            signal: opts.signal,
        });
        let envelope: Envelope<ApiAuthUser> | null = null;
        try {
            envelope = (await res.json()) as Envelope<ApiAuthUser>;
        } catch {
            throw new ApiError(res.status, "Invalid JSON from /api/user");
        }
        const status = envelope?.status ?? res.status;
        if (!res.ok || status >= 400) {
            throw new ApiError(
                status,
                envelope?.message ?? res.statusText,
                envelope?.data,
            );
        }
        return envelope.data;
    };

    try {
        return await send(token);
    } catch (e) {
        // Same expired-JWT recovery as request(): refresh once and replay.
        if (e instanceof ApiError && e.status === 401 && token && !opts._retried) {
            try {
                const newToken = await refreshToken();
                return await send(newToken);
            } catch {
                authBridge?.onAuthExpired?.();
            }
        }
        throw e;
    }
}
