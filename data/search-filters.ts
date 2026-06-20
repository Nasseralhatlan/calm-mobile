// The active search query, shared between the search modal (sets city/type/
// area), the filters modal (refines price/guests/amenities/area/type), and the
// results screen (reads it to call /places/search). A version counter lets the
// results screen detect changes and refetch.

export interface AppliedFilters {
  cityId: string;
  cityLabel: string;
  areaIds: string[];
  typeIds: string[];
  amenityIds: string[];
  priceMin: number | null;
  priceMax: number | null;
  guests: number | null;
}

const EMPTY: AppliedFilters = {
  cityId: '',
  cityLabel: '',
  areaIds: [],
  typeIds: [],
  amenityIds: [],
  priceMin: null,
  priceMax: null,
  guests: null,
};

let current: AppliedFilters = EMPTY;
let version = 0;

export function getAppliedFilters(): AppliedFilters {
  return current;
}

export function getFiltersVersion(): number {
  return version;
}

/** Replace the whole query (used by the search modal on a new search). */
export function setAppliedFilters(next: AppliedFilters): void {
  current = next;
  version += 1;
}

/** Merge a partial update (used by the filters modal on apply). */
export function patchAppliedFilters(patch: Partial<AppliedFilters>): void {
  current = { ...current, ...patch };
  version += 1;
}
