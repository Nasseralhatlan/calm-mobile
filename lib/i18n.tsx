import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { I18nManager } from 'react-native';

import type { Locale, Localized } from '@/data/types';

interface LocaleContextValue {
  locale: Locale;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const FIXED_LOCALE: Locale = 'ar';

export function LocaleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale: FIXED_LOCALE, isRTL: true }),
    [],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useT() {
  return useCallback(<T,>(value: Localized<T>): T => value[FIXED_LOCALE], []);
}

export function pick<T>(value: Localized<T>, locale: Locale = FIXED_LOCALE): T {
  return value[locale];
}
