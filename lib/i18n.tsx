import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { I18nManager } from 'react-native';

import { currentUser } from '@/data/auth';
import type { Locale, Localized } from '@/data/types';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(currentUser.preferredLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    const wantsRTL = next === 'ar';
    if (I18nManager.isRTL !== wantsRTL) {
      I18nManager.allowRTL(wantsRTL);
      I18nManager.forceRTL(wantsRTL);
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, isRTL: locale === 'ar' }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useT() {
  const { locale } = useLocale();
  return useCallback(<T,>(value: Localized<T>): T => value[locale], [locale]);
}

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}
