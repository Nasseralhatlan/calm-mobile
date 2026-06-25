import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { PressableScale } from "@/components/pressable-scale";
import { Spinner } from "@/components/spinner";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, fontFamilyFor } from "@/constants/theme";
import { useAuthState } from "@/data/auth-state";
import { useHomeData } from "@/data/home";
import { useLoginCountry } from "@/data/login-country";
import {
  ApiError,
  requestOtp,
  verifyOtp,
  type ApiCountry,
  type ApiOtpRequestResponse,
} from "@/lib/api";
import { fireHaptic } from "@/lib/haptics";
import { LAYOUT_RTL, useLocale, useT } from "@/lib/i18n";

type Step = "phone" | "otp";

const DEFAULT_DIAL = "+966";
const FALLBACK_RESEND_SECONDS = 90;

function toAsciiDigits(v: string): string {
    return v
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function secondsFromOtpResponse(
    res: ApiOtpRequestResponse | undefined | null,
): number {
    if (!res) return FALLBACK_RESEND_SECONDS;
    if (res.expires_at) {
        const expiresAt = new Date(res.expires_at).getTime();
        if (!Number.isNaN(expiresAt)) {
            return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        }
    }
    if (typeof res.expires_in === "number" && res.expires_in > 0) {
        return res.expires_in;
    }
    if (typeof res.retry_after === "number" && res.retry_after > 0) {
        return res.retry_after;
    }
    return FALLBACK_RESEND_SECONDS;
}

export default function LoginModal() {
    const router = useRouter();
    const t = useT();
    const { locale } = useLocale();
    const insets = useSafeAreaInsets();
    const { signIn } = useAuthState();

    const home = useHomeData();
    const countries = home?.countries ?? [];
    const { country, setCountry } = useLoginCountry();

    const initialCountry = useMemo<ApiCountry | null>(() => {
        if (!countries.length) return null;
        return (
            countries.find((c) => c.dial_code === DEFAULT_DIAL) ?? countries[0]
        );
    }, [countries]);

    useEffect(() => {
        if (!country && initialCountry) setCountry(initialCountry);
    }, [initialCountry, country, setCountry]);

    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<Step>("phone");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [codeFocused, setCodeFocused] = useState(false);

    const phoneRef = useRef<TextInput>(null);
    const codeRef = useRef<TextInput>(null);

    const dial = country?.dial_code ?? DEFAULT_DIAL;
    const identifier = useMemo(
        () => phone.replace(/[^0-9]/g, "").replace(/^0+/, ""),
        [phone],
    );
    const displayPhone = `${dial} ${identifier}`;

    const isSaudi = dial === "+966";
    const canContinue =
        !busy &&
        (isSaudi ? /^5\d{8}$/.test(identifier) : identifier.length >= 6);
    const canVerify = code.length === 6 && !busy;

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const id = setInterval(() => {
            setSecondsLeft((s) => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [secondsLeft]);

    const sendOtp = async () => {
        if (!canContinue) return;
        Keyboard.dismiss();
        fireHaptic("forward");
        setBusy(true);
        setError(null);
        try {
            const res = await requestOtp("phone", identifier);
            setStep("otp");
            setSecondsLeft(secondsFromOtpResponse(res));
            setTimeout(() => codeRef.current?.focus(), 120);
        } catch (e) {
            fireHaptic("tap");
            setError(
                e instanceof ApiError
                    ? e.message
                    : t({ ar: "تعذر إرسال الرمز", en: "Could not send code" }),
            );
        } finally {
            setBusy(false);
        }
    };

    const resendOtp = async () => {
        if (secondsLeft > 0 || busy) return;
        fireHaptic("forward");
        setError(null);
        try {
            const res = await requestOtp("phone", identifier);
            setSecondsLeft(secondsFromOtpResponse(res));
        } catch (e) {
            fireHaptic("tap");
            setError(
                e instanceof ApiError
                    ? e.message
                    : t({ ar: "تعذر إعادة الإرسال", en: "Could not resend" }),
            );
        }
    };

    const submitOtp = async () => {
        if (!canVerify) return;
        Keyboard.dismiss();
        fireHaptic("forward");
        setBusy(true);
        setError(null);
        try {
            const res = await verifyOtp("phone", identifier, code);
            await signIn(res.token, res.user, res.expires_in);
            router.back();
        } catch (e) {
            fireHaptic("tap");
            setError(
                e instanceof ApiError
                    ? e.message
                    : t({ ar: "رمز غير صحيح", en: "Invalid code" }),
            );
        } finally {
            setBusy(false);
        }
    };

    const openCountryPicker = () => {
        fireHaptic("select");
        Keyboard.dismiss();
        router.push("/country-picker");
    };

    const close = () => {
        fireHaptic("back");
        Keyboard.dismiss();
        router.back();
    };

    const backToPhone = () => {
        fireHaptic("back");
        setStep("phone");
        setCode("");
        setError(null);
        setSecondsLeft(0);
        setTimeout(() => phoneRef.current?.focus(), 80);
    };

    const isPhone = step === "phone";
    const canSubmit = isPhone ? canContinue : canVerify;
    const onSubmit = isPhone ? sendOtp : submitOtp;
    const buttonLabel = isPhone
        ? t({ ar: "التالي", en: "Next" })
        : t({ ar: "تسجيل الدخول", en: "Login" });

    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    const timerStr = `${m}:${String(s).padStart(2, "0")}`;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                {/* Header: close/back + logo on the same row */}
                <View style={styles.header}>
                    <PressableScale
                        onPress={isPhone ? close : backToPhone}
                        scaleTo={0.88}
                        haptic="none"
                        style={styles.closeBtn}
                    >
                        <IconSymbol
                            name={isPhone ? "xmark" : "chevron.left"}
                            size={18}
                            color={Colors.light.text}
                        />
                    </PressableScale>
                    <View style={styles.logoCenter} pointerEvents="none">
                        <Image
                            source={require("@/assets/logo/logo.png")}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>
                </View>

                {/* Body — scrolls when the keyboard leaves little height
                    (e.g. iPad compatibility window) so the input never clips. */}
                <ScrollView
                    style={styles.bodyScroll}
                    contentContainerStyle={styles.body}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {isPhone ? (
                        <>
                            <ThemedText
                                style={[
                                    styles.title,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "bold",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {t({
                                    ar: "حياك الله في كالم",
                                    en: "Welcome to Calm",
                                })}
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.subtitle,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "regular",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {t({
                                    ar: "سجّل دخولك لاكتشاف أجمل الوجهات، وإدارة حجوزاتك بكل سهولة",
                                    en: "Sign in to discover top venues and manage your bookings.",
                                })}
                            </ThemedText>

                            <View style={styles.phoneRow}>
                                <AnimatedField
                                    focused={false}
                                    style={styles.dialPillBox}
                                >
                                    <Pressable
                                        onPress={openCountryPicker}
                                        style={styles.dialPillInner}
                                    >
                                        <ThemedText style={styles.dialFlag}>
                                            {country?.avatar ?? "🇸🇦"}
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.dialText,
                                                {
                                                    fontFamily: fontFamilyFor(
                                                        "bold",
                                                        locale,
                                                    ),
                                                },
                                            ]}
                                        >
                                            {dial}
                                        </ThemedText>
                                    </Pressable>
                                </AnimatedField>
                                <AnimatedField
                                    focused={phoneFocused}
                                    style={styles.phoneFieldBox}
                                >
                                    <TextInput
                                        ref={phoneRef}
                                        autoFocus
                                        value={phone}
                                        onChangeText={(v) =>
                                            setPhone(
                                                toAsciiDigits(v).replace(
                                                    /[^0-9]/g,
                                                    "",
                                                ),
                                            )
                                        }
                                        onFocus={() => setPhoneFocused(true)}
                                        onBlur={() => setPhoneFocused(false)}
                                        keyboardType="phone-pad"
                                        placeholder="500000000"
                                        placeholderTextColor="#9CA3AF"
                                        autoComplete="off"
                                        autoCorrect={false}
                                        spellCheck={false}
                                        textContentType="none"
                                        importantForAutofill="no"
                                        style={[
                                            styles.phoneInput,
                                            {
                                                fontFamily: fontFamilyFor(
                                                    "bold",
                                                    locale,
                                                ),
                                            },
                                        ]}
                                        maxLength={12}
                                    />
                                </AnimatedField>
                            </View>
                        </>
                    ) : (
                        <>
                            <ThemedText
                                style={[
                                    styles.title,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "bold",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {t({
                                    ar: "تحقق من رقم الجوال",
                                    en: "Verify phone number",
                                })}
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.subtitle,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "regular",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {t({
                                    ar: "تم إرسال رمز التحقق إلى رقم جوالك، أدخله للمتابعة بأمان",
                                    en: `We sent a code to ${displayPhone}. Enter it to continue.`,
                                })}
                            </ThemedText>

                            <AnimatedField
                                focused={codeFocused}
                                style={styles.otpFieldBox}
                            >
                                <TextInput
                                    ref={codeRef}
                                    autoFocus
                                    value={code}
                                    onChangeText={(v) =>
                                        setCode(
                                            toAsciiDigits(v)
                                                .replace(/[^0-9]/g, "")
                                                .slice(0, 6),
                                        )
                                    }
                                    onFocus={() => setCodeFocused(true)}
                                    onBlur={() => setCodeFocused(false)}
                                    keyboardType="number-pad"
                                    placeholder="–  –  –  –  –  –"
                                    placeholderTextColor="#9CA3AF"
                                    autoComplete="off"
                                    autoCorrect={false}
                                    spellCheck={false}
                                    textContentType="oneTimeCode"
                                    style={[
                                        styles.otpInput,
                                        {
                                            fontFamily: fontFamilyFor(
                                                "bold",
                                                locale,
                                            ),
                                        },
                                    ]}
                                    maxLength={6}
                                />
                            </AnimatedField>
                        </>
                    )}

                    {error ? (
                        <ThemedText
                            style={[
                                styles.error,
                                {
                                    fontFamily: fontFamilyFor(
                                        "regular",
                                        locale,
                                    ),
                                },
                            ]}
                        >
                            {error}
                        </ThemedText>
                    ) : null}
                </ScrollView>

                {/* Footer — always above the keyboard via KeyboardAvoidingView */}
                <View
                    style={[
                        styles.footer,
                        {
                            paddingBottom: Math.max(
                                insets.bottom + Spacing[2] + 50,
                                Spacing[5],
                            ),
                        },
                    ]}
                >
                    {!isPhone ? (
                        <View style={styles.timerRow}>
                            <ThemedText
                                style={[
                                    styles.timerValue,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "bold",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {timerStr}
                            </ThemedText>
                            {secondsLeft > 0 ? (
                                <ThemedText
                                    style={[
                                        styles.timerLabel,
                                        {
                                            fontFamily: fontFamilyFor(
                                                "regular",
                                                locale,
                                            ),
                                        },
                                    ]}
                                >
                                    {t({
                                        ar: "الوقت المتبقي",
                                        en: "Time remaining",
                                    })}
                                </ThemedText>
                            ) : (
                                <Pressable
                                    onPress={resendOtp}
                                    hitSlop={Spacing[3]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.timerResend,
                                            {
                                                fontFamily: fontFamilyFor(
                                                    "bold",
                                                    locale,
                                                ),
                                            },
                                        ]}
                                    >
                                        {t({ ar: "اعادة ارسال", en: "Resend" })}
                                    </ThemedText>
                                </Pressable>
                            )}
                        </View>
                    ) : null}

                    <PressableScale
                        scaleTo={0.97}
                        haptic="none"
                        onPress={onSubmit}
                        disabled={!canSubmit}
                        style={
                            canSubmit
                                ? styles.cta
                                : [styles.cta, styles.ctaDisabled]
                        }
                    >
                        {busy ? (
                            <Spinner size={20} />
                        ) : (
                            <ThemedText
                                style={[
                                    styles.ctaText,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "bold",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {buttonLabel}
                            </ThemedText>
                        )}
                    </PressableScale>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function AnimatedField({
    focused,
    style,
    children,
}: {
    focused: boolean;
    style: ViewStyle | ViewStyle[];
    children: ReactNode;
}) {
    const focus = useSharedValue(focused ? 1 : 0);

    useEffect(() => {
        focus.value = withTiming(focused ? 1 : 0, { duration: 200 });
    }, [focused, focus]);

    const animStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            focus.value,
            [0, 1],
            ["rgba(0,0,0,0)", "#000000"],
        ),
    }));

    return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.light.background },

    header: {
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[6] * 1.2,
        paddingBottom: Spacing[5],
        justifyContent: "center",
        minHeight: 88,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        alignSelf: "flex-start",
    },
    logoCenter: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },
    logo: { width: 110, height: 44 },

    bodyScroll: { flex: 1 },
    body: {
        flexGrow: 1,
        paddingHorizontal: Spacing[6],
        paddingTop: Spacing[6],
        gap: Spacing[4],
        paddingBottom: Spacing[4],
    },
    title: {
        fontSize: 24,
        lineHeight: 30,
        color: Colors.light.text,
        textAlign: "center",
        writingDirection: LAYOUT_RTL ? "rtl" : "ltr",
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.light.textMuted,
        textAlign: "center",
        writingDirection: LAYOUT_RTL ? "rtl" : "ltr",
        marginBottom: Spacing[4],
        paddingHorizontal: Spacing[3],
    },

    phoneRow: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: Spacing[2],
        height: 66,
    },
    dialPillBox: {
        backgroundColor: "#FAFAFA",
        borderRadius: 16,
        borderCurve: "continuous",
        borderWidth: 2,
        borderColor: "transparent",
        height: 66,
    },
    dialPillInner: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing[2],
        paddingHorizontal: Spacing[4],
    },
    dialFlag: { fontSize: 14, lineHeight: 24 },
    dialText: { fontSize: 14, lineHeight: 20, color: Colors.light.text },

    phoneFieldBox: {
        flex: 1,
        height: 66,
        backgroundColor: "#FAFAFA",
        borderRadius: 16,
        borderCurve: "continuous",
        borderWidth: 2,
        borderColor: "transparent",
        paddingHorizontal: Spacing[4],
        justifyContent: "center",
    },
    phoneInput: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.light.text,
        padding: 0,
        textAlign: "left",
    },

    otpFieldBox: {
        height: 66,
        backgroundColor: "#FAFAFA",
        borderRadius: 16,
        borderCurve: "continuous",
        borderWidth: 2,
        borderColor: "transparent",
        paddingHorizontal: Spacing[4],
        justifyContent: "center",
    },
    otpInput: {
        fontSize: 18,
        lineHeight: 24,
        color: Colors.light.text,
        padding: 0,
        letterSpacing: 6,
        textAlign: "center",
    },

    timerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing[3],
        marginBottom: Spacing[3],
    },
    timerValue: { fontSize: 14, color: Colors.light.text },
    timerLabel: { fontSize: 14, color: Colors.light.textMuted },
    timerResend: {
        fontSize: 14,
        color: Colors.light.coral,
        textDecorationLine: "underline",
    },

    footer: {
        paddingHorizontal: Spacing[6],
        paddingTop: Spacing[4],
        gap: Spacing[3],
        backgroundColor: Colors.light.background,
    },
    cta: {
        width: "100%",
        paddingVertical: Spacing[5],
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: "#000000",
    },
    ctaDisabled: {
        backgroundColor: "#1F1F1F",
        opacity: 0.5,
    },
    ctaText: { color: "#FFFFFF", fontSize: 16, lineHeight: 22 },

    error: {
        fontSize: 13,
        lineHeight: 18,
        color: "#C53030",
        marginTop: Spacing[3],
        textAlign: "center",
        writingDirection: LAYOUT_RTL ? "rtl" : "ltr",
    },
});
