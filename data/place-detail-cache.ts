import { getPlace, type ApiPlaceDetail } from '@/lib/api';

/**
 * Module-level cache for fetched place detail responses.
 *
 * Stale-while-revalidate: `getCachedPlaceDetail` returns whatever we have for an
 * instant paint, while `fetchPlaceFresh` ALWAYS hits the network (de-duped per
 * id) and refreshes the cache. So every screen — listing detail, description,
 * amenities, photos — paints immediately from cache but still ends up showing
 * fresh data.
 *
 * De-dupe: if two screens call `fetchPlaceFresh` in the same frame, only one
 * HTTP request goes out and both promises resolve with the same response.
 */

const cache = new Map<string, ApiPlaceDetail>();
const inFlight = new Map<string, Promise<ApiPlaceDetail>>();

export function getCachedPlaceDetail(id: string): ApiPlaceDetail | null {
  return cache.get(id) ?? null;
}

export function setCachedPlaceDetail(detail: ApiPlaceDetail) {
  cache.set(detail.id, detail);
}

/** Drop all cached place detail so the next open refetches (used on refresh). */
export function clearPlaceDetailCache() {
  cache.clear();
  inFlight.clear();
}

/**
 * Always fetches from the network (de-duped per id) and updates the cache.
 * Pair with `getCachedPlaceDetail` for an instant paint while this revalidates.
 */
export function fetchPlaceFresh(id: string): Promise<ApiPlaceDetail> {
  const pending = inFlight.get(id);
  if (pending) return pending;

  const promise = getPlace(id)
    .then((res) => {
      cache.set(id, res);
      inFlight.delete(id);
      return res;
    })
    .catch((err) => {
      inFlight.delete(id);
      throw err;
    });

  inFlight.set(id, promise);
  return promise;
}
