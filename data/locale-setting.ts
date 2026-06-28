import * as SecureStore from 'expo-secure-store';

import type { Locale } from '@/data/types';

// The user's chosen locale/direction, persisted locally (NOT device-derived).
// `ar` ⇒ RTL, `en` ⇒ LTR. Default `ar`. This is the single source of truth for
// the active locale: LocaleProvider (lib/i18n) hydrates from it and drives the
// layout direction via a Yoga `direction` style at the app root — no native
// I18nManager/forceRTL, so switching is instant and device-independent.

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
