import type { Localized } from "@/data/types";

const L = <T>(ar: T, en: T): Localized<T> => ({ ar, en });

export const STR = {
    tabs: {
        explore: L("اســتكشف", "Explore"),
        likes: L("الــمفضلة", "Likes"),
        bookings: L("الحــجوزات", "Bookings"),
        profile: L("حــسابي", "Profile"),
    },
    explore: {
        searchPlaceholder: L(
            "ابحث عن شاليه أو استراحة",
            "Search chalets or rest houses",
        ),
        allCategory: L("الكل", "All"),
    },
    categories: {
        chalet: L("شاليهات", "Chalets"),
        rest_house: L("استراحات", "Rest houses"),
        camp: L("مخيمات", "Camps"),
        farm: L("مزارع", "Farms"),
    },
    listing: {
        perNight: L("في اليوم", "per day"),
        reserve: L("احجز الآن", "Reserve"),
        guests: L("ضيف", "guests"),
        bedrooms: L("غرفة", "bedrooms"),
        bathrooms: L("حمام", "bathrooms"),
        amenities: L("المرافق", "What this place offers"),
        description: L("عن المكان", "About this place"),
        reviewsTitle: L("التقييمات", "Reviews"),
        hostedBy: L("المضيف", "Hosted by"),
        superhost: L("مضيف متميز", "Superhost"),
    },
    reserve: {
        title: L("تفاصيل الحجز", "Booking details"),
        dates: L("التاريخ", "Dates"),
        guests: L("عدد الضيوف", "Guests"),
        services: L("خدمات إضافية", "Add-on services"),
        summary: L("ملخص الدفع", "Payment summary"),
        confirm: L("تأكيد ودفع", "Confirm and pay"),
        subtotal: L("المجموع الفرعي", "Subtotal"),
        cleaningFee: L("رسوم التنظيف", "Cleaning fee"),
        serviceFee: L("رسوم الخدمة", "Service fee"),
        servicesTotal: L("إجمالي الخدمات", "Services total"),
        total: L("الإجمالي", "Total"),
    },
    likes: {
        title: L("الــمــفــضــلــة", "Likes"),
        emptyTitle: L("لا توجد قائمة مفضلة بعد", "No saved places yet"),
        emptyBody: L(
            "تصفّح الأماكن واحفظ مفضّلاتك هنا.",
            "Browse places and save your favorites here.",
        ),
    },
    profile: {
        title: L("حسابي", "Profile"),
        myBookings: L("حجوزاتي", "My bookings"),
        language: L("اللغة", "Language"),
        appearance: L("المظهر", "Appearance"),
        notifications: L("الإشعارات", "Notifications"),
        becomeHost: L("كن مضيفاً", "Become a host"),
        becomeHostHint: L(
            "استضف مكانك وابدء بتحقيق دخل",
            "List your place and start earning",
        ),
    },
    bookings: {
        title: L("حــجــوزاتــي", "My bookings"),
        upcoming: L("الــقــادمــة", "Upcoming"),
        past: L("الــســابــقــة", "Past"),
        emptyUpcomingTitle: L("لا توجد حجوزات قادمة", "No upcoming trips"),
        emptyUpcomingBody: L(
            "ابدء بالبحث عن مكان مناسب لمناسبتك.",
            "Start by finding a place for your event.",
        ),
    },
    common: {
        sar: L("ر.س", "SAR"),
        cancel: L("إلغاء", "Cancel"),
        save: L("حفظ", "Save"),
        apply: L("تطبيق", "Apply"),
        close: L("إغلاق", "Close"),
        back: L("رجوع", "Back"),
        share: L("مشاركة", "Share"),
        day: L("يوم", "day"),
        days: L("أيام", "days"),
    },
};
