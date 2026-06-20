import type { Locale } from '@/data/types';

const LOCALE_TAG: Record<Locale, string> = {
  ar: 'ar-SA',
  en: 'en-SA',
};

export function formatMoney(halalas: number, locale: Locale, opts?: { showCurrency?: boolean }): string {
  const sar = halalas / 100;
  const fmt = new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: opts?.showCurrency === false ? 'decimal' : 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  });
  return fmt.format(sar);
}

export function formatPriceSR(halalas: number): string {
  const sar = halalas / 100;
  const num = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(sar);
  return `${num} SR`;
}

export function formatSarInt(sar: number): string {
  const num = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(sar);
  return `${num} SR`;
}

/** Format a SAR amount that may be fractional (e.g. VAT 1402.5 → "1,402.5 SR"). */
export function formatSar(sar: number): string {
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(sar);
  return `${num} SR`;
}

/**
 * "15:00" → "3:00 PM", "08:30" → "8:30 AM".
 * Returns the input unchanged if it can't parse it.
 */
export function formatTime12(time24: string | null | undefined): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Always renders the number in Latin digits even in Arabic locale.
// Output looks like: "SR 2,660" (or "SR 2,660.98" if you pass decimals=2).
export function formatMoneyEn(halalas: number, decimals: number = 0): string {
  const sar = halalas / 100;
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(sar);
  return `SR ${num}`;
}

export function formatDateRange(checkIn: string, checkOut: string, locale: Locale): string {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const dayFmt = new Intl.DateTimeFormat(LOCALE_TAG[locale], { day: 'numeric' });
  const monthFmt = new Intl.DateTimeFormat(LOCALE_TAG[locale], { month: 'short' });
  const fullFmt = new Intl.DateTimeFormat(LOCALE_TAG[locale], { day: 'numeric', month: 'short' });

  if (sameMonth) {
    return `${dayFmt.format(start)} – ${dayFmt.format(end)} ${monthFmt.format(start)}`;
  }
  return `${fullFmt.format(start)} – ${fullFmt.format(end)}`;
}

/**
 * Number of billed DAYS for a stay. The model is per-day, not per-night:
 * the range [start, end] is inclusive of both endpoints (Sat + Sun = 2 days),
 * so a single day is 1 and start..end spans (diff + 1) days.
 */
export function daysBetweenInclusive(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}
