import { useRouter } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
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

import { DeleteIcon } from "@/components/icons/delete-icon";
import { PressableScale } from "@/components/pressable-scale";
import { Spinner } from "@/components/spinner";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, fontFamilyFor } from "@/constants/theme";
import { useAuthState } from "@/data/auth-state";
import {
  ApiError,
  deleteAccount,
  requestOtp,
  type ApiOtpRequestResponse,
} from "@/lib/api";
import { fireHaptic } from "@/lib/haptics";
import { useLocale, useT } from "@/lib/i18n";

type Step = "intro" | "otp";

const DANGER = "#C53030";
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

export default function DeleteAccountModal() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthState();

  // The OTP goes to the user's own phone, normalized to the national number
  // (strip non-digits, a leading 966 country code, and leading zeros).
  const phoneDigits = (user?.phone ?? "")
    .replace(/\D/g, "")
    .replace(/^966/, "")
    .replace(/^0+/, "");

  const [step, setStep] = useState<Step>("intro");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True when the delete failed because the account has active bookings — we
  // then offer a "cancel bookings" → contact-support shortcut.
  const [showSupport, setShowSupport] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [codeFocused, setCodeFocused] = useState(false);
  const codeRef = useRef<TextInput>(null);

  const canVerify = code.length === 6 && !busy;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const sendCode = async () => {
    if (busy || !phoneDigits) return;
    fireHaptic("forward");
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp("phone", phoneDigits, { locale });
      setStep("otp");
      setSecondsLeft(secondsFromOtpResponse(res));
      setTimeout(() => codeRef.current?.focus(), 120);
    } catch (e) {
      fireHaptic("tap");
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر إرسال الرمز", en: "Could not send code" }),
      );
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (secondsLeft > 0 || busy) return;
    fireHaptic("forward");
    setError(null);
    try {
      const res = await requestOtp("phone", phoneDigits, { locale });
      setSecondsLeft(secondsFromOtpResponse(res));
    } catch (e) {
      fireHaptic("tap");
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر إعادة الإرسال", en: "Could not resend" }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!canVerify) return;
    Keyboard.dismiss();
    fireHaptic("forward");
    setBusy(true);
    setError(null);
    setShowSupport(false);
    try {
      await deleteAccount(code, { locale });
      // Success: the JWT is invalidated server-side. Clear the local session
      // (signOut tolerates the now-dead token) and return to the logged-out app.
      await signOut().catch(() => {});
      router.back();
    } catch (e) {
      fireHaptic("tap");
      // Business-rule 422s (active bookings, host payouts, admin) and the
      // wrong/expired-code 422 all carry a human-readable message — show it and
      // keep the user signed in.
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "حدث خطأ ما، حاول مجدداً.", en: "Something went wrong, try again." }),
      );
      // If it's the active-bookings error, offer the contact-support shortcut.
      if (e instanceof ApiError && /booking|حج/i.test(e.message)) {
        setShowSupport(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    fireHaptic("back");
    Keyboard.dismiss();
    router.back();
  };

  const backToIntro = () => {
    fireHaptic("back");
    setStep("intro");
    setCode("");
    setError(null);
    setShowSupport(false);
    setSecondsLeft(0);
  };

  const isIntro = step === "intro";
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
        {/* Header: close (intro) / back (otp) */}
        <View style={styles.header}>
          <PressableScale
            onPress={isIntro ? close : backToIntro}
            scaleTo={0.88}
            haptic="none"
            style={styles.closeBtn}
          >
            <IconSymbol
              name={
                isIntro
                  ? "xmark"
                  : locale === "ar"
                    ? "chevron.right"
                    : "chevron.left"
              }
              size={18}
              color={Colors.light.text}
            />
          </PressableScale>
        </View>

        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {isIntro ? (
            <>
              <View style={styles.iconWrap}>
                <DeleteIcon size={30} color={DANGER} />
              </View>
              <ThemedText
                style={[styles.title, { fontFamily: fontFamilyFor("bold", locale) }]}
              >
                {t({ ar: "حذف الحساب", en: "Delete account" })}
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { fontFamily: fontFamilyFor("regular", locale) }]}
              >
                {t({
                  ar: "سيؤدي هذا إلى حذف حسابك وجميع بياناتك نهائياً، ولا يمكن التراجع عن ذلك. سنرسل رمز تحقق إلى جوالك لتأكيد الحذف.",
                  en: "This permanently deletes your account and all your data — this can't be undone. We'll send a verification code to your phone to confirm.",
                })}
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText
                style={[styles.title, { fontFamily: fontFamilyFor("bold", locale) }]}
              >
                {t({ ar: "تأكيد الحذف", en: "Confirm deletion" })}
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { fontFamily: fontFamilyFor("regular", locale) }]}
              >
                {t({
                  ar: "أدخل رمز التحقق المُرسل إلى جوالك لإتمام حذف الحساب.",
                  en: "Enter the verification code sent to your phone to permanently delete your account.",
                })}
              </ThemedText>

              <AnimatedField focused={codeFocused} style={styles.otpFieldBox}>
                <TextInput
                  ref={codeRef}
                  autoFocus
                  value={code}
                  onChangeText={(v) =>
                    setCode(toAsciiDigits(v).replace(/[^0-9]/g, "").slice(0, 6))
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
                  style={[styles.otpInput, { fontFamily: fontFamilyFor("bold", locale) }]}
                  maxLength={6}
                />
              </AnimatedField>
            </>
          )}

          {error ? (
            <ThemedText
              style={[styles.error, { fontFamily: fontFamilyFor("regular", locale) }]}
            >
              {error}
            </ThemedText>
          ) : null}

          {showSupport ? (
            <PressableScale
              onPress={() => router.push("/support")}
              scaleTo={0.97}
              haptic="select"
              style={styles.supportBtn}
            >
              <ThemedText
                style={[styles.supportText, { fontFamily: fontFamilyFor("bold", locale) }]}
              >
                {t({ ar: "تريد إلغاء حجوزاتك؟", en: "Want to cancel bookings?" })}
              </ThemedText>
            </PressableScale>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(
                insets.bottom + Spacing[2] + (isIntro ? 0 : 50),
                Spacing[5],
              ),
            },
          ]}
        >
          {!isIntro ? (
            <View style={styles.timerRow}>
              <ThemedText
                style={[styles.timerValue, { fontFamily: fontFamilyFor("bold", locale) }]}
              >
                {timerStr}
              </ThemedText>
              {secondsLeft > 0 ? (
                <ThemedText
                  style={[styles.timerLabel, { fontFamily: fontFamilyFor("regular", locale) }]}
                >
                  {t({ ar: "الوقت المتبقي", en: "Time remaining" })}
                </ThemedText>
              ) : (
                <Pressable onPress={resend} hitSlop={Spacing[3]}>
                  <ThemedText
                    style={[styles.timerResend, { fontFamily: fontFamilyFor("bold", locale) }]}
                  >
                    {t({ ar: "اعادة ارسال", en: "Resend" })}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          ) : null}

          {isIntro ? (
            <>
              {/* Safe default on top: full-width black Cancel. */}
              <PressableScale
                scaleTo={0.97}
                haptic="none"
                onPress={close}
                disabled={busy}
                style={busy ? [styles.ctaBlack, styles.ctaDisabled] : styles.ctaBlack}
              >
                <ThemedText
                  style={[styles.ctaText, { fontFamily: fontFamilyFor("bold", locale) }]}
                >
                  {t({ ar: "إلغاء", en: "Cancel" })}
                </ThemedText>
              </PressableScale>
              {/* Destructive action at the bottom. */}
              <PressableScale
                scaleTo={0.97}
                haptic="none"
                onPress={sendCode}
                disabled={busy}
                style={busy ? [styles.cta, styles.ctaDisabled] : styles.cta}
              >
                {busy ? (
                  <Spinner size={20} />
                ) : (
                  <ThemedText
                    style={[styles.ctaText, { fontFamily: fontFamilyFor("bold", locale) }]}
                  >
                    {t({ ar: "حذف حسابي", en: "Delete my account" })}
                  </ThemedText>
                )}
              </PressableScale>
            </>
          ) : (
            <PressableScale
              scaleTo={0.97}
              haptic="none"
              onPress={confirmDelete}
              disabled={busy || !canVerify}
              style={busy || !canVerify ? [styles.cta, styles.ctaDisabled] : styles.cta}
            >
              {busy ? (
                <Spinner size={20} />
              ) : (
                <ThemedText
                  style={[styles.ctaText, { fontFamily: fontFamilyFor("bold", locale) }]}
                >
                  {t({ ar: "تأكيد الحذف", en: "Confirm deletion" })}
                </ThemedText>
              )}
            </PressableScale>
          )}
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
    borderColor: interpolateColor(focus.value, [0, 1], ["rgba(0,0,0,0)", "#000000"]),
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

  bodyScroll: { flex: 1 },
  body: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    gap: Spacing[4],
    paddingBottom: Spacing[4],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#FEECEC",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    color: Colors.light.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textMuted,
    textAlign: "center",
    paddingHorizontal: Spacing[2],
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
    marginTop: Spacing[2],
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
    backgroundColor: DANGER,
  },
  ctaBlack: {
    width: "100%",
    paddingVertical: Spacing[5],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: "#000000",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "#FFFFFF", fontSize: 16, lineHeight: 22 },

  error: {
    fontSize: 13,
    lineHeight: 18,
    color: DANGER,
    marginTop: Spacing[3],
    textAlign: "center",
  },
  supportBtn: {
    alignSelf: "center",
    marginTop: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  supportText: { fontSize: 14, lineHeight: 18, color: Colors.light.coral },
});
