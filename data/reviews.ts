import type { Review } from './types';

export const REVIEWS: Review[] = [
  {
    id: 'r_001',
    listingId: 'l_chalet_01',
    authorId: 'u_001',
    authorName: { ar: 'محمد', en: 'Mohammed' },
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=14',
    rating: 5,
    text: {
      ar: 'الشاليه فوق التوقعات، المضيف متعاون والمكان نظيف جداً.',
      en: 'Exceeded expectations. The host was responsive and the place was spotless.',
    },
    createdAt: '2026-04-12T00:00:00Z',
  },
  {
    id: 'r_002',
    listingId: 'l_chalet_01',
    authorId: 'u_002',
    authorName: { ar: 'ريم', en: 'Reem' },
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=23',
    rating: 5,
    text: {
      ar: 'احتفلت بعيد ميلاد ابنتي هنا، المسبح كان آمن للأطفال والمجلس واسع.',
      en: 'Celebrated my daughter’s birthday here. The pool was safe for kids and the majlis was spacious.',
    },
    createdAt: '2026-03-30T00:00:00Z',
  },
  {
    id: 'r_003',
    listingId: 'l_chalet_01',
    authorId: 'u_003',
    authorName: { ar: 'سلمان', en: 'Salman' },
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=7',
    rating: 4,
    text: {
      ar: 'مكان ممتاز، لكن واي فاي كان ضعيف في الغرف الخلفية.',
      en: 'Great spot, but the Wi-Fi was weak in the back rooms.',
    },
    createdAt: '2026-02-18T00:00:00Z',
  },
  {
    id: 'r_004',
    listingId: 'l_chalet_05',
    authorId: 'u_004',
    authorName: { ar: 'دانة', en: 'Dana' },
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=20',
    rating: 5,
    text: {
      ar: 'تجربة سحرية، الإطلالة والخدمة في قمة الذوق.',
      en: 'A magical experience — the views and service were impeccable.',
    },
    createdAt: '2026-04-05T00:00:00Z',
  },
];

export function getReviewsForListing(listingId: string): Review[] {
  return REVIEWS.filter((r) => r.listingId === listingId);
}
