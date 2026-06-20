import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

import { HOST_MODE_ENABLED } from '@/constants/features';
import { useAppMode } from '@/data/app-mode';
import { useAuthState } from '@/data/auth-state';

/**
 * Sends the user to whichever shell they last opened.
 * - Reads the persisted mode from `useAppMode()` (SecureStore-backed).
 * - On the first hydrated frame, replaces the route with `(host)` if mode === 'host'.
 * - Otherwise leaves them on `(tabs)`, which is the default anchor.
 *
 * While host mode is disabled (HOST_MODE_ENABLED) it does the opposite: it
 * actively bounces the user OUT of the host shell and resets any persisted
 * `host` mode, so a preserved navigation state or stale mode can't strand them
 * in host on reload.
 */
export function ModeBootstrap() {
  const router = useRouter();
  const segments = useSegments();
  const { mode, isHydrated: modeHydrated, setMode } = useAppMode();
  const { isHydrated: authHydrated } = useAuthState();
  const applied = useRef(false);

  const inHostShell = (segments as string[]).includes('(host)');

  // Host disabled: never allow the host shell.
  useEffect(() => {
    if (HOST_MODE_ENABLED) return;
    if (!modeHydrated) return;
    if (mode === 'host') setMode('guest').catch(() => {});
    if (inHostShell) router.replace('/(tabs)');
  }, [inHostShell, mode, modeHydrated, setMode, router]);

  // Host enabled: restore the last shell once on launch.
  useEffect(() => {
    if (!HOST_MODE_ENABLED) return;
    if (applied.current) return;
    if (!modeHydrated || !authHydrated) return;
    applied.current = true;
    if (mode === 'host') {
      router.replace('/(host)');
    }
  }, [mode, modeHydrated, authHydrated, router]);

  return null;
}
