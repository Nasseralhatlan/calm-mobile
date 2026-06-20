import * as SecureStore from 'expo-secure-store';

// Local "interest score" per place, accumulated from what the user does on the
// details page. The home screen surfaces the single highest-scoring place above
// a threshold as a resume card. Purely local — never sent to the server.

type Localized = { ar: string; en: string };

export interface PlaceInterest {
  placeId: string;
  title: Localized;
  thumb: string | null;
  city?: Localized;
  area?: Localized;
  guests?: number;
  score: number; // 0..100, raw (undecayed)
  intent: boolean; // tapped Reserve — strong booking intent
  updatedAt: number; // epoch ms (for time decay)
}

export interface PlaceMeta {
  city?: Localized;
  area?: Localized;
  guests?: number;
}

const KEY = 'calm.placeInterest';
const MAX_ENTRIES = 12;
// Score fades to zero over this window since the last visit.
const DECAY_MS = 3 * 24 * 60 * 60 * 1000;
// Minimum (decayed) score required to surface the home card.
export const INTEREST_THRESHOLD = 45;

let cache: Record<string, PlaceInterest> | undefined;

async function load(): Promise<Record<string, PlaceInterest>> {
  if (cache) return cache;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, PlaceInterest>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

async function persist(): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(cache ?? {}));
  } catch {
    /* best-effort */
  }
}

function decayed(it: PlaceInterest, now: number): number {
  const age = now - it.updatedAt;
  if (age <= 0) return it.score;
  if (age >= DECAY_MS) return 0;
  return Math.round(it.score * (1 - age / DECAY_MS));
}

// Each (placeId|signal) scores once per app session — resets on cold start.
const counted = new Set<string>();

function prune(map: Record<string, PlaceInterest>): void {
  const ids = Object.keys(map);
  if (ids.length > MAX_ENTRIES) {
    ids
      .sort((a, b) => map[a].updatedAt - map[b].updatedAt)
      .slice(0, ids.length - MAX_ENTRIES)
      .forEach((id) => delete map[id]);
  }
}

/**
 * Ensure a place has an entry with up-to-date title/thumb so the card can render.
 * Called when a place's details page loads. Does not change the score.
 */
export async function seedPlace(
  placeId: string,
  title: Localized,
  thumb: string | null,
  meta?: PlaceMeta,
): Promise<void> {
  const map = await load();
  const now = Date.now();
  const prev = map[placeId];
  map[placeId] = {
    placeId,
    title,
    thumb,
    city: meta?.city ?? prev?.city,
    area: meta?.area ?? prev?.area,
    guests: meta?.guests ?? prev?.guests,
    score: prev ? decayed(prev, now) : 0,
    intent: prev?.intent ?? false,
    updatedAt: now,
  };
  prune(map);
  await persist();
}

/**
 * Add points for an interaction signal, counted once per session per place.
 * Any screen (details / gallery / viewer) can call this with the place id.
 */
export async function addPlaceInterest(
  placeId: string,
  signal: string,
  points: number,
  opts?: { intent?: boolean },
): Promise<void> {
  const dedupe = `${placeId}|${signal}`;
  if (counted.has(dedupe)) return;
  counted.add(dedupe);

  const map = await load();
  const now = Date.now();
  const prev = map[placeId];
  const base = prev ? decayed(prev, now) : 0;
  const entry: PlaceInterest = prev ?? {
    placeId,
    title: { ar: '', en: '' },
    thumb: null,
    score: 0,
    intent: false,
    updatedAt: now,
  };
  entry.score = Math.min(100, base + Math.round(points));
  entry.intent = entry.intent || !!opts?.intent;
  entry.updatedAt = now;
  map[placeId] = entry;
  prune(map);
  await persist();
}

/**
 * The highest-scoring place that qualifies. Booking intent (tapped Reserve)
 * always qualifies once it has any score; browse-only must clear the threshold.
 */
export async function getTopInterest(): Promise<PlaceInterest | null> {
  const map = await load();
  const now = Date.now();
  let best: PlaceInterest | null = null;
  for (const it of Object.values(map)) {
    const s = decayed(it, now);
    const qualifies = it.intent ? s > 0 : s >= INTEREST_THRESHOLD;
    if (qualifies && (!best || s > best.score)) {
      best = { ...it, score: s };
    }
  }
  return best;
}

/** Forget a place (Clear button, or once a real booking is created for it). */
export async function clearInterest(placeId: string): Promise<void> {
  const map = await load();
  if (map[placeId]) {
    delete map[placeId];
    await persist();
  }
}

/** Wipe all interest entries (used by the home "Clear" action). */
export async function clearAllInterest(): Promise<void> {
  cache = {};
  counted.clear();
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* best-effort */
  }
}
