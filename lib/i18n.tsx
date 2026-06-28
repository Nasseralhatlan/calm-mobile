import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getStoredLocale, setStoredLocale } from "@/data/locale-setting";
import type { Locale, Localized } from "@/data/types";
import { updateProfile } from "@/lib/api";

// JS/style-driven locale system. The user's chosen locale is the SINGLE source of
// truth — stored locally (default `ar`) and synced to the profile API. Direction
// is applied with a Yoga `direction` style at the app root (see app/_layout.tsx),
// NOT via native `I18nManager.forceRTL` — so switching is instant (no restart),
// independent of the device language, and works in Expo Go. Set to `false` to
// force English/LTR everywhere.
export const LOCALE_SWITCHING_ENABLED = true;

const DEFAULT_LOCALE: Locale = "ar";

// Module-level mirror of the active locale for non-React callers (`pick`,
// `pickLang`, lib/share). Kept in sync by LocaleProvider on hydrate/switch.
let currentLocale: Locale = LOCALE_SWITCHING_ENABLED ? DEFAULT_LOCALE : "en";

/** The active locale for code that runs outside React (no hook available). */
export function getCurrentLocale(): Locale {
    return currentLocale;
}

interface LocaleContextValue {
    locale: Locale;
    isRTL: boolean;
    /** True once the stored preference has been read (avoids a wrong first paint). */
    hydrated: boolean;
    /**
     * Switch the active locale. Persists locally and (unless `sync: false`) pushes
     * to the profile API. Re-renders the tree in the new direction immediately.
     */
    setLocale: (next: Locale, opts?: { sync?: boolean }) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(currentLocale);
    const [hydrated, setHydrated] = useState(false);

    // Hydrate from the stored preference on mount.
    useEffect(() => {
        let active = true;
        (async () => {
            const stored = LOCALE_SWITCHING_ENABLED
                ? await getStoredLocale()
                : "en";
            if (!active) return;
            currentLocale = stored;
            setLocaleState(stored);
            setHydrated(true);
        })();
        return () => {
            active = false;
        };
    }, []);

    const setLocale = useCallback(
        async (next: Locale, opts?: { sync?: boolean }) => {
            if (!LOCALE_SWITCHING_ENABLED) return;
            currentLocale = next;
            setLocaleState(next);
            await setStoredLocale(next);
            if (opts?.sync !== false) {
                // Best-effort; the local choice is authoritative for the UI.
                updateProfile({ locale: next }).catch(() => {});
            }
        },
        [],
    );

    const value = useMemo<LocaleContextValue>(
        () => ({
            locale,
            isRTL: LOCALE_SWITCHING_ENABLED ? locale === "ar" : false,
            hydrated,
            setLocale,
        }),
        [locale, hydrated, setLocale],
    );

    return (
        <LocaleContext.Provider value={value}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale(): LocaleContextValue {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
    return ctx;
}

export function useT() {
    const { locale } = useLocale();
    return useCallback(<T,>(value: Localized<T>): T => value[locale], [locale]);
}

/**
 * Text alignment that hugs the START edge of the active language (right in
 * Arabic, left in English). With native RTL pinned off, `textAlign` is resolved
 * relative to `writingDirection` — so `'left'` means "start" and the pairing
 * below flips automatically with the locale. Spread onto text: `style={[s.x, rtl]}`.
 */
export function useRtlText(): {
    textAlign: "left";
    writingDirection: "ltr" | "rtl";
} {
    const { isRTL } = useLocale();
    return useMemo(
        () => ({
            textAlign: "left",
            writingDirection: isRTL ? "rtl" : "ltr",
        }),
        [isRTL],
    );
}

export function pick<T>(
    value: Localized<T>,
    locale: Locale = currentLocale,
): T {
    return value[locale];
}

/**
 * Pick a string from the backend's separate bilingual fields (e.g. title_ar /
 * title_en) for the active language, with cross-language + legacy fallback —
 * mirrors the backend's recommended pick pattern. For places that go through the
 * adapter use the Localized model + useT()/pick() instead; this is for the
 * lightweight booking place summary that isn't adapted.
 */
export function pickLang(
    ar: string | null | undefined,
    en: string | null | undefined,
    fallback?: string | null,
): string {
    return (
        (currentLocale === "ar"
            ? ar || en || fallback
            : en || ar || fallback) || ""
    );
}
