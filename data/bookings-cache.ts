import type { ApiBookingListItem } from '@/lib/api';

// Module-level cache for the bookings tab so a revisit renders instantly while a
// silent refetch updates it in the background (same approach as favorites).

export interface BookingsCache {
  items: ApiBookingListItem[];
  page: number;
  hasMore: boolean;
  /** True once we've successfully loaded at least page 1. */
  loaded: boolean;
  /** Fingerprint of page-1 data, so a focus refetch can detect "no change". */
  sig: string;
}

let cache: BookingsCache = { items: [], page: 1, hasMore: false, loaded: false, sig: '' };

export function getBookingsCache(): BookingsCache {
  return cache;
}

export function setBookingsCache(next: BookingsCache): void {
  cache = next;
}

/** Wipe on sign-out so the next user doesn't see the previous one's bookings. */
export function clearBookingsCache(): void {
  cache = { items: [], page: 1, hasMore: false, loaded: false, sig: '' };
}
