import { Share } from 'react-native';

/**
 * Open the native share sheet for a place. Shares the public web link
 * (`EXPO_PUBLIC_WEB_URL/listing/{id}`) with the title as the message. Silently
 * no-ops if the user dismisses or sharing is unavailable.
 */
export async function sharePlace(placeId: string, title?: string): Promise<void> {
  const web = process.env.EXPO_PUBLIC_WEB_URL;
  const url = placeId && web ? `${web}/listing/${placeId}` : undefined;
  try {
    if (url) {
      await Share.share({
        message: title ? `${title}\n${url}` : url,
        url,
        ...(title ? { title } : {}),
      });
    } else {
      await Share.share({ message: title ?? 'Calm' });
    }
  } catch {
    /* dismissed / unavailable — nothing to do */
  }
}
