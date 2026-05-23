import type { Amenity, AmenityId } from './types';

export const AMENITIES: Record<AmenityId, Amenity> = {
  wifi: { id: 'wifi', label: { ar: 'واي فاي', en: 'Wi-Fi' } },
  pool: { id: 'pool', label: { ar: 'مسبح', en: 'Pool' } },
  kitchen: { id: 'kitchen', label: { ar: 'مطبخ مجهز', en: 'Equipped kitchen' } },
  parking: { id: 'parking', label: { ar: 'موقف خاص', en: 'Free parking' } },
  ac: { id: 'ac', label: { ar: 'تكييف', en: 'Air conditioning' } },
  bbq: { id: 'bbq', label: { ar: 'ركن شواء', en: 'BBQ area' } },
  sound_system: { id: 'sound_system', label: { ar: 'نظام صوتي', en: 'Sound system' } },
  tv: { id: 'tv', label: { ar: 'شاشة عرض', en: 'TV' } },
  private_entrance: {
    id: 'private_entrance',
    label: { ar: 'مدخل مستقل', en: 'Private entrance' },
  },
  majlis_men: { id: 'majlis_men', label: { ar: 'مجلس رجال', en: "Men's majlis" } },
  majlis_women: { id: 'majlis_women', label: { ar: 'مجلس نساء', en: "Women's majlis" } },
  kids_area: { id: 'kids_area', label: { ar: 'منطقة ألعاب أطفال', en: "Kids' play area" } },
  prayer_room: { id: 'prayer_room', label: { ar: 'مصلى', en: 'Prayer room' } },
  shisha_area: { id: 'shisha_area', label: { ar: 'ركن شيشة', en: 'Shisha area' } },
  arabic_coffee: {
    id: 'arabic_coffee',
    label: { ar: 'قهوة عربية وتمر', en: 'Arabic coffee & dates' },
  },
};

const EMOJI_MAP: Record<AmenityId, string> = {
  wifi: '🛜',
  pool: '🏊',
  kitchen: '🍳',
  parking: '🅿️',
  ac: '❄️',
  bbq: '🍖',
  sound_system: '🔊',
  tv: '📺',
  private_entrance: '🚪',
  majlis_men: '🪑',
  majlis_women: '🛋️',
  kids_area: '🧸',
  prayer_room: '🕌',
  shisha_area: '💨',
  arabic_coffee: '☕',
};

export function amenityEmoji(id: AmenityId): string {
  return EMOJI_MAP[id];
}
