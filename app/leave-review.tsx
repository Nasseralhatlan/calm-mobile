import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { StarIcon } from "@/components/icons/star-icon";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, fontFamilyFor } from "@/constants/theme";
import { setReviewResult } from "@/data/review-result";
import { fireHaptic } from "@/lib/haptics";
import { ApiError, submitReview } from "@/lib/api";
import { useLocale, useT } from "@/lib/i18n";

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#6B7280";
const DIVIDER = "#EEEEEE";
const STAR_ON = "#FBBF24";
const STAR_OFF = "#E5E7EB";
const COMMENT_MAX = 1000;

type Localized = { ar: string; en: string };

// 1 → 5, least → most. The selected one shows as a big label above the stars.
const MEANINGS: Localized[] = [
    { ar: "سيئ جداً", en: "Terrible" },
    { ar: "سيئ", en: "Poor" },
    { ar: "مقبول", en: "Okay" },
    { ar: "جيد", en: "Good" },
    { ar: "ممتاز", en: "Excellent" },
];

export default function LeaveReviewScreen() {
    const { locale } = useLocale();
    const t = useT();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isRTL = locale === "ar";
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

    const [rate, setRate] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kb, setKb] = useState(0);

    // Track the keyboard height ourselves and lift the footer above it — a plain
    // KeyboardAvoidingView is unreliable inside a presented modal.
    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const s = Keyboard.addListener(showEvt, (e) => setKb(e.endCoordinates.height));
        const h = Keyboard.addListener(hideEvt, () => setKb(0));
        return () => {
            s.remove();
            h.remove();
        };
    }, []);

    const submit = async () => {
        if (rate < 1 || submitting || !bookingId) return;
        setSubmitting(true);
        setError(null);
        try {
            const review = await submitReview(bookingId, {
                rate,
                comment: comment.trim() || undefined,
            });
            setReviewResult({ bookingId, review });
            router.back();
        } catch (e) {
            const fieldErr =
                e instanceof ApiError &&
                (e.payload as { errors?: { rate?: string[] } } | undefined)?.errors
                    ?.rate?.[0];
            const msg =
                fieldErr ||
                (e instanceof ApiError && e.message) ||
                t({ ar: "تعذّر إرسال التقييم. حاول مرة أخرى.", en: "Couldn't submit your review. Try again." });
            setError(msg);
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.flex, { paddingBottom: kb }]}>
                {/* Header — circular shadowed close button like booking details. */}
                <View style={styles.header}>
                    <PressableScale
                        onPress={() => router.back()}
                        scaleTo={0.88}
                        haptic="back"
                        style={styles.closeBtn}
                    >
                        <IconSymbol name="xmark" size={18} color={TEXT_PRIMARY} />
                    </PressableScale>
                    <ThemedText
                        style={[styles.headerTitle, { fontFamily: fontFamilyFor("bold", locale) }]}
                    >
                        {t({ ar: "قيّم إقامتك", en: "Rate your stay" })}
                    </ThemedText>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.body}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Rating meaning — updates as you pick, so the scale reads
                        least (1) → most (5). */}
                    <ThemedText
                        style={[
                            styles.meaning,
                            {
                                fontFamily: fontFamilyFor(rate > 0 ? "bold" : "regular", locale),
                                color: rate > 0 ? TEXT_PRIMARY : TEXT_SECONDARY,
                            },
                        ]}
                    >
                        {rate > 0
                            ? t(MEANINGS[rate - 1])
                            : t({ ar: "اضغط النجوم للتقييم", en: "Tap a star to rate" })}
                    </ThemedText>

                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <Pressable
                                key={n}
                                onPress={() => {
                                    fireHaptic("select");
                                    setRate(n);
                                    setError(null);
                                }}
                                hitSlop={6}
                                style={styles.starBtn}
                            >
                                <StarIcon size={40} color={n <= rate ? STAR_ON : STAR_OFF} />
                            </Pressable>
                        ))}
                    </View>

                    {/* Direction hints under the ends of the scale. */}
                    <View style={styles.scaleEnds}>
                        <ThemedText
                            style={[styles.scaleEnd, { fontFamily: fontFamilyFor("regular", locale) }]}
                        >
                            {t({ ar: "الأسوأ", en: "Worst" })}
                        </ThemedText>
                        <ThemedText
                            style={[styles.scaleEnd, { fontFamily: fontFamilyFor("regular", locale) }]}
                        >
                            {t({ ar: "الأفضل", en: "Best" })}
                        </ThemedText>
                    </View>

                    <TextInput
                        value={comment}
                        onChangeText={setComment}
                        autoFocus
                        placeholder={t({
                            ar: "شارك تفاصيل تجربتك (اختياري)",
                            en: "Share details of your stay (optional)",
                        })}
                        placeholderTextColor="#9CA3AF"
                        multiline
                        maxLength={COMMENT_MAX}
                        style={[
                            styles.input,
                            {
                                fontFamily: fontFamilyFor("regular", locale),
                                textAlign: "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    />

                    {error ? (
                        <ThemedText
                            style={[styles.error, { fontFamily: fontFamilyFor("medium", locale) }]}
                        >
                            {error}
                        </ThemedText>
                    ) : (
                        <ThemedText
                            style={[styles.hint, { fontFamily: fontFamilyFor("regular", locale) }]}
                        >
                            {t({
                                ar: "تقييمك يُراجع قبل النشر.",
                                en: "Your review is checked before it's published.",
                            })}
                        </ThemedText>
                    )}
                </ScrollView>

                {/* Footer sits above the keyboard via the wrapper's paddingBottom. */}
                <View
                    style={[
                        styles.footer,
                        { paddingBottom: kb > 0 ? Spacing[3] : insets.bottom + Spacing[3] },
                    ]}
                >
                    <PressableScale
                        scaleTo={0.97}
                        haptic="forward"
                        onPress={submit}
                        disabled={rate < 1 || submitting}
                        style={
                            rate < 1 || submitting
                                ? [styles.submitBtn, styles.submitBtnDisabled]
                                : styles.submitBtn
                        }
                    >
                        <ThemedText
                            style={[styles.submitText, { fontFamily: fontFamilyFor("bold", locale) }]}
                        >
                            {submitting
                                ? t({ ar: "جارٍ الإرسال…", en: "Submitting…" })
                                : t({ ar: "إرسال التقييم", en: "Submit review" })}
                        </ThemedText>
                    </PressableScale>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    flex: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[3],
        paddingBottom: Spacing[3],
    },
    headerTitle: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
    headerSpacer: { width: 40, height: 40 },
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

    body: {
        paddingHorizontal: Spacing[6],
        paddingTop: Spacing[8],
        paddingBottom: Spacing[6],
        gap: Spacing[4],
    },
    meaning: { fontSize: 22, lineHeight: 30, textAlign: "center" },
    stars: { flexDirection: "row", alignSelf: "center", gap: Spacing[3] },
    starBtn: { padding: Spacing[1] },
    scaleEnds: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignSelf: "center",
        width: 260,
        marginTop: -Spacing[1],
    },
    scaleEnd: { fontSize: 12, lineHeight: 16, color: TEXT_SECONDARY },
    input: {
        minHeight: 120,
        borderRadius: 16,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#ECECEC",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[3],
        fontSize: 15,
        lineHeight: 21,
        color: TEXT_PRIMARY,
        textAlignVertical: "top",
        marginTop: Spacing[2],
    },
    hint: { fontSize: 13, lineHeight: 18, color: Colors.light.textMuted, textAlign: "center" },
    error: { fontSize: 13, lineHeight: 18, color: "#C53030", textAlign: "center" },
    footer: {
        paddingHorizontal: Spacing[6],
        paddingTop: Spacing[3],
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: DIVIDER,
        backgroundColor: "#FFFFFF",
    },
    submitBtn: {
        height: 54,
        borderRadius: 16,
        borderCurve: "continuous",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000000",
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: "#FFFFFF", fontSize: 16, lineHeight: 21 },
});
