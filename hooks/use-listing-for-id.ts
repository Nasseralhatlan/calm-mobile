import { useEffect, useMemo, useState } from 'react';

import { useHomeData } from '@/data/home';
import { adaptApiPlaceToListing } from '@/data/place-adapter';
import {
  fetchPlaceFresh,
  getCachedPlaceDetail,
} from '@/data/place-detail-cache';
import type { Listing } from '@/data/types';
import type { ApiPlaceDetail } from '@/lib/api';

interface UseListingForIdResult {
  listing: Listing | undefined;
  apiDetail: ApiPlaceDetail | null;
}

/**
 * Resolves a listing for an `[id]` route in two stages:
 *   1. API place found in cached home/lists (instant placeholder).
 *   2. `GET /api/places/{id}` — paints instantly from cache, then always
 *      revalidates via `fetchPlaceFresh` (stale-while-revalidate). Sub-screens
 *      (description, amenities, photos) seed from the cache while it refreshes.
 */
export function useListingForId(id: string | undefined): UseListingForIdResult {
  const home = useHomeData();

  const apiInitial = useMemo(() => {
    if (!id) return null;
    const pool = [
      ...(home?.mostLiked ?? []),
      ...(home?.lists ?? []).flatMap((l) => l.places),
    ];
    return pool.find((p) => p.id === id) ?? null;
  }, [home, id]);

  // Seed from the cache so screens opened after the listing detail render
  // the full data instantly with no fetch.
  const [apiDetail, setApiDetail] = useState<ApiPlaceDetail | null>(() =>
    id ? getCachedPlaceDetail(id) : null,
  );

  useEffect(() => {
    if (!id) return;
    // Always revalidate (we may have painted from a stale cache above).
    let cancelled = false;
    fetchPlaceFresh(id)
      .then((res) => {
        if (!cancelled) setApiDetail(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const listing = useMemo<Listing | undefined>(() => {
    if (apiDetail) return adaptApiPlaceToListing(apiDetail, apiDetail);
    if (apiInitial) return adaptApiPlaceToListing(apiInitial, null);
    return undefined;
  }, [apiDetail, apiInitial]);

  return { listing, apiDetail };
}
