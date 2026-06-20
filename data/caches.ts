import { clearPlaceDetailCache } from './place-detail-cache';
import { clearUnavailableDatesCache } from './unavailable-dates-cache';

/**
 * Drop the per-place caches so the next time a place is opened it fetches the
 * latest detail and blocked dates. Call this from pull-to-refresh. (Quotes are
 * never cached, so there's nothing to clear there.)
 */
export function invalidatePlaceCaches(): void {
  clearPlaceDetailCache();
  clearUnavailableDatesCache();
}
