import { useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuthState } from '@/data/auth-state';
import { markFavoritesStale } from '@/data/favorites-cache';
import { likePlace, unlikePlace } from '@/lib/api';

interface LikesContextValue {
  /**
   * The displayed liked state for a place. `fallback` is the value carried on
   * the card itself (`ApiPlace.is_liked` / `Listing.isLiked`); a local
   * optimistic override takes precedence once the user taps.
   */
  isLiked: (id: string, fallback?: boolean) => boolean;
  /** Optimistically flip + persist via the API; revert on failure. */
  toggle: (id: string, currentLiked: boolean) => void;
}

const LikesContext = createContext<LikesContextValue | null>(null);

export function LikesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthed } = useAuthState();
  // id → liked override layered on top of each card's own is_liked.
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());

  const set = useCallback((id: string, liked: boolean) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, liked);
      return next;
    });
  }, []);

  const isLiked = useCallback(
    (id: string, fallback = false) => (overrides.has(id) ? overrides.get(id)! : fallback),
    [overrides],
  );

  const toggle = useCallback(
    (id: string, currentLiked: boolean) => {
      // Liking requires an account — send guests to the login modal instead.
      if (!isAuthed) {
        router.push('/login');
        return;
      }
      const next = !currentLiked;
      set(id, next); // optimistic
      // The favorites list changed — force a refetch next time it's opened.
      markFavoritesStale();
      const call = next ? likePlace(id, {}) : unlikePlace(id, {});
      call.catch(() => set(id, currentLiked)); // revert on failure
    },
    [isAuthed, router, set],
  );

  const value = useMemo(() => ({ isLiked, toggle }), [isLiked, toggle]);

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes(): LikesContextValue {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error('useLikes must be used within LikesProvider');
  return ctx;
}
