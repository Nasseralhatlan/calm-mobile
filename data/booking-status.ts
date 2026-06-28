import type { BookingApiStatus } from '@/lib/api';

type Localized = { ar: string; en: string };
export interface StatusView {
  bg: string;
  fg: string;
  label: Localized;
}

export const BOOKING_STATUS_THEME: Record<BookingApiStatus, StatusView> = {
  pending_payment: { bg: '#FEF3C7', fg: '#B45309', label: { ar: 'بانتظار الدفع', en: 'Pending' } },
  // Upcoming (confirmed) reads blue; completed reads green.
  confirmed: { bg: '#DBEAFE', fg: '#1D4ED8', label: { ar: 'مؤكد', en: 'Confirmed' } },
  expired: { bg: '#FEE4E2', fg: '#B42318', label: { ar: 'منتهي', en: 'Expired' } },
  canceled_by_host: { bg: '#FEE4E2', fg: '#B42318', label: { ar: 'ملغي', en: 'Cancelled' } },
  canceled_by_guest: { bg: '#FEE4E2', fg: '#B42318', label: { ar: 'ملغي', en: 'Cancelled' } },
  completed: { bg: '#E7F8EE', fg: '#15803D', label: { ar: 'مكتمل', en: 'Completed' } },
};

// Always reflect the backend's actual status — never derive it from dates.
// Falls back to a neutral chip for any unrecognized status so an unexpected
// backend value can never crash the bookings screen.
export function bookingStatusView(status: BookingApiStatus): StatusView {
  return (
    BOOKING_STATUS_THEME[status] ?? {
      bg: '#EEEEEE',
      fg: '#6B7280',
      label: { ar: String(status ?? ''), en: String(status ?? '') },
    }
  );
}
