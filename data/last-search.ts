import * as SecureStore from 'expo-secure-store';

import type { AppliedFilters } from '@/data/search-filters';

type Localized = { ar: string; en: string };

// The user's most recent search, persisted locally so the home screen can offer
// to resume it. Purely a local convenience — never sent to the server.
export interface LastSearch {
  filters: AppliedFilters;
  city: Localized | null;
  areas: Localized[];
  types: Localized[];
  // Cover photos of the top-rated results (up to 3) — shown as a stacked deck.
  thumbs: string[];
  // Index of the first result the user was looking at when they left, so the
  // resume card can scroll back to roughly where they stopped.
  progressIndex?: number;
}

const KEY = 'calm.lastSearch';

// undefined = not yet loaded from disk; null = loaded, nothing stored.
let cache: LastSearch | null | undefined;

export async function loadLastSearch(): Promise<LastSearch | null> {
  if (cache !== undefined) return cache;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    cache = raw ? (JSON.parse(raw) as LastSearch) : null;
  } catch {
    cache = null;
  }
  return cache;
}

export async function saveLastSearch(next: LastSearch): Promise<void> {
  cache = next;
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
}

/**
 * Update just the thumbnails of the stored last search (called once results
 * load, with the top-rated places' photos). No-op if there's no stored search.
 */
export async function setLastSearchThumbs(thumbs: string[]): Promise<void> {
  const cur = await loadLastSearch();
  if (!cur) return;
  cache = { ...cur, thumbs };
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(cache));
  } catch {
    /* best-effort */
  }
}

/** Remember how far the user scrolled in the results (first-visible index). */
export async function setLastSearchProgress(index: number): Promise<void> {
  const cur = await loadLastSearch();
  if (!cur || cur.progressIndex === index) return;
  cache = { ...cur, progressIndex: index };
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(cache));
  } catch {
    /* best-effort */
  }
}

export async function clearLastSearch(): Promise<void> {
  cache = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* best-effort */
  }
}
