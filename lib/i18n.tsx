import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { I18nManager } from "react-native";

import type { Locale, Localized } from "@/data/types";

// Arabic/RTL is TEMPORARILY DISABLED while we fix RTL layout issues. While off,
// the app is forced to English/LTR everywhere regardless of device language (the
// boot gate in app/_layout.tsx also pins the native canvas to LTR). Flip this to
// `true` to restore the full locale system (native reconcile-to-stored-locale,
// Arabic content, RTL canvas, and the in-app language toggle).
export const LOCALE_SWITCHING_ENABLED = false;

// Standard native RTL. The canvas direction is set natively via I18nManager and
// reconciled at boot from the user's stored setting (see the direction gate in
// app/_layout.tsx). Within a running session `I18nManager.isRTL` is the single
// source of truth; the content locale is coupled to it: RTL ⇒ ar, LTR ⇒ en.
const ACTIVE_LOCALE: Locale = LOCALE_SWITCHING_ENABLED
  ? I18nManager.isRTL
    ? "ar"
    : "en"
  : "en";
const ACTIVE_RTL = LOCALE_SWITCHING_ENABLED ? I18nManager.isRTL : false;

// The active layout direction (= native I18nManager.isRTL). Exported for use in
// static StyleSheets where the hook isn't available (e.g. physical textAlign).
export const LAYOUT_RTL = ACTIVE_RTL;

interface LocaleContextValue {
  locale: Locale;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const value = useMemo<LocaleContextValue>(
    () => ({ locale: ACTIVE_LOCALE, isRTL: ACTIVE_RTL }),
    [],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useCallback(<T,>(value: Localized<T>): T => value[ACTIVE_LOCALE], []);
}

export function pick<T>(value: Localized<T>, locale: Locale = ACTIVE_LOCALE): T {
  return value[locale];
}
