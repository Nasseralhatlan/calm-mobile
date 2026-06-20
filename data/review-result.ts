import type { ApiBookingReview } from '@/lib/api';

// Hand a freshly submitted review back from the leave-review modal to the
// booking-info screen underneath it (which reads + clears it on focus).
let result: { bookingId: string; review: ApiBookingReview } | null = null;

export function setReviewResult(r: { bookingId: string; review: ApiBookingReview }): void {
  result = r;
}

export function takeReviewResult(): { bookingId: string; review: ApiBookingReview } | null {
  const r = result;
  result = null;
  return r;
}
