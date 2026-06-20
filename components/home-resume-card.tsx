import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { InterestCard } from '@/components/interest-card';
import { LastSearchCard } from '@/components/last-search-card';
import { PendingPaymentCard } from '@/components/pending-payment-card';
import { useAuthState } from '@/data/auth-state';
import { getTopInterest } from '@/data/place-interest';
import { loadLastSearch } from '@/data/last-search';
import { getPendingBookings, type ApiBookingListItem } from '@/lib/api';

const isPayable = (b: ApiBookingListItem): boolean =>
  b.status === 'pending_payment' &&
  !!b.expires_at &&
  new Date(b.expires_at).getTime() > Date.now();

type Which = 'pending' | 'interest' | 'search' | null;

/**
 * Home shows at most ONE resume card, by priority:
 * pending payment → place interest → last search.
 */
export function HomeResumeCard() {
  const { isAuthed } = useAuthState();
  const [which, setWhich] = useState<Which>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        // 1) Pending payment (network) — only when signed in.
        let hasPending = false;
        if (isAuthed) {
          try {
            const res = await getPendingBookings();
            hasPending = (res.items ?? []).some(isPayable);
          } catch {
            hasPending = false;
          }
        }
        if (!active) return;
        if (hasPending) {
          setWhich('pending');
          return;
        }
        // 2) Place interest (local).
        const interest = await getTopInterest();
        if (!active) return;
        if (interest) {
          setWhich('interest');
          return;
        }
        // 3) Last search (local).
        const last = await loadLastSearch();
        if (!active) return;
        setWhich(last ? 'search' : null);
      })();
      return () => {
        active = false;
      };
    }, [isAuthed]),
  );

  if (which === 'pending') return <PendingPaymentCard />;
  if (which === 'interest') return <InterestCard />;
  if (which === 'search') return <LastSearchCard />;
  return null;
}
