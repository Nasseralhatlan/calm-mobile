import { Share } from 'react-native';

import { getCurrentLocale } from '@/lib/i18n';

// Public web origin for shareable links. Falls back to production when the env
// var is unset (e.g. EAS cloud builds don't upload the gitignored .env), so a
// real link is always shared — mirrors lib/api.ts and lib/info-pages.ts.
const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://calmapp.co';

/**
 * Open the native share sheet for a place. Shares the public web link
 * (`{WEB_ORIGIN}/places/{uuid}`) with a short, branded, bilingual message so
 * the recipient sees context plus the link. Silently no-ops if the user
 * dismisses or sharing is unavailable.
 */
export async function sharePlace(placeId: string, title?: string): Promise<void> {
  const isRTL = getCurrentLocale() === 'ar';
  const url = placeId ? `${WEB_ORIGIN}/places/${placeId}` : undefined;

  const intro = title
    ? isRTL
      ? `«${title}» على كالم`
      : `Check out ${title} on Calm`
    : isRTL
      ? 'شوف هذا المكان على كالم'
      : 'Check out this place on Calm';

  // Put the URL only in the message (apps still auto-detect it for previews).
  // Passing `url` separately too would duplicate the link on some targets.
  const message = url ? `${intro}\n\n${url}` : intro;

  try {
    await Share.share({
      message,
      ...(title ? { title } : {}),
    });
  } catch {
    /* dismissed / unavailable — nothing to do */
  }
}

/**
 * Open the native share sheet with a prepared text message (already localized /
 * formatted by the caller). Silently no-ops if dismissed or unavailable.
 */
export async function shareText(message: string, title?: string): Promise<void> {
  try {
    await Share.share({
      message,
      ...(title ? { title } : {}),
    });
  } catch {
    /* dismissed / unavailable — nothing to do */
  }
}
