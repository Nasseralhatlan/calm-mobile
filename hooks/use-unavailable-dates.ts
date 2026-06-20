import { useEffect, useState } from 'react';

import {
  fetchUnavailableDates,
  getCachedUnavailableDates,
} from '@/data/unavailable-dates-cache';

/**
 * Returns the set of blocked `YYYY-MM-DD` days for a place.
 *
 * Cache-first: the booking flow fetches fresh blocked dates on the "Reserve"
 * tap (with a spinner) before navigating here, so the cache is warm and the
 * calendar shows blocked days on the first frame. We only fetch here as a
 * fallback when the cache is empty (e.g. a deep-link or the "change dates"
 * edit path that didn't go through Reserve this session).
 */
export function useUnavailableDates(id: string | undefined): Set<string> {
  const [blocked, setBlocked] = useState<Set<string>>(() =>
    id ? (getCachedUnavailableDates(id) ?? new Set()) : new Set(),
  );

  useEffect(() => {
    if (!id) return;
    const cached = getCachedUnavailableDates(id);
    if (cached) {
      setBlocked(cached);
      return;
    }
    let cancelled = false;
    fetchUnavailableDates(id)
      .then((set) => {
        if (!cancelled) setBlocked(set);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  return blocked;
}
