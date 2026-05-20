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

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}
