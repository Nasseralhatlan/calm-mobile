import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/pressable-scale";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { ThemedText } from "@/components/themed-text";
import { Colors, fontFamilyFor, Spacing } from "@/constants/theme";
import { useAuthState } from "@/data/auth-state";
import { bookingStatusView } from "@/data/booking-status";
import { getBookingsCache, setBookingsCache } from "@/data/bookings-cache";
import { invalidatePlaceCaches } from "@/data/caches";
import { setSelectedBooking } from "@/data/selected-booking";
import { getBookings, type ApiBookingListItem } from "@/lib/api";
import { dateKey, riyadhToday } from "@/lib/date-key";
import { formatSar } from "@/lib/format";
import { pickLang, useLocale, useT } from "@/lib/i18n";
import { STR } from "@/lib/strings";

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#6B7280";
const DIVIDER = "#F0F0F0";
const PER_PAGE = 20;
const SKELETON_COUNT = 5;
// Keep the skeleton up long enough to register even when the API is instant.
const MIN_SKELETON_MS = 450;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Localized = { ar: string; en: string };

// The list interleaves bookings with section separator rows.
type Row =
    | { kind: "booking"; booking: ApiBookingListItem }
    | { kind: "sep"; label: string };

const isPayable = (b: ApiBookingListItem) => b.status === "pending_payment";

// Fingerprint of the fields that affect a row's render, so a focus refetch that
// returns identical page-1 data can skip the state swap entirely (no flicker).
const bookingsSig = (arr: ApiBookingListItem[]): string =>
    arr
        .map(
            (b) =>
                `${b.id}:${b.status}:${b.start_date}:${b.end_date}:${b.pricing?.total ?? ""}:${b.place?.cover_photo_url ?? ""}:${b.place?.title ?? ""}:${b.review?.status ?? ""}:${b.can_review}`,
        )
        .join("|");

// Build a date formatter defensively: some JS engines (Hermes) throw on rich
// Arabic locale strings (the -u-ca-gregory-nu-latn extensions), which would
// crash the whole screen. Fall back to en-US month names if so.
function safeDateFmt(locale: "ar" | "en"): Intl.DateTimeFormat {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    try {
        return new Intl.DateTimeFormat(
            locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
            opts,
        );
    } catch {
        return new Intl.DateTimeFormat("en-US", opts);
    }
}

function formatRange(startISO: string, endISO: string, locale: "ar" | "en"): string {
    const a = new Date(`${startISO}T00:00:00`);
    const b = new Date(`${endISO}T00:00:00`);
    const fmt = safeDateFmt(locale);
    if (startISO === endISO) return fmt.format(a);
    return `${fmt.format(a)} – ${fmt.format(b)}`;
}

function countdownLabel(startISO: string, t: (l: Localized) => string): string | null {
    const todayKey = dateKey(riyadhToday());
    if (startISO < todayKey) return null;
    const start = new Date(`${startISO}T00:00:00`).getTime();
    const base = new Date(`${todayKey}T00:00:00`).getTime();
    const diff = Math.round((start - base) / 86_400_000);
    if (diff <= 0) return t({ ar: "اليوم", en: "Today" });
    if (diff === 1) return t({ ar: "غداً", en: "Tomorrow" });
    return t({ ar: `بعد ${diff} يوم`, en: `in ${diff} days` });
}

