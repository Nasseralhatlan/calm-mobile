/**
 * Calendar-day key in `YYYY-MM-DD`, computed from the LOCAL date components
 * (not UTC) so it lines up with the calendar grid cells, which are built with
 * `new Date(year, month, day)` (local midnight). Using `toISOString()` here
 * would shift across the UTC boundary and mis-mark blocked days.
 *
 * Matches the `YYYY-MM-DD` strings returned by the unavailable-dates API.
 */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Today's calendar day, anchored to Asia/Riyadh (the venue timezone — see
 * CLAUDE.md "Dates: display in Asia/Riyadh"), returned as a LOCAL-midnight
 * Date so it's directly comparable to grid cells built via
 * `new Date(year, month, day)`. This keeps the "past day" gate aligned with
 * the server's day boundaries regardless of the device timezone.
 */
export function riyadhToday(): Date {
  // en-CA formats as "YYYY-MM-DD".
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = parts.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * True if any OCCUPIED day of a stay is blocked. The model is per-day, so the
 * stay occupies every day from start to end INCLUSIVE of both endpoints
 * (Sat + Sun = 2 occupied days). Self-contained: does not rely on the
 * calendar's disabled-cell guard, so a range can't slip through if the blocked
 * set arrives after the days were tapped.
 */
export function rangeHasBlockedDay(
  start: Date,
  end: Date,
  blocked: Set<string> | null | undefined,
): boolean {
  if (!blocked || blocked.size === 0) return false;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cur.getTime() <= end.getTime()) {
    if (blocked.has(dateKey(cur))) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}
