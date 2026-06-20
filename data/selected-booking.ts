import type { ApiBookingListItem } from '@/lib/api';

// The booking tapped on the list, handed to the booking-info route (which is a
// real stack screen so a native sheet can present above it).
let current: ApiBookingListItem | null = null;

export function setSelectedBooking(b: ApiBookingListItem | null): void {
  current = b;
}

export function getSelectedBooking(): ApiBookingListItem | null {
  return current;
}
