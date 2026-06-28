import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, fontFamilyFor } from "@/constants/theme";
import { useAuthState } from "@/data/auth-state";
import { setSelectedBooking } from "@/data/selected-booking";
import { getPendingBookings, type ApiBookingListItem } from "@/lib/api";
import { useCountdown } from "@/lib/countdown";
import { useLocale, useT } from "@/lib/i18n";

export function PendingPaymentCard() {
    const router = useRouter();
    const t = useT();
    const { locale } = useLocale();
    const { isAuthed } = useAuthState();
    const isRTL = locale === "ar";
    const [booking, setBooking] = useState<ApiBookingListItem | null>(null);

    // Fetch the still-payable holds every time home gains focus.
    useFocusEffect(
        useCallback(() => {
            if (!isAuthed) {
                setBooking(null);
                return;
            }
            let active = true;
            getPendingBookings()
                .then((res) => {
                    if (!active) return;
                    const soonest = [...(res.items ?? [])].sort((a, b) =>
                        (a.expires_at ?? "").localeCompare(b.expires_at ?? ""),
                    )[0];
                    setBooking(soonest ?? null);
                })
                .catch(() => {
                    if (active) setBooking(null);
                });
            return () => {
                active = false;
            };
        }, [isAuthed]),
    );

    const expiry = useCountdown(booking?.expires_at);

    if (!booking || expiry.expired) return null;

    const place = booking.place;
    const name = place?.title ?? t({ ar: "حجز", en: "Booking" });

    const open = () => {
        setSelectedBooking(booking);
        router.push("/booking-info");
    };

    return (
        <View style={styles.wrap}>
            <PressableScale
                scaleTo={0.985}
                haptic="select"
                onPress={open}
                style={[
                    styles.card,
                    { flexDirection: "row" },
                ]}
            >
                <View style={styles.textCol}>
                    <View
                        style={[
                            styles.badgeRow,
                            { flexDirection: "row" },
                        ]}
                    >
                        <View style={styles.badge}>
                            <ThemedText
                                style={[
                                    styles.badgeText,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "bold",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {t({
                                    ar: "بانتظار الدفع",
                                    en: "Pending payment",
                                })}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText
                        numberOfLines={1}
                        style={[
                            styles.title,
                            {
                                fontFamily: fontFamilyFor("bold", locale),
                                textAlign: "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {name}
                    </ThemedText>
                    <View
                        style={[
                            styles.metaRow,
                            { flexDirection: "row" },
                        ]}
                    >
                        <ThemedText
                            numberOfLines={1}
                            style={[
                                styles.meta,
                                { fontFamily: fontFamilyFor("medium", locale) },
                            ]}
                        >
                            {t({ ar: "تنتهي خلال", en: "Expires in" })}{" "}
                            {expiry.label}
                        </ThemedText>
                        <IconSymbol
                            name="chevron.left"
                            size={13}
                            color={Colors.light.textMuted}
                            style={
                                isRTL
                                    ? undefined
                                    : { transform: [{ rotate: "180deg" }] }
                            }
                        />
                    </View>
                </View>

                <View style={styles.frame}>
                    {place?.cover_photo_url ? (
                        <Image
                            source={{ uri: place.cover_photo_url }}
                            style={styles.frameImg}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.frameImg, styles.fallback]} />
                    )}
                </View>
            </PressableScale>
        </View>
    );
}

const FRAME_IMG = 66;

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: Spacing[5],
        marginBottom: Spacing[4],
        marginTop: Spacing[4],
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 26,
        borderCurve: "continuous",
        paddingVertical: Spacing[4],
        paddingHorizontal: Spacing[5],
        alignItems: "center",
        gap: Spacing[3],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        elevation: 3,
    },
    textCol: { flex: 1, gap: Spacing[1] + 1 },
    badgeRow: { alignItems: "center" },
    badge: {
        paddingHorizontal: Spacing[2] + 2,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "#FEF3C7",
    },
    badgeText: {
        fontSize: 10,
        lineHeight: 13,
        color: "#92400E",
        letterSpacing: 0.2,
    },
    title: { fontSize: 15, lineHeight: 20, color: "#000000" },
    metaRow: { alignItems: "center", gap: Spacing[1] + 2 },
    meta: {
        flexShrink: 1,
        fontSize: 12,
        lineHeight: 16,
        color: Colors.light.textMuted,
    },
    frame: {
        backgroundColor: "#FFFFFF",
        padding: 3,
        borderRadius: 20,
        borderCurve: "continuous",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
        elevation: 5,
    },
    frameImg: {
        width: FRAME_IMG,
        height: FRAME_IMG,
        borderRadius: 17,
        borderCurve: "continuous",
        backgroundColor: "#F3F4F6",
    },
    fallback: { backgroundColor: "#F0EEEC" },
});
