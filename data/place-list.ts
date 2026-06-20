import type { ApiPlace } from '@/lib/api';

// Module store to hand a full place list (title + all items) to the "view all"
// screen — route params can't carry arrays, so we stash it and the screen reads
// it on mount (same pattern as photo-viewer / selected-booking).

export interface PlaceListConfig {
  title: string;
  places: ApiPlace[];
}

let config: PlaceListConfig | null = null;

export function setPlaceList(next: PlaceListConfig): void {
  config = next;
}

export function getPlaceList(): PlaceListConfig | null {
  return config;
}
