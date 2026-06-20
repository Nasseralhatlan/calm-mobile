import { getPlaceQuote, type ApiQuote } from '@/lib/api';

/**
 * Availability/pricing quotes are NEVER cached — price and bookability can
 * change at any moment, so every caller (dates picker "Next", order summary)
 * fetches a fresh quote straight from the server.
 */
export function fetchQuote(
  placeId: string,
  checkIn: string,
  checkOut: string,
  guests?: number,
): Promise<ApiQuote> {
  return getPlaceQuote(placeId, {
    check_in: checkIn,
    check_out: checkOut,
    guests,
  });
}
