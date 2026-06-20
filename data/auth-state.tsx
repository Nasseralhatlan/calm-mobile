import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { clearBookingsCache } from '@/data/bookings-cache';
import { clearFavoritesCache } from '@/data/favorites-cache';
import {
  logoutUser,
  refreshAuthSession,
  setAuthBridge,
  setAuthToken,
  type ApiAuthUser,
} from '@/lib/api';

const TOKEN_KEY = 'calm.auth.token';
const USER_KEY = 'calm.auth.user';
const EXPIRES_KEY = 'calm.auth.expires';

// Refresh proactively when within this window of expiry (or already past it).
const REFRESH_SKEW_MS = 60_000;

const expiresAtFrom = (expiresIn?: number | null): number | null =>
  typeof expiresIn === 'number' && expiresIn > 0
    ? Date.now() + expiresIn * 1000
    : null;

interface AuthStateContext {
  token: string | null;
  user: ApiAuthUser | null;
  isAuthed: boolean;
  isHydrated: boolean;
  signIn: (
    token: string,
    user: ApiAuthUser,
    expiresIn?: number | null,
  ) => Promise<void>;
  updateUser: (user: ApiAuthUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthStateContext>({
  token: null,
  user: null,
  isAuthed: false,
  isHydrated: false,
  signIn: async () => {},
  updateUser: async () => {},
  signOut: async () => {},
});

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiAuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  // Mirror the current token + expiry so the AppState listener can read them
  // without re-subscribing on every change.
  const tokenRef = useRef<string | null>(null);
  const expiresAtRef = useRef<number | null>(null);

  const persistExpiry = useCallback(async (expiresAt: number | null) => {
    expiresAtRef.current = expiresAt;
    if (expiresAt == null) await SecureStore.deleteItemAsync(EXPIRES_KEY);
    else await SecureStore.setItemAsync(EXPIRES_KEY, String(expiresAt));
  }, []);

  // Drop the session locally (no network call — used when the token is already
  // dead, and as the tail of signOut).
  const clearLocal = useCallback(async () => {
    setToken(null);
    setUser(null);
    tokenRef.current = null;
    expiresAtRef.current = null;
    setAuthToken(null);
    clearFavoritesCache();
    clearBookingsCache();
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(EXPIRES_KEY),
    ]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [savedToken, savedUserJson, savedExpires] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
          SecureStore.getItemAsync(EXPIRES_KEY),
        ]);
        if (cancelled) return;
        const expiresAt = savedExpires ? Number(savedExpires) : null;
        if (savedToken) {
          setToken(savedToken);
          tokenRef.current = savedToken;
          expiresAtRef.current = Number.isFinite(expiresAt) ? expiresAt : null;
          setAuthToken(savedToken, expiresAtRef.current);
        }
        if (savedUserJson) {
          try { setUser(JSON.parse(savedUserJson) as ApiAuthUser); } catch {}
        }
      } catch (e) {
        console.warn('[auth] failed to hydrate', e);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(
    async (newToken: string, newUser: ApiAuthUser, expiresIn?: number | null) => {
      const expiresAt = expiresAtFrom(expiresIn);
      setToken(newToken);
      setUser(newUser);
      tokenRef.current = newToken;
      setAuthToken(newToken, expiresAt);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, newToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser)),
        persistExpiry(expiresAt),
      ]);
    },
    [persistExpiry],
  );

  const updateUser = useCallback(async (next: ApiAuthUser) => {
    setUser(next);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('[auth] logout API call failed', e);
    }
    await clearLocal();
  }, [clearLocal]);

  // Bridge the transport layer back into auth state: persist silently-refreshed
  // tokens, and tear down the session when the refresh window has lapsed.
  useEffect(() => {
    setAuthBridge({
      onTokenRefreshed: (newToken, expiresIn) => {
        const expiresAt = expiresAtFrom(expiresIn);
        setToken(newToken);
        tokenRef.current = newToken;
        void SecureStore.setItemAsync(TOKEN_KEY, newToken);
        void persistExpiry(expiresAt);
      },
      onAuthExpired: () => {
        void clearLocal();
      },
    });
    return () => setAuthBridge(null);
  }, [persistExpiry, clearLocal]);

  // Proactive refresh: when the app comes to the foreground (and once on mount),
  // refresh if the token is at/near expiry so the next call doesn't 401-stutter.
  useEffect(() => {
    const maybeRefresh = () => {
      const exp = expiresAtRef.current;
      if (!tokenRef.current || exp == null) return;
      if (Date.now() < exp - REFRESH_SKEW_MS) return;
      refreshAuthSession().catch(() => {
        void clearLocal();
      });
    };
    maybeRefresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') maybeRefresh();
    });
    return () => sub.remove();
  }, [clearLocal]);

  const value = useMemo<AuthStateContext>(
    () => ({
      token,
      user,
      isAuthed: Boolean(token),
      isHydrated,
      signIn,
      updateUser,
      signOut,
    }),
    [token, user, isHydrated, signIn, updateUser, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuthState(): AuthStateContext {
  return useContext(Ctx);
}
