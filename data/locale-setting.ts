import * as SecureStore from 'expo-secure-store';

import type { Locale } from '@/data/types';

// The user's chosen locale/direction, persisted locally (NOT device-derived).
// `ar` ⇒ RTL, `en` ⇒ LTR. Default `ar`. The actual canvas direction is applied
// natively via I18nManager and reconciled from this value at boot (see the
// direction gate in app/_layout.tsx); within a session `I18nManager.isRTL` is
// the source of truth and always matches this setting.

const LOCALE_KEY = 'calm.locale';

export async function getStoredLocale(): Promise<Locale> {
  try {
    const v = await SecureStore.getItemAsync(LOCALE_KEY);
    return v === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export async function setStoredLocale(locale: Locale): Promise<void> {
  try {
    await SecureStore.setItemAsync(LOCALE_KEY, locale);
  } catch {
    /* best-effort */
  }
}