export default function BookingsScreen() {
    const { locale } = useLocale();
    const t = useT();
    const isRTL = locale === "ar";
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isAuthed } = useAuthState();
    const { height: windowH } = useWindowDimensions();

    const headerHeight = insets.top + 70;

    // Seed from the module-level cache so a revisit renders instantly.
    const seed = getBookingsCache();
    const [items, setItems] = useState<ApiBookingListItem[]>(seed.items);
    const [page, setPage] = useState(seed.page);
    const [hasMore, setHasMore] = useState(seed.hasMore);
    const [loading, setLoading] = useState(!seed.loaded);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    // Last page-1 fingerprint, seeded from the cache so a revisit can also skip.
    const sigRef = useRef(seed.sig);

    const load = useCallback(async (nextPage: number) => {
        const res = await getBookings({ page: nextPage, per_page: PER_PAGE });
        if (nextPage === 1) {
            // Identical to what's shown → don't touch state (no re-render, no
            // flicker). Any already-loaded later pages stay as-is.
            const sig = bookingsSig(res.items);
            if (sig === sigRef.current && getBookingsCache().loaded) return;
            sigRef.current = sig;
            setItems(res.items);
            setHasMore(res.pagination.has_more);
            setPage(res.pagination.page);
            setBookingsCache({
                items: res.items,
                page: res.pagination.page,
                hasMore: res.pagination.has_more,
                loaded: true,
                sig,
            });
            return;
        }
        const base = getBookingsCache().items;
        const merged = [...base, ...res.items.filter((b) => !base.some((p) => p.id === b.id))];
        setItems(merged);
        setHasMore(res.pagination.has_more);
        setPage(res.pagination.page);
        setBookingsCache({
            items: merged,
            page: res.pagination.page,
            hasMore: res.pagination.has_more,
            loaded: true,
            sig: sigRef.current,
        });
    }, []);

    // On focus: render the cache instantly if we have one (skeleton only the very
    // first time), then refetch page 1 silently so a new booking / review shows up.
    useFocusEffect(
        useCallback(() => {
            if (!isAuthed) return;
            const cache = getBookingsCache();
            let active = true;
            const firstLoad = !cache.loaded;
            if (firstLoad) {
                setLoading(true);
            } else {
                setItems(cache.items);
                setPage(cache.page);
                setHasMore(cache.hasMore);
                setLoading(false);
            }
            const work = firstLoad
                ? Promise.all([load(1), sleep(MIN_SKELETON_MS)]).then(() => undefined)
                : load(1);
            work.catch(() => {
                /* keep whatever we already had */
            }).finally(() => {
                if (active) setLoading(false);
            });
            return () => {
                active = false;
            };
        }, [isAuthed, load]),
    );

    const onEndReached = () => {
        if (loading || loadingMore || !hasMore) return;
        setLoadingMore(true);
        load(page + 1)
            .catch(() => setHasMore(false))
            .finally(() => setLoadingMore(false));
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        invalidatePlaceCaches();
        // Hold the spinner briefly so a fast API still reads as a refresh.
        Promise.all([load(1).catch(() => {}), sleep(700)]).finally(() =>
            setRefreshing(false),
        );
    }, [load]);

    // Still-payable holds (backend order preserved).
    const pending = useMemo(() => items.filter(isPayable), [items]);

    const rows = useMemo<Row[]>(() => {
        // Everything except expired; payable holds pinned on top with a label.
        const pool = items.filter((b) => b.status !== "expired");
        const showPending = pending.length > 0;
        const pendingIds = new Set(pending.map((b) => b.id));
        // Keep the backend's order; just drop the payable holds (shown on top).
        const others = pool.filter((b) => !pendingIds.has(b.id));

        const out: Row[] = [];
        if (showPending) {
            out.push({ kind: "sep", label: t({ ar: "بانتظار الدفع", en: "Awaiting payment" }) });
            pending.forEach((booking) => out.push({ kind: "booking", booking }));
            if (others.length) {
                out.push({ kind: "sep", label: t({ ar: "حجوزات أخرى", en: "Other bookings" }) });
            }
        }
        others.forEach((booking) => out.push({ kind: "booking", booking }));
        return out;
    }, [items, pending, t]);

    const header = (
        <View style={[styles.headerWrap, { paddingBottom: Spacing[2] }]}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
            <View style={styles.headerTint} pointerEvents="none" />
            <SafeAreaView edges={["top"]}>
                <View style={styles.titleBar}>
                    <ThemedText
                        style={[
                            styles.title,
                            {
                                fontFamily: fontFamilyFor("bold", locale),
                                textAlign: "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {t(STR.bookings.title)}
                    </ThemedText>
                </View>
            </SafeAreaView>
        </View>
    );

    if (!isAuthed) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <SignInPrompt
                    message={{
                        ar: "سجل دخولك عشان تشوف حجوزاتك.",
                        en: "Sign in to see your bookings.",
                    }}
                />
            </SafeAreaView>
        );
    }

    const topInset = headerHeight + Spacing[5];
    const bottomPad = insets.bottom + Spacing[16];
    const contentPad = { paddingTop: topInset, paddingBottom: bottomPad };
    // iOS: refresh spinner must sit below the translucent header via contentInset.
    const iosScroll =
        Platform.OS === "ios"
            ? {
                  contentInset: { top: topInset },
                  contentOffset: { x: 0, y: -topInset },
                  scrollIndicatorInsets: { top: headerHeight },
              }
            : null;

    const isEmpty = rows.length === 0;
    // Height of the visible area between the header and the tab bar, so the empty
    // state sits centered there and bounces with the pull (never rests off-screen).
    const tabBar = insets.bottom + 64;
    const emptyHeight = Math.max(0, windowH - topInset - tabBar);

    return (
        <View style={styles.container}>
            {header}

            {loading ? (
                <FlatList
                    data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
                    keyExtractor={(i) => `s${i}`}
                    renderItem={() => <BookingSkeleton isRTL={isRTL} />}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    ItemSeparatorComponent={RowGap}
                    contentContainerStyle={[styles.scroll, contentPad]}
                />
            ) : (
                <FlatList
                    data={rows}
                    keyExtractor={(r) =>
                        r.kind === "booking" ? r.booking.id : `sep-${r.label}`
                    }
                    renderItem={({ item }) =>
                        item.kind === "sep" ? (
                            <SectionSeparator label={item.label} locale={locale} isRTL={isRTL} />
                        ) : (
                            <BookingRow
                                booking={item.booking}
                                isRTL={isRTL}
                                locale={locale}
                                t={t}
                                onPress={() => {
                                    setSelectedBooking(item.booking);
                                    router.push("/booking-info");
                                }}
                            />
                        )
                    }
                    ItemSeparatorComponent={RowGap}
                    showsVerticalScrollIndicator={false}
                    // flex:1 so the list always fills the screen (so an empty list is still
                    // pull-to-refreshable); content scrolling is unchanged.
                    style={styles.list}
                    {...iosScroll}
                    contentContainerStyle={[
                        styles.scroll,
                        {
                            paddingTop: Platform.OS === "ios" ? 0 : topInset,
                            paddingBottom: isEmpty ? 0 : bottomPad,
                        },
                    ]}
                    alwaysBounceVertical
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            progressViewOffset={Platform.OS === "ios" ? 0 : topInset}
                            tintColor={Colors.light.coral}
                            colors={[Colors.light.coral]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={[styles.emptyCenter, { height: emptyHeight }]}>
                            <ThemedText
                                style={[styles.emptyTitle, { fontFamily: fontFamilyFor("bold", locale) }]}
                            >
                                {t(STR.bookings.emptyUpcomingTitle)}
                            </ThemedText>
                            <ThemedText
                                style={[styles.emptyBody, { fontFamily: fontFamilyFor("regular", locale) }]}
                            >
                                {t(STR.bookings.emptyUpcomingBody)}
                            </ThemedText>
                        </View>
                    }
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    removeClippedSubviews
                    initialNumToRender={6}
                    windowSize={6}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingTop: Spacing[3] }}>
                                <BookingSkeleton isRTL={isRTL} />
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const RowGap = () => <View style={{ height: Spacing[3] }} />;

function SectionSeparator({
    label,
    locale,
    isRTL,
}: {
    label: string;
    locale: "ar" | "en";
    isRTL: boolean;
}) {
    return (
        <View style={[styles.sepRow, { flexDirection: "row" }]}>
            <ThemedText style={[styles.sepLabel, { fontFamily: fontFamilyFor("bold", locale) }]}>
                {label}
            </ThemedText>
            <View style={styles.sepLine} />
        </View>
    );
}

function BookingSkeleton({ isRTL }: { isRTL: boolean }) {
    const opacity = useSharedValue(0.55);
    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
            -1,
            true,
        );
    }, [opacity]);
    const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return (
        <View style={[styles.skelRow, { flexDirection: "row" }]}>
            <Animated.View style={[styles.thumb, styles.skelBlock, anim]} />
            <View style={[styles.body, { alignItems: "flex-start" }]}>
                <Animated.View style={[styles.skelLine, { width: "70%" }, anim]} />
                <Animated.View style={[styles.skelLine, { width: "45%" }, anim]} />
                <Animated.View style={[styles.skelLine, { width: "55%" }, anim]} />
            </View>
        </View>
    );
}

