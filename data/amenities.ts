import type { Amenity, AmenityId } from './types';

export const AMENITIES: Record<AmenityId, Amenity> = {
  wifi: { id: 'wifi', label: { ar: 'واي فاي', en: 'Wi-Fi' } },
  pool: { id: 'pool', label: { ar: 'مسبح', en: 'Pool' } },
  kitchen: { id: 'kitchen', label: { ar: 'مطبخ', en: 'Kitchen' } },
  parking: { id: 'parking', label: { ar: 'موقف خاص', en: 'Free parking' } },
  ac: { id: 'ac', label: { ar: 'تكييف', en: 'Air conditioning' } },
  bbq: { id: 'bbq', label: { ar: 'شواية', en: 'BBQ grill' } },
  sound_system: { id: 'sound_system', label: { ar: 'سماعات', en: 'Sound system' } },
  tv: { id: 'tv', label: { ar: 'شاشة', en: 'TV' } },
  private_entrance: {
    id: 'private_entrance',
    label: { ar: 'مدخل خاص', en: 'Private entrance' },
  },
  majlis: { id: 'majlis', label: { ar: 'مجلس', en: 'Majlis' } },
  kids_area: { id: 'kids_area', label: { ar: 'منطقة أطفال', en: 'Kids area' } },
  prayer_room: { id: 'prayer_room', label: { ar: 'مصلى', en: 'Prayer room' } },
};
