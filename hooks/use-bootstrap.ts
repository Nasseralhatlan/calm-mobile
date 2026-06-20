import { useCallback, useEffect, useState } from 'react';

import {
  getCities,
  getCountries,
  getMostLikedPlaces,
  getPlaceLists,
  getPlaceTypes,
  getSettings,
  type ApiCity,
  type ApiCountry,
  type ApiPlace,
  type ApiPlaceList,
  type ApiPlaceType,
  type ApiSettings,
} from '@/lib/api';

export interface HomeData {
  countries: ApiCountry[];
  cities: ApiCity[];
  placeTypes: ApiPlaceType[];
  lists: ApiPlaceList[];
  mostLiked: ApiPlace[];
  settings: ApiSettings | null;
}

const TIMEOUT_MS = 8000;

async function fetchHomeData(signal?: AbortSignal): Promise<HomeData> {
  const opts = { signal };
  const [countries, cities, placeTypes, lists, mostLiked, settings] = await Promise.all([
    getCountries(opts),
    getCities(opts),
    getPlaceTypes(opts),
    getPlaceLists(opts),
    getMostLikedPlaces(opts),
    // Non-critical — never let a settings failure break the home load.
    getSettings(opts).catch(() => null),
  ]);
  return { countries, cities, placeTypes, lists, mostLiked, settings };
}

export function useBootstrap() {
  const [isReady, setIsReady] = useState(false);
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    fetchHomeData(ctrl.signal)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e as Error);
        console.warn('[bootstrap] preload failed', e);
      })
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  // Pull-to-refresh: re-fetch the home payload and swap it in (no abort timer
  // so a slow connection still completes).
  const refresh = useCallback(async () => {
    try {
      const d = await fetchHomeData();
      setData(d);
    } catch (e) {
      console.warn('[bootstrap] refresh failed', e);
    }
  }, []);

  return { isReady, data, error, refresh };
}
