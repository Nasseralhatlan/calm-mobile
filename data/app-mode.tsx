import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppMode = 'guest' | 'host';

const MODE_KEY = 'calm.app.mode';

interface AppModeContext {
  mode: AppMode;
  isHydrated: boolean;
  setMode: (next: AppMode) => Promise<void>;
}

const Ctx = createContext<AppModeContext>({
  mode: 'guest',
  isHydrated: false,
  setMode: async () => {},
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('guest');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(MODE_KEY);
        if (cancelled) return;
        if (saved === 'host' || saved === 'guest') setModeState(saved);
      } catch (e) {
        console.warn('[app-mode] hydrate failed', e);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(async (next: AppMode) => {
    setModeState(next);
    try {
      await SecureStore.setItemAsync(MODE_KEY, next);
    } catch (e) {
      console.warn('[app-mode] persist failed', e);
    }
  }, []);

  const value = useMemo(
    () => ({ mode, isHydrated, setMode }),
    [mode, isHydrated, setMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppMode(): AppModeContext {
  return useContext(Ctx);
}
