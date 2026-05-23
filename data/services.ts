import type { AddOnService } from './types';

export const SERVICES: AddOnService[] = [
  {
    id: 's_catering_basic',
    kind: 'catering',
    title: { ar: 'بوفيه شعبي', en: 'Traditional buffet' },
    description: {
      ar: 'كبسة، مندي، مشاوي مع سلطات وأرز بخاري — كفاية لجميع الضيوف.',
      en: 'Kabsa, mandi, grills with salads and bukhari rice — for the whole guest list.',
    },
    price: 12500,
    unit: 'per_guest',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  },
  {
    id: 's_catering_premium',
    kind: 'catering',
    title: { ar: 'بوفيه فاخر مع شيف حي', en: 'Premium buffet with live chef' },
    description: {
      ar: 'محطات شيفات حية بطاجن، شواء، ومحطة حلويات مع الكنافة و القهوة العربية.',
      en: 'Live chef stations with tagine, grills, and a dessert bar with kunafa and Arabic coffee.',
    },
    price: 22000,
    unit: 'per_guest',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop',
  },
  {
    id: 's_decor_balloons',
    kind: 'decoration',
    title: { ar: 'تنسيق بالونات', en: 'Balloon arrangement' },
    description: {
      ar: 'بوابة بالونات وزينة كاملة بالألوان التي تختارها، مناسبة لأعياد الميلاد والملكة.',
      en: 'Balloon arch and full decor in colors of your choice — perfect for birthdays and engagements.',
    },
    price: 80000,
    unit: 'flat',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop',
  },
  {
    id: 's_decor_full',
    kind: 'decoration',
    title: { ar: 'تنسيق كامل للمناسبة', en: 'Full event styling' },
    description: {
      ar: 'منسق محترف، إضاءة دافئة، ورود، لوحة ترحيب، ومسرح صغير لمناسبات الأعراس والعزائم الكبيرة.',
      en: 'Professional stylist, warm lighting, florals, welcome signage, and a small stage for weddings or large feasts.',
    },
    price: 220000,
    unit: 'flat',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
  },
  {
    id: 's_staff_servers',
    kind: 'staff',
    title: { ar: 'طاقم خدمة و قهوجي', en: 'Wait staff & qahwaji' },
    description: {
      ar: 'مضيفون لتقديم الطعام والمشروبات، وقهوجي مختص بصب القهوة العربية والتمر للضيوف.',
      en: 'Servers for food and drinks, plus a dedicated qahwaji to pour Arabic coffee and serve dates.',
    },
    price: 7500,
    unit: 'per_hour',
    imageUrl: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&auto=format&fit=crop',
  },
  {
    id: 's_photo',
    kind: 'photography',
    title: { ar: 'مصور للمناسبة', en: 'Event photographer' },
    description: {
      ar: 'مصور محترف يلتقط أهم لحظات مناسبتك، مع تسليم الصور المعدلة خلال أسبوع.',
      en: 'Professional photographer covering the key moments, with edited photos delivered within a week.',
    },
    price: 150000,
    unit: 'flat',
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop',
  },
  {
    id: 's_entertainment_dj',
    kind: 'entertainment',
    title: { ar: 'منسق موسيقى', en: 'Music host' },
    description: {
      ar: 'منسق صوتيات لإحياء المناسبة بقائمة موسيقى مخصصة، مع إمكانية الالتزام بالأهازيج الشعبية والأناشيد.',
      en: 'A music host with a custom playlist, with the option to focus on Saudi folk songs and nasheed.',
    },
    price: 180000,
    unit: 'flat',
    imageUrl: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b31f?w=800&auto=format&fit=crop',
  },
];

export function getService(id: string): AddOnService | undefined {
  return SERVICES.find((s) => s.id === id);
}
