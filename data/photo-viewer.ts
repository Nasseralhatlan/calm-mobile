// Module store to hand a photo set + start index to the full-screen viewer
// route — route params can't carry arrays cleanly, so we stash it here and the
// viewer reads it on mount (same pattern as selected-booking / confirm-dialog).

export interface PhotoViewerItem {
  uri: string;
  // The section/room this photo belongs to (localized; viewer picks the string).
  section: { ar: string; en: string };
}

export interface PhotoViewerConfig {
  items: PhotoViewerItem[];
  index: number;
  // The place these photos belong to — lets the viewer wire like/share.
  placeId: string;
  likedFallback: boolean;
}

let config: PhotoViewerConfig | null = null;

export function setPhotoViewer(next: PhotoViewerConfig): void {
  config = next;
}

export function getPhotoViewer(): PhotoViewerConfig | null {
  return config;
}
