import { Stack, useRouter } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";

import { EmailIcon } from "@/components/icons/email-icon";
import { HeartIcon } from "@/components/icons/heart-icon";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, fontFamilyFor } from "@/constants/theme";
import { useHomeData } from "@/data/home";
import { useLocale, useT } from "@/lib/i18n";

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#6B7280";

export default function SupportScreen() {
    const { locale } = useLocale();
    const t = useT();
    const router = useRouter();
    const home = useHomeData();
    const phone = home?.settings?.support_phone ?? null;
    const email = home?.settings?.support_email ?? null;

    const openWhatsApp = () => {
        if (!phone) return;
        const digits = phone.replace(/[^0-9]/g, "");
        Linking.openURL(`https://wa.me/${digits}`).catch(() => {});
        router.back();
    };

    const openEmail = () => {
        if (!email) return;
        Linking.openURL(`mailto:${email}`).catch(() => {});
        router.back();
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.heart}>
                <HeartIcon
                    size={40}
                    fill={Colors.light.coral}
                    stroke="#FFFFFF"
                    strokeWidth={1.8}
                />
            </View>

            <ThemedText
                style={[
                    styles.title,
                    {
                        fontFamily: fontFamilyFor("bold", locale),
                        textAlign: "center",
                    },
                ]}
            >
                {t({ ar: "تواصل مع الدعم", en: "Contact support" })}
            </ThemedText>
            <ThemedText
                style={[
                    styles.subtitle,
                    {
                        fontFamily: fontFamilyFor("regular", locale),
                        textAlign: "center",
                    },
                ]}
            >
                {t({
                    ar: "نرد عليك خلال دقائق، يسعدنا مساعدتك.",
                    en: "We reply within minutes — we are happy to help you.",
                })}
            </ThemedText>

            <View style={styles.row}>
                <PressableScale
                    onPress={openWhatsApp}
                    disabled={!phone}
                    scaleTo={0.97}
                    haptic="forward"
                    style={[styles.cardBtn, { opacity: phone ? 1 : 0.4 }]}
                >
                    <View style={styles.iconCircle}>
                        <WhatsAppIcon
                            size={26}
                            color={TEXT_PRIMARY}
                            strokeWidth={1.6}
                        />
                    </View>
                    <ThemedText
                        style={[
                            styles.cardLabel,
                            { fontFamily: fontFamilyFor("bold", locale) },
                        ]}
                    >
                        {t({ ar: "واتساب", en: "WhatsApp" })}
                    </ThemedText>
                </PressableScale>

                <PressableScale
                    onPress={openEmail}
                    disabled={!email}
                    scaleTo={0.97}
                    haptic="select"
                    style={[styles.cardBtn, { opacity: email ? 1 : 0.4 }]}
                >
                    <View style={styles.iconCircle}>
                        <EmailIcon
                            size={26}
                            color={TEXT_PRIMARY}
                            strokeWidth={1.6}
                        />
                    </View>
                    <ThemedText
                        style={[
                            styles.cardLabel,
                            { fontFamily: fontFamilyFor("bold", locale) },
                        ]}
                    >
                        {t({ ar: "البريد الإلكتروني", en: "Email" })}
                    </ThemedText>
                </PressableScale>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: Colors.light.background,
        paddingTop: Spacing[12],
        paddingHorizontal: Spacing[5],
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    heart: {
        marginBottom: Spacing[4],
        shadowColor: Colors.light.coral,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 5,
    },
    title: {
        fontSize: 19,
        lineHeight: 25,
        color: TEXT_PRIMARY,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: TEXT_SECONDARY,
        marginTop: Spacing[2],
        marginBottom: Spacing[6],
    },
    row: {
        flexDirection: "row",
        gap: Spacing[3],
        alignSelf: "stretch",
    },
    cardBtn: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        borderCurve: "continuous",
        borderWidth: 0.5,
        borderColor: "#F0F0F0",
        paddingVertical: Spacing[5],
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing[3],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 3,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderCurve: "continuous",
        backgroundColor: "#F4F4F4",
        alignItems: "center",
        justifyContent: "center",
    },
    cardLabel: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_PRIMARY,
        textAlign: "center",
    },
});
