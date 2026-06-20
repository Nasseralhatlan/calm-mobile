import { Image as RNImage } from 'react-native';

/**
 * Module-level cache of `width / height` for photo URLs.
 * Populated proactively from the listing detail screen so the gallery
 * can render each image at its natural aspect ratio on the first frame —
 * no placeholder size, no re-flow, no flicker.
 */

const cache = new Map<string, number>();

export function getAspect(url: string): number | null {
  return cache.get(url) ?? null;
}

export function setAspect(url: string, aspect: number) {
  if (aspect > 0) cache.set(url, aspect);
}

export function prefetchAspect(url: string): Promise<number | null> {
  const existing = cache.get(url);
  if (existing !== undefined) return Promise.resolve(existing);
  return new Promise((resolve) => {
    RNImage.getSize(
      url,
      (w, h) => {
        if (w > 0 && h > 0) {
          const a = w / h;
          cache.set(url, a);
          resolve(a);
        } else {
          resolve(null);
        }
      },
      () => resolve(null),
    );
  });
}
