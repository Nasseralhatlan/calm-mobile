import { Image } from "expo-image";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CircularTimer } from "@/components/circular-timer";
import { StarIcon } from "@/components/icons/star-icon";
import { SupportIcon } from "@/components/icons/support-icon";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, fontFamilyFor } from "@/constants/theme";
import { bookingStatusView } from "@/data/booking-status";
import { setConfirm } from "@/data/confirm-dialog";
import { takeReviewResult } from "@/data/review-result";
import { getSelectedBooking } from "@/data/selected-booking";
import {
    ApiError,
    deleteReview,
    type ApiBookingReview,
    type ReviewApiStatus,
} from "@/lib/api";
import { useCountdown } from "@/lib/countdown";
import { daysBetweenInclusive, formatSar } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

const STAR_ON = "#FBBF24";
const STAR_OFF = "#E5E7EB";

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#6B7280";
const DIVIDER = "#EEEEEE";

function formatDate(iso: string, locale: "ar" | "en"): string {
    // Force the Gregorian calendar (ar-SA defaults to Hijri).
    return new Intl.DateTimeFormat(
        locale === "ar" ? "ar-SA-u-ca-gregory" : "en-US",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
        },
    ).format(new Date(`${iso}T00:00:00`));
}

function formatTime(t24: string): string {
    const [hStr, mStr] = t24.split(":");
    const h = Number(hStr);
    const ap = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${(mStr ?? "00").padStart(2, "0")} ${ap}`;
}

export default function BookingInfoScreen() {
    const { locale } = useLocale();
    const t = useT();
    const router = useRouter();
    const isRTL = locale === "ar";
    const align = isRTL ? ("right" as const) : ("left" as const);
    const wd = isRTL ? ("rtl" as const) : ("ltr" as const);

    const booking = getSelectedBooking();
    // Review state lives locally so submit/delete reflect immediately; the
    // bookings list refetches on focus, so going back stays in sync.
    const [review, setReview] = useState<ApiBookingReview | null>(
        booking?.review ?? null,
    );
    const [canReview, setCanReview] = useState<boolean>(
        booking?.can_review ?? false,
    );
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const isPending = booking?.status === "pending_payment";
    const expiry = useCountdown(isPending ? booking?.expires_at : null);

    // Apply a review submitted in the leave-review modal when it returns here.
    useFocusEffect(
        useCallback(() => {
            const r = takeReviewResult();
            if (r && booking && r.bookingId === booking.id) {
                setReview(r.review);
                setCanReview(false);
            }
        }, [booking]),
    );

    if (!booking) return null;

    const payable = isPending && !expiry.expired && !!booking.payment?.url;

    // Remaining fraction of the hold window (created_at → expires_at) for the ring.
    const totalMs =
        booking.expires_at && booking.created_at
            ? new Date(booking.expires_at).getTime() -
              new Date(booking.created_at).getTime()
            : 0;
    const progress = totalMs > 0 ? expiry.ms / totalMs : expiry.expired ? 0 : 1;

    const completePayment = () => {
        // This screen is a modal; the pay screen is a card on the stack below it.
        // Dismiss the modal first, then push pay, so the webview isn't hidden
        // behind this modal.
        const params = {
            id: booking.place_id,
            bookingId: booking.id,
            paymentUrl: booking.payment.url,
            startDate: booking.start_date,
            endDate: booking.end_date,
            guests: String(booking.guests ?? ""),
            total: String(booking.pricing.total),
        };
        router.back();
        requestAnimationFrame(() =>
            router.push({ pathname: "/booking/[id]/pay", params }),
        );
    };

    const place = booking.place;
    const status = bookingStatusView(booking.status);
    const title = place?.title ?? t({ ar: "حجز", en: "Booking" });
    const cityName = place?.city
        ? locale === "ar"
            ? place.city.name_ar
            : place.city.name_en
        : null;
    const areaName = place?.city_area
        ? locale === "ar"
            ? place.city_area.name_ar
            : place.city_area.name_en
        : null;
    const location = [cityName, areaName].filter(Boolean).join(" · ");
    const days = daysBetweenInclusive(booking.start_date, booking.end_date);
    const p = booking.pricing;

    // Native sheet presented ABOVE this screen — this stays mounted underneath.
    const onSupport = () => router.push("/support");

    const openLeaveReview = () =>
        router.push({
            pathname: "/leave-review",
            params: { bookingId: booking!.id },
        });

    const onDeleteReview = async () => {
        if (!review) return;
        setDeleteError(null);
        try {
            await deleteReview(review.id);
            setReview(null);
            setCanReview(true);
        } catch (e) {
            setDeleteError(
                e instanceof ApiError
                    ? e.message
                    : t({ ar: "تعذّر حذف التقييم.", en: "Couldn't delete the review." }),
            );
        }
    };

    // Same confirm flow as the cancel-payment modal (shared /confirm form sheet).
    const confirmDeleteReview = () => {
        setConfirm({
            title: t({ ar: "حذف التقييم؟", en: "Delete review?" }),
            message: t({
                ar: "سيُحذف تقييمك ويمكنك إضافة تقييم جديد لاحقاً.",
                en: "Your review will be removed. You can leave a new one later.",
            }),
            confirmLabel: t({ ar: "حذف", en: "Delete" }),
            cancelLabel: t({ ar: "إلغاء", en: "Cancel" }),
            destructive: true,
            onConfirm: onDeleteReview,
        });
        router.push("/confirm");
    };

    const reviewStatusView = (s: ReviewApiStatus) => {
        switch (s) {
            case "published":
                return { label: t({ ar: "منشور", en: "Published" }), bg: "#E7F8EE", fg: "#15803D" };
            case "blocked":
                return { label: t({ ar: "محذوف", en: "Removed" }), bg: "#FEE4E2", fg: "#B42318" };
            default:
                return {
                    label: t({ ar: "قيد المراجعة", en: "Pending review" }),
                    bg: "#FEF3C7",
                    fg: "#B45309",
                };
        }
    };

    const sv = review ? reviewStatusView(review.status) : null;
    // Show the review block on completed stays (or whenever a review exists).
    const showReview = review !== null || canReview;

    const Row = ({ label, value }: { label: string; value: string }) => (
        <View
            style={[
                styles.row,
                { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
        >
            <ThemedText
                style={[
                    styles.rowLabel,
                    { fontFamily: fontFamilyFor("regular", locale) },
                ]}
            >
                {label}
            </ThemedText>
            <ThemedText
                style={[
                    styles.rowValue,
                    {
                        fontFamily: fontFamilyFor("medium", locale),
                        textAlign: isRTL ? "left" : "right",
                    },
                ]}
            >
                {value}
            </ThemedText>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView edges={["top"]} style={styles.headerSafe}>
                <View style={styles.header}>
                    <PressableScale
                        onPress={() => router.back()}
                        scaleTo={0.88}
                        haptic="back"
                        style={styles.closeBtn}
                    >
                        <IconSymbol
                            name="xmark"
                            size={18}
                            color={TEXT_PRIMARY}
                        />
                    </PressableScale>
                    <PressableScale
                        onPress={onSupport}
                        scaleTo={0.95}
                        haptic="select"
                        style={styles.supportBtn}
                    >
                        <SupportIcon
                            size={18}
                            color="#FFFFFF"
                            strokeWidth={1.7}
                        />
                        <ThemedText
                            style={[
                                styles.supportText,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {t({ ar: "الدعم", en: "Support" })}
                        </ThemedText>
                    </PressableScale>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.flex}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    payable && styles.scrollWithPay,
                ]}
            >
                {/* User-friendly reference, on top above the image. */}
                <View
                    style={[
                        styles.refTop,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                >
                    <ThemedText
                        style={[
                            styles.refTopLabel,
                            { fontFamily: fontFamilyFor("regular", locale) },
                        ]}
                    >
                        {t({ ar: "رقم الحجز", en: "Booking ref" })}
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.refTopValue,
                            { fontFamily: fontFamilyFor("bold", locale) },
                        ]}
                    >
                        {booking.reference}
                    </ThemedText>
                </View>

                <Image
                    source={{ uri: place?.cover_photo_url ?? undefined }}
                    style={styles.cover}
                    contentFit="cover"
                    transition={200}
                />

                <View style={styles.titleBlock}>
                    <View
                        style={[
                            styles.titleRow,
                            { flexDirection: isRTL ? "row-reverse" : "row" },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.title,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                    textAlign: align,
                                    writingDirection: wd,
                                },
                            ]}
                        >
                            {title}
                        </ThemedText>
                        <View
                            style={[
                                styles.statusChip,
                                { backgroundColor: status.bg },
                            ]}
                        >
                            <ThemedText
                                style={[
                                    styles.statusChipText,
                                    {
                                        color: status.fg,
                                        fontFamily: fontFamilyFor(
                                            "bold",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {t(status.label)}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText
                        style={[
                            styles.location,
                            {
                                fontFamily: fontFamilyFor("regular", locale),
                                textAlign: align,
                                writingDirection: wd,
                            },
                        ]}
                    >
                        {location}
                    </ThemedText>
                </View>

                {isPending ? (
                    <View style={styles.timerWrap}>
                        <CircularTimer
                            progress={progress}
                            label={expiry.expired ? "0:00" : expiry.label}
                            caption={
                                expiry.expired
                                    ? t({ ar: "انتهت المهلة", en: "Expired" })
                                    : t({ ar: "للدفع", en: "to pay" })
                            }
                            color={expiry.expired ? "#9CA3AF" : "#F59E0B"}
                            fontFamily={fontFamilyFor("bold", locale)}
                            captionFontFamily={fontFamilyFor("medium", locale)}
                        />
                    </View>
                ) : null}

                <View style={styles.card}>
                    <Row
                        label={t({ ar: "الوصول", en: "Check-in" })}
                        value={`${formatDate(booking.start_date, locale)} · ${formatTime(booking.check_in_time)}`}
                    />
                    <View style={styles.divider} />
                    <Row
                        label={t({ ar: "المغادرة", en: "Check-out" })}
                        value={`${formatDate(booking.end_date, locale)} · ${formatTime(booking.check_out_time)}`}
                    />
                    <View style={styles.divider} />
                    <Row
                        label={t({ ar: "المدة", en: "Duration" })}
                        value={`${days} ${t({ ar: days === 1 ? "يوم" : "أيام", en: days === 1 ? "day" : "days" })}`}
                    />
                    <View style={styles.divider} />
                    <Row
                        label={t({ ar: "الضيوف", en: "Guests" })}
                        value={`${booking.guests ?? 0} ${t({ ar: "ضيف", en: "guests" })}`}
                    />
                </View>

                <View style={styles.card}>
                    <Row
                        label={t({ ar: "الإجمالي الفرعي", en: "Subtotal" })}
                        value={formatSar(p.subtotal)}
                    />
                    <View style={styles.divider} />
                    <Row
                        label={`${t({ ar: "ضريبة القيمة المضافة", en: "VAT" })} (${p.vat_percentage}%)`}
                        value={formatSar(p.vat)}
                    />
                    <View style={styles.divider} />
                    <View
                        style={[
                            styles.row,
                            { flexDirection: isRTL ? "row-reverse" : "row" },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.totalLabel,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {t({ ar: "الإجمالي", en: "Total" })}
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.totalValue,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {formatSar(p.total)}
                        </ThemedText>
                    </View>
                </View>

                {showReview ? (
                    <View style={styles.reviewCard}>
                        <ThemedText
                            style={[
                                styles.reviewHeading,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                    textAlign: align,
                                    writingDirection: wd,
                                },
                            ]}
                        >
                            {t({ ar: "تقييمك", en: "Your review" })}
                        </ThemedText>

                        {review && sv ? (
                            <View style={styles.reviewBody}>
                                <View
                                    style={[
                                        styles.reviewTopRow,
                                        { flexDirection: isRTL ? "row-reverse" : "row" },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.starsRow,
                                            { flexDirection: isRTL ? "row-reverse" : "row" },
                                        ]}
                                    >
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <StarIcon
                                                key={i}
                                                size={18}
                                                color={i < review.rate ? STAR_ON : STAR_OFF}
                                            />
                                        ))}
                                    </View>
                                    <View style={[styles.statusChip, { backgroundColor: sv.bg }]}>
                                        <ThemedText
                                            style={[
                                                styles.statusChipText,
                                                { color: sv.fg, fontFamily: fontFamilyFor("bold", locale) },
                                            ]}
                                        >
                                            {sv.label}
                                        </ThemedText>
                                    </View>
                                </View>

                                {review.comment ? (
                                    <ThemedText
                                        style={[
                                            styles.reviewComment,
                                            {
                                                fontFamily: fontFamilyFor("regular", locale),
                                                textAlign: align,
                                                writingDirection: wd,
                                            },
                                        ]}
                                    >
                                        {review.comment}
                                    </ThemedText>
                                ) : null}

                                {review.status === "under_review" ? (
                                    <ThemedText
                                        style={[
                                            styles.reviewNote,
                                            {
                                                fontFamily: fontFamilyFor("regular", locale),
                                                textAlign: align,
                                                writingDirection: wd,
                                            },
                                        ]}
                                    >
                                        {t({
                                            ar: "تقييمك بانتظار الموافقة قبل ظهوره للعامة.",
                                            en: "Your review is pending approval before it appears publicly.",
                                        })}
                                    </ThemedText>
                                ) : review.status === "blocked" ? (
                                    <ThemedText
                                        style={[
                                            styles.reviewNote,
                                            {
                                                fontFamily: fontFamilyFor("regular", locale),
                                                textAlign: align,
                                                writingDirection: wd,
                                            },
                                        ]}
                                    >
                                        {t({
                                            ar: "تمت إزالة هذا التقييم ولا يمكن تعديله.",
                                            en: "This review was removed and can't be changed.",
                                        })}
                                    </ThemedText>
                                ) : null}

                                {deleteError ? (
                                    <ThemedText
                                        style={[
                                            styles.reviewError,
                                            { fontFamily: fontFamilyFor("medium", locale), textAlign: align },
                                        ]}
                                    >
                                        {deleteError}
                                    </ThemedText>
                                ) : null}

                                {review.status !== "blocked" ? (
                                    <PressableScale
                                        onPress={confirmDeleteReview}
                                        scaleTo={0.97}
                                        haptic="select"
                                        style={[
                                            styles.deleteBtn,
                                            { alignSelf: isRTL ? "flex-end" : "flex-start" },
                                        ]}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.deleteText,
                                                { fontFamily: fontFamilyFor("bold", locale) },
                                            ]}
                                        >
                                            {t({ ar: "حذف التقييم", en: "Delete review" })}
                                        </ThemedText>
                                    </PressableScale>
                                ) : null}
                            </View>
                        ) : (
                            <PressableScale
                                onPress={openLeaveReview}
                                scaleTo={0.97}
                                haptic="forward"
                                style={styles.leaveBtn}
                            >
                                <ThemedText
                                    style={[
                                        styles.leaveBtnText,
                                        { fontFamily: fontFamilyFor("bold", locale) },
                                    ]}
                                >
                                    {t({ ar: "أضف تقييمك", en: "Leave a review" })}
                                </ThemedText>
                            </PressableScale>
                        )}
                    </View>
                ) : null}
            </ScrollView>

            {payable ? (
                <SafeAreaView edges={["bottom"]} style={styles.payBar}>
                    {/* Payment summary above the CTA, like the confirmation page. */}
                    <View
                        style={[
                            styles.paySummary,
                            { flexDirection: isRTL ? "row-reverse" : "row" },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.paySummaryLabel,
                                { fontFamily: fontFamilyFor("medium", locale) },
                            ]}
                        >
                            {t({ ar: "الإجمالي", en: "Total" })}
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.paySummaryValue,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {formatSar(p.total)}
                        </ThemedText>
                    </View>
                    <PressableScale
                        onPress={completePayment}
                        scaleTo={0.97}
                        haptic="forward"
                        style={styles.payBtn}
                    >
                        <ThemedText
                            style={[
                                styles.payBtnText,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {t({ ar: "ادفع الآن", en: "Pay now" })}
                        </ThemedText>
                    </PressableScale>
                </SafeAreaView>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    flex: { flex: 1 },
    headerSafe: {
        backgroundColor: "#FFFFFF",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: DIVIDER,
    },
    header: {
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[3],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderCurve: "continuous",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    supportBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing[2],
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        borderRadius: 14,
        borderCurve: "continuous",
        backgroundColor: "#000000",
    },
    supportText: { fontSize: 14, lineHeight: 18, color: "#FFFFFF" },

    scroll: {
        padding: Spacing[5],
        gap: Spacing[4],
        paddingBottom: Spacing[12],
    },
    scrollWithPay: { paddingBottom: Spacing[20] },

    timerWrap: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: Spacing[2],
    },

    payBar: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: DIVIDER,
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[3],
        gap: Spacing[3],
    },
    paySummary: {
        alignItems: "center",
        justifyContent: "space-between",
    },
    paySummaryLabel: { fontSize: 14, lineHeight: 19, color: TEXT_SECONDARY },
    paySummaryValue: { fontSize: 18, lineHeight: 23, color: TEXT_PRIMARY },
    payBtn: {
        height: 54,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
    },
    payBtnText: { fontSize: 16, lineHeight: 21, color: "#FFFFFF" },
    cover: {
        width: "100%",
        height: 200,
        borderRadius: Radius.lg,
        borderCurve: "continuous",
        backgroundColor: "#F3F4F6",
    },
    titleBlock: { gap: Spacing[1] },
    titleRow: { alignItems: "center", gap: Spacing[2] },
    title: { flex: 1, fontSize: 22, lineHeight: 28, color: TEXT_PRIMARY },
    location: { fontSize: 14, lineHeight: 20, color: TEXT_SECONDARY },
    statusChip: {
        paddingHorizontal: Spacing[3],
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusChipText: { fontSize: 11, lineHeight: 14 },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderCurve: "continuous",
        borderWidth: 0.5,
        borderColor: "#F0F0F0",
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[2],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 3,
    },
    row: {
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: Spacing[3],
        gap: Spacing[3],
    },
    rowLabel: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_SECONDARY,
        flexShrink: 1,
    },
    rowValue: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_PRIMARY,
        flexShrink: 1,
    },
    totalLabel: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
    totalValue: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER },

    refTop: {
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing[2],
    },
    refTopLabel: { fontSize: 13, lineHeight: 17, color: TEXT_SECONDARY },
    refTopValue: {
        fontSize: 15,
        lineHeight: 19,
        color: TEXT_PRIMARY,
        letterSpacing: 0.5,
    },

    reviewCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderCurve: "continuous",
        borderWidth: 0.5,
        borderColor: "#F0F0F0",
        padding: Spacing[4],
        gap: Spacing[3],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 3,
    },
    reviewHeading: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
    reviewBody: { gap: Spacing[3] },
    reviewTopRow: {
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing[2],
    },
    starsRow: { alignItems: "center", gap: 3 },
    reviewComment: { fontSize: 14, lineHeight: 21, color: TEXT_PRIMARY },
    reviewNote: { fontSize: 13, lineHeight: 18, color: TEXT_SECONDARY },
    reviewError: { fontSize: 13, lineHeight: 18, color: "#C53030" },
    deleteBtn: { paddingVertical: Spacing[1] },
    deleteText: { fontSize: 14, lineHeight: 19, color: "#C53030" },
    leaveBtn: {
        height: 50,
        borderRadius: 14,
        borderCurve: "continuous",
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
    },
    leaveBtnText: { fontSize: 15, lineHeight: 20, color: "#FFFFFF" },
});
