import { currentUser } from './auth';
import type { Booking } from './types';

export const BOOKINGS: Booking[] = [
  {
    id: 'b_001',
    listingId: 'l_chalet_01',
    guestId: currentUser.id,
    checkIn: '2026-06-20',
    checkOut: '2026-06-22',
    guests: 14,
    services: [
      { serviceId: 's_catering_basic', quantity: 14 },
      { serviceId: 's_decor_balloons', quantity: 1 },
    ],
    pricing: {
      subtotal: 240000,
      cleaningFee: 20000,
      serviceFee: 8000,
      servicesTotal: 255000,
      total: 523000,
    },
    status: 'upcoming',
    createdAt: '2026-05-10T14:32:00Z',
  },
  {
    id: 'b_002',
    listingId: 'l_camp_03',
    guestId: currentUser.id,
    checkIn: '2026-07-15',
    checkOut: '2026-07-17',
    guests: 10,
    services: [{ serviceId: 's_photo', quantity: 1 }],
    pricing: {
      subtotal: 370000,
      cleaningFee: 28000,
      serviceFee: 10000,
      servicesTotal: 150000,
      total: 558000,
    },
    status: 'upcoming',
    createdAt: '2026-05-12T09:18:00Z',
  },
  {
    id: 'b_003',
    listingId: 'l_rest_02',
    guestId: currentUser.id,
    checkIn: '2026-03-08',
    checkOut: '2026-03-09',
    guests: 22,
    services: [],
    pricing: {
      subtotal: 85000,
      cleaningFee: 18000,
      serviceFee: 6500,
      servicesTotal: 0,
      total: 109500,
    },
    status: 'completed',
    createdAt: '2026-02-20T11:00:00Z',
  },
];

export function getBooking(id: string): Booking | undefined {
  return BOOKINGS.find((b) => b.id === id);
}

export function getUpcomingBookings(): Booking[] {
  return BOOKINGS.filter((b) => b.status === 'upcoming');
}

export function getPastBookings(): Booking[] {
  return BOOKINGS.filter((b) => b.status !== 'upcoming');
}
