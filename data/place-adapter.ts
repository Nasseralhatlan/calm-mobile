import type { ApiPlace, ApiPlaceDetail } from '@/lib/api';

import type { AmenityId, Listing, ListingType } from './types';

const TYPE_KEYWORD_MAP: { match: RegExp; type: ListingType }[] = [
  { match: /chalet|شاليه/i, type: 'chalet' },
  { match: /rest|استراحة|استراحات/i, type: 'rest_house' },
  { match: /camp|مخيم/i, type: 'camp' },
  { match: /farm|مزرعة|مزارع/i, type: 'farm' },
];

function inferType(name: string): ListingType {
  for (const { match, type } of TYPE_KEYWORD_MAP) {
    if (match.test(name)) return type;
  }
  return 'chalet';
}

/**
 * Maps API place data into the local `Listing` shape so the existing
 * listing detail screen can render it without changes.
 *
 * Missing API fields (capacity, coordinates, cleaning/service fees,
 * amenities) get safe defaults — sections will show as empty until the
 * backend exposes them.
 */
export function adaptApiPlaceToListing(
  p: ApiPlace,
  d?: ApiPlaceDetail | null,
): Listing {
  // The card/hero showcase uses the curated featured photos (already ordered,
  // [0] = cover). Fall back to the cover + the gallery sorted by sort_order
  // when a lean payload omits featured_photos.
  let photoUrls: string[];
  if (p.featured_photos && p.featured_photos.length > 0) {
    photoUrls = p.featured_photos.map((f) => f.url);
  } else {
    photoUrls = [];
    if (p.cover_photo_url) photoUrls.push(p.cover_photo_url);
    const sorted = [...(p.photos ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    for (const ph of sorted) {
      if (!photoUrls.includes(ph.url)) photoUrls.push(ph.url);
    }
  }

  return {
    id: p.id,
    type: inferType(p.type.name_en + ' ' + p.type.name_ar),
    // Bilingual fields with cross-language + legacy fallback (matches the
    // backend's pick pattern); useT()/pick() then select the active language.
    title: {
      ar: p.title_ar || p.title_en || p.title,
      en: p.title_en || p.title_ar || p.title,
    },
    description: {
      ar: p.description_ar || p.description_en || p.description,
      en: p.description_en || p.description_ar || p.description,
    },
    rules:
      p.rules_ar || p.rules_en || p.rules
        ? {
            ar: p.rules_ar || p.rules_en || p.rules || '',
            en: p.rules_en || p.rules_ar || p.rules || '',
          }
        : undefined,
    city: { ar: p.city.name_ar, en: p.city.name_en },
    region: p.city_area
      ? { ar: p.city_area.name_ar, en: p.city_area.name_en }
      : { ar: '', en: '' },
    // Only max_guests is on the API today (0 = not provided → hidden in UI).
    capacity: {
      guests: typeof p.max_guests === 'number' ? p.max_guests : 0,
    },
    // Amenities aren't safely mappable yet — API returns attribute UUIDs
    // while the local AmenityId is a fixed enum used as a key into AMENITIES.
    // Leave empty until we ship a real attribute → amenity mapping.
    amenities: [] as AmenityId[],
    photos: photoUrls,
    // Pricing in the local Listing shape stores halalas; API gives SAR int.
    pricing: {
      nightly: Math.round(p.price * 100),
    },
    // Host id is only on the detail payload.
    hostId: d?.host.id,
    rating: { average: p.rating.avg ?? 0, count: p.rating.count },
    createdAt: p.created_at,
    checkInTime: p.check_in_time,
    checkOutTime: p.check_out_time,
    checkoutNextDay: p.checkout_next_day ?? false,
    isLiked: p.is_liked,
    likesCount: p.likes_count,
  };
}
