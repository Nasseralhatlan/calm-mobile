import type { ApiPlace } from '@/lib/api';

// Module-level cache for the favorites tab. The list is fetched once and reused
// across visits; a like/unlike marks it stale so the next visit refetches.

export interface FavoritesCache {
  items: ApiPlace[];
  page: number;
  hasMore: boolean;
  /** True once we've successfully loaded at least page 1. */
  loaded: boolean;
}

let cache: FavoritesCache = { items: [], page: 1, hasMore: false, loaded: false };
let stale = true;

export function getFavoritesCache(): FavoritesCache {
  return cache;
}

export function setFavoritesCache(next: FavoritesCache): void {
  cache = next;
  stale = false;
}

export function isFavoritesStale(): boolean {
  return stale;
}

/** Call after any like/unlike so the next favorites visit refetches. */
export function markFavoritesStale(): void {
  stale = true;
}

/** Wipe on sign-out so the next user doesn't see the previous one's list. */
export function clearFavoritesCache(): void {
  cache = { items: [], page: 1, hasMore: false, loaded: false };
  stale = true;
}
