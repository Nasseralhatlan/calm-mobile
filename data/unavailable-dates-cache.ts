import { ApiError, getUnavailableDates } from '@/lib/api';

/**
 * Module-level cache of blocked calendar days per place.
 *
 * The value is a `Set<string>` of `YYYY-MM-DD` keys (the exact format the API
 * returns and that `dateKey()` produces). Fetched in the background when the
 * user opens a place so the booking date picker can grey out blocked days the
 * instant it mounts — with no fetch the user can feel.
 *
 * Stale-while-revalidate: `getCachedUnavailableDates` returns whatever we have
 * for an instant paint, while `fetchUnavailableDates` always hits the network
 * (de-duped) and refreshes the cache. This matters because blocked dates change
 * server-side (a host blocking a day, then checking the guest calendar) and a
 * plain cache-once would keep serving the pre-block set for the whole session.
 */

const cache = new Map<string, Set<string>>();
const inFlight = new Map<string, Promise<Set<string>>>();

export function getCachedUnavailableDates(id: string): Set<string> | null {
  return cache.get(id) ?? null;
}

/** Drop cached blocked dates so the next place open refetches them. */
export function clearUnavailableDatesCache() {
  cache.clear();
  inFlight.clear();
}

/**
 * Always fetches from the network (de-duped per id) and updates the cache.
 * Use on every screen entry so freshly-changed blocked dates show up.
 */
export function fetchUnavailableDates(id: string): Promise<Set<string>> {
  const pending = inFlight.get(id);
  if (pending) return pending;

  const promise = getUnavailableDates(id)
    .then((res) => {
      const set = new Set(res.unavailable_dates ?? []);
      cache.set(id, set);
      inFlight.delete(id);
      return set;
    })
    .catch((err) => {
      inFlight.delete(id);
      // A 404 is a definitive "no blocked dates for this id" — cache an empty
      // set so we don't keep re-asking this session. Transient errors (network
      // blip, 5xx, timeout) are NOT cached, so the next entry retries instead
      // of permanently hiding real blocked dates.
      if (err instanceof ApiError && err.status === 404) {
        const empty = new Set<string>();
        cache.set(id, empty);
        return empty;
      }
      throw err;
    });

  inFlight.set(id, promise);
  return promise;
}
