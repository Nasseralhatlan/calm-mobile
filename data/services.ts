import type { AddOnService } from './types';

export const SERVICES: AddOnService[] = [
  {
    id: 's_catering_basic',
    kind: 'catering',
    title: { ar: 'بوفيه عربي', en: 'Arabic buffet' },
    description: {
      ar: 'كبسة، مندي، مشاوي، وسلطات. يكفي لجميع الضيوف.',
      en: 'Kabsa, mandi, grills, and salads — for the whole guest list.',
    },
    price: 12500,
    unit: 'per_guest',
  },
  {
    id: 's_catering_premium',
    kind: 'catering',
    title: { ar: 'بوفيه فاخر', en: 'Premium buffet' },
    description: {
      ar: 'تشكيلة عربية ودولية فاخرة، محطات شيفات حية، وحلويات.',
      en: 'Curated Arabic and international stations with live chefs and desserts.',
    },
    price: 22000,
    unit: 'per_guest',
  },
  {
    id: 's_decor_balloons',
    kind: 'decoration',
    title: { ar: 'تنسيق بالونات', en: 'Balloon arrangement' },
    description: {
      ar: 'بوابة بالونات وزينة كاملة بالألوان التي تختارها.',
      en: 'Balloon arch and full decor in colors of your choice.',
    },
    price: 80000,
    unit: 'flat',
  },
  {
    id: 's_decor_full',
    kind: 'decoration',
    title: { ar: 'تنسيق كامل للحفلة', en: 'Full event styling' },
    description: {
      ar: 'منسق محترف، إضاءة، ورود، ولوحة الترحيب.',
      en: 'Professional stylist, lighting, florals, and welcome signage.',
    },
    price: 220000,
    unit: 'flat',
  },
  {
    id: 's_staff_servers',
    kind: 'staff',
    title: { ar: 'طاقم خدمة', en: 'Wait staff' },
    description: {
      ar: 'مضيفون ومضيفات لتقديم الطعام والمشروبات بأناقة.',
      en: 'Servers to handle food and drinks with care.',
    },
    price: 7500,
    unit: 'per_hour',
  },
  {
    id: 's_photo',
    kind: 'photography',
    title: { ar: 'مصور للحفلة', en: 'Event photographer' },
    description: {
      ar: 'مصور محترف يلتقط أهم لحظات حفلتك.',
      en: 'Professional photographer covering the key moments.',
    },
    price: 150000,
    unit: 'flat',
  },
  {
    id: 's_entertainment_dj',
    kind: 'entertainment',
    title: { ar: 'دي جي', en: 'DJ' },
    description: {
      ar: 'منسق صوتيات لإحياء الحفل بقائمة موسيقى مخصصة لك.',
      en: 'A DJ to set the mood with a custom playlist.',
    },
    price: 180000,
    unit: 'flat',
  },
];

export function getService(id: string): AddOnService | undefined {
  return SERVICES.find((s) => s.id === id);
}