function BookingRow({
    booking,
    isRTL,
    locale,
    t,
    onPress,
}: {
    booking: ApiBookingListItem;
    isRTL: boolean;
    locale: "ar" | "en";
    t: (l: Localized) => string;
    onPress: () => void;
}) {
    const place = booking.place;
    const status = bookingStatusView(booking.status);
    const title = place
        ? pickLang(place.title_ar, place.title_en, place.title)
        : t({ ar: "حجز", en: "Booking" });
    const cityName = place?.city
        ? locale === "ar"
            ? place.city.name_ar
            : place.city.name_en
        : null;
    const areaName = place?.city_area
        ? locale === "ar"
            ? place.city_area.name_ar
            : place.city_area.name_en
        : null;
    const location = [cityName, areaName].filter(Boolean).join(" · ");
    const countdown = countdownLabel(booking.start_date, t);
    const dateLine = `${formatRange(booking.start_date, booking.end_date, locale)}${
        countdown ? ` · ${countdown}` : ""
    }`;

    return (
        <PressableScale
            scaleTo={0.985}
            haptic="forward"
            onPress={onPress}
            style={[styles.card, { flexDirection: "row" }]}
        >
            <Image
                source={place?.cover_photo_url ? { uri: place.cover_photo_url } : undefined}
                style={styles.thumb}
                contentFit="cover"
                transition={250}
            />
            <View style={styles.body}>
                <View style={[styles.topRow, { flexDirection: "row" }]}>
                    <ThemedText
                        numberOfLines={1}
                        style={[
                            styles.cardTitle,
                            {
                                fontFamily: fontFamilyFor("bold", locale),
                                textAlign: "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {title}
                    </ThemedText>
                    <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
                        <ThemedText
                            style={[
                                styles.statusChipText,
                                { color: status.fg, fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {t(status.label)}
                        </ThemedText>
                    </View>
                </View>

                {location ? (
                    <ThemedText
                        numberOfLines={1}
                        style={[
                            styles.cardMeta,
                            {
                                fontFamily: fontFamilyFor("regular", locale),
                                textAlign: "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {location}
                    </ThemedText>
                ) : null}

                <View style={[styles.bottomRow, { flexDirection: "row" }]}>
                    <ThemedText
                        numberOfLines={1}
                        style={[
                            styles.dateText,
                            {
                                fontFamily: fontFamilyFor("medium", locale),
                                textAlign: "left",
                            },
                        ]}
                    >
                        {dateLine}
                    </ThemedText>
                    <ThemedText style={[styles.price, { fontFamily: fontFamilyFor("bold", locale) }]}>
                        {booking.pricing?.total != null
                            ? formatSar(booking.pricing.total)
                            : "—"}
                    </ThemedText>
                </View>
            </View>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },

    headerWrap: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        zIndex: 10,
    },
    headerTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    titleBar: {
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[3],
        paddingBottom: Spacing[3],
    },
    title: {
        fontSize: 22,
        lineHeight: 44,
        color: TEXT_PRIMARY,
        letterSpacing: -0.3,
    },

    scroll: {
        paddingHorizontal: Spacing[5],
    },
    list: { flex: 1 },
    sepRow: {
        alignItems: "center",
        gap: Spacing[3],
        paddingTop: Spacing[2],
        paddingBottom: Spacing[1],
    },
    sepLabel: { fontSize: 13, lineHeight: 17, color: TEXT_SECONDARY },
    sepLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER },

    emptyCenter: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing[8],
        gap: Spacing[2],
    },
    emptyTitle: { fontSize: 18, lineHeight: 24, color: TEXT_PRIMARY, textAlign: "center" },
    emptyBody: { fontSize: 14, lineHeight: 21, color: Colors.light.textMuted, textAlign: "center" },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderCurve: "continuous",
        borderWidth: 0.5,
        borderColor: DIVIDER,
        padding: Spacing[2] + 2,
        alignItems: "center",
        gap: Spacing[3],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 3,
    },
    skelRow: {
        alignItems: "center",
        gap: Spacing[3],
        paddingVertical: Spacing[2] + 2,
    },
    thumb: {
        width: 84,
        height: 84,
        borderRadius: 14,
        borderCurve: "continuous",
        backgroundColor: "#F3F4F6",
    },
    body: { flex: 1, gap: Spacing[1] + 2, paddingVertical: 2 },
    topRow: { alignItems: "center", gap: Spacing[2] },
    cardTitle: { flex: 1, fontSize: 15, lineHeight: 20, color: TEXT_PRIMARY },
    cardMeta: { fontSize: 12, lineHeight: 16, color: TEXT_SECONDARY },
    bottomRow: {
        marginTop: Spacing[1],
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing[2],
    },
    dateText: { flex: 1, fontSize: 12, lineHeight: 16, color: TEXT_PRIMARY },
    price: { fontSize: 15, lineHeight: 20, color: TEXT_PRIMARY },
    statusChip: { paddingHorizontal: Spacing[2] + 2, paddingVertical: 3, borderRadius: 999 },
    statusChipText: { fontSize: 10, lineHeight: 13 },

    skelBlock: { backgroundColor: "#E5E7EB" },
    skelLine: { height: 12, borderRadius: 4, backgroundColor: "#E5E7EB" },
});
