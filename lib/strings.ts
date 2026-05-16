import type { Localized } from '@/data/types';

const L = <T,>(ar: T, en: T): Localized<T> => ({ ar, en });

export const STR = {
  tabs: {
    explore: L('استكشف', 'Explore'),
    likes: L('المفضلة', 'Likes'),
    bookings: L('الحجوزات', 'Bookings'),
    profile: L('حسابي', 'Profile'),
  },
  explore: {
    searchPlaceholder: L('ابحث عن شاليه أو استراحة', 'Search chalets or rest houses'),
    allCategory: L('الكل', 'All'),
  },
  categories: {
    chalet: L('شاليهات', 'Chalets'),
    rest_house: L('استراحات', 'Rest houses'),
    camp: L('مخيمات', 'Camps'),
    farm: L('مزارع', 'Farms'),
  },
  listing: {
    perNight: L('في الليلة', 'per night'),
    reserve: L('احجز الآن', 'Reserve'),
    guests: L('ضيف', 'guests'),
    bedrooms: L('غرفة', 'bedrooms'),
    bathrooms: L('حمام', 'bathrooms'),
    amenities: L('المرافق', 'What this place offers'),
    description: L('عن المكان', 'About this place'),
    reviewsTitle: L('التقييمات', 'Reviews'),
    hostedBy: L('المضيف', 'Hosted by'),
    superhost: L('مضيف متميز', 'Superhost'),
  },
  reserve: {
    title: L('تفاصيل الحجز', 'Booking details'),
    dates: L('التاريخ', 'Dates'),
    guests: L('عدد الضيوف', 'Guests'),
    services: L('خدمات إضافية', 'Add-on services'),
    summary: L('ملخص الدفع', 'Payment summary'),
    confirm: L('تأكيد ودفع', 'Confirm and pay'),
    subtotal: L('المجموع الفرعي', 'Subtotal'),
    cleaningFee: L('رسوم التنظيف', 'Cleaning fee'),
    serviceFee: L('رسوم الخدمة', 'Service fee'),
    servicesTotal: L('إجمالي الخدمات', 'Services total'),
    total: L('الإجمالي', 'Total'),
  },
  likes: {
    title: L('المفضلة', 'Likes'),
    emptyTitle: L('لا توجد قائمة مفضلة بعد', 'No saved places yet'),
    emptyBody: L('عند الضغط على ♥ في أي مكان، يظهر هنا.', 'Tap the heart on any place to save it here.'),
  },
  profile: {
    title: L('حسابي', 'Profile'),
    myBookings: L('حجوزاتي', 'My bookings'),
    language: L('اللغة', 'Language'),
    appearance: L('المظهر', 'Appearance'),
    notifications: L('الإشعارات', 'Notifications'),
    becomeHost: L('كن مضيفاً', 'Become a host'),
    becomeHostHint: L('استضف مكانك وابدأ بتحقيق دخل', 'List your place and start earning'),
  },
  bookings: {
    title: L('حجوزاتي', 'My bookings'),
    upcoming: L('القادمة', 'Upcoming'),
    past: L('السابقة', 'Past'),
    emptyUpcomingTitle: L('لا توجد حجوزات قادمة', 'No upcoming trips'),
    emptyUpcomingBody: L('ابدأ بالبحث عن مكان مناسب لمناسبتك.', 'Start by finding a place for your event.'),
  },
  common: {
    sar: L('ر.س', 'SAR'),
    cancel: L('إلغاء', 'Cancel'),
    save: L('حفظ', 'Save'),
    apply: L('تطبيق', 'Apply'),
    close: L('إغلاق', 'Close'),
    back: L('رجوع', 'Back'),
    share: L('مشاركة', 'Share'),
    night: L('ليلة', 'night'),
    nights: L('ليالٍ', 'nights'),
  },
};
