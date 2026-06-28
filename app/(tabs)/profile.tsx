import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useRouter, useSegments } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AboutIcon } from "@/components/icons/about-icon";
import { ContactIcon } from "@/components/icons/contact-icon";
import { DeleteIcon } from "@/components/icons/delete-icon";
import { LanguageIcon } from "@/components/icons/language-icon";
import { PolicyIcon } from "@/components/icons/policy-icon";
import { PrivacyIcon } from "@/components/icons/privacy-icon";
import { SignOutIcon } from "@/components/icons/sign-out-icon";
import { SwitchIcon } from "@/components/icons/switch-icon";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { HOST_MODE_ENABLED } from "@/constants/features";
import {
    Colors,
    Radius,
    Shadows,
    Spacing,
    fontFamilyFor,
} from "@/constants/theme";
import { useAuthState } from "@/data/auth-state";
import { setConfirm } from "@/data/confirm-dialog";
import {
    LOCALE_SWITCHING_ENABLED,
    useLocale,
    useRtlText,
    useT,
} from "@/lib/i18n";

type MenuIcon = (props: {
    size?: number;
    color?: string;
}) => React.ReactElement;

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#bdbdbd";
const SURFACE = "#f6f6f6";

const TITLE_AR = "حســـابـــي";
const SUBTITLE_AR =
    "سجل الدخول حتي تتمكن من تخطيط رحلتك القادمة او التحكم في عقاراتك";
const HOST_TITLE_AR = "ســجــل كــمــضــيــف";

interface MenuItemConfig {
    key: string;
    Icon: MenuIcon;
    label: string;
    onPress: () => void;
}

export default function ProfileScreen() {
    const t = useT();
    const router = useRouter();
    const { locale, setLocale } = useLocale();
    const rtl = useRtlText();

    const { isAuthed, user, signOut, updateUser } = useAuthState();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const tabBarHeight = insets.bottom * 0.75 + 64;

    // The route is the source of truth — if the user is physically inside the
    // (host) shell, treat them as a host regardless of the persisted mode
    // value. (Persistence is handled by `mode-transition` when the user
    // actually swaps modes — no need for a sync effect here, which used to
    // race with mode-transition and stamp the old mode back to SecureStore.)
    const inHostShell = (segments as string[]).includes("(host)");

    const isHost = user?.is_host === true;
    // Host mode is disabled for now (HOST_MODE_ENABLED) — keep the host
    // screens in place but hide every entry point into them.
    const showBecomeHostCard =
        HOST_MODE_ENABLED && isAuthed && !isHost && !inHostShell;
    // Always show the FAB when the user is in the host shell so they can
    // return to guest even if `is_host` ever goes stale.
    const showSwitchFab =
        HOST_MODE_ENABLED && isAuthed && (isHost || inHostShell);
    const switchTo = inHostShell ? "guest" : "host";
    const fabLabel = inHostShell
        ? t({ ar: "التبديل إلى وضع الضيف", en: "Switch to guest" })
        : t({ ar: "التبديل إلى وضع المضيف", en: "Switch to host" });

    const appVersion = Constants.expoConfig?.version ?? "1.0.0";
    const currentYear = new Date().getFullYear();

    const phoneDisplay = user?.phone ? `0${user.phone}` : "—";
    const nameDisplay = user?.name ?? t({ ar: "مستخدم", en: "User" });
    const initial = (user?.name ?? "ك").slice(0, 1);
    const genderDisplay = user?.gender
        ? user.gender === "male"
            ? t({ ar: "ذكر", en: "Male" })
            : t({ ar: "أنثى", en: "Female" })
        : "—";
    const emailDisplay = user?.email ?? "—";
    const birthDisplay = user?.birth_date
        ? new Intl.DateTimeFormat(
              locale === "ar" ? "ar-SA-u-ca-gregory" : "en-US",
              {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
              },
          ).format(new Date(`${user.birth_date}T00:00:00`))
        : "—";

    // Switch the app language/direction via a confirmation (like Log out, but a
    // black button). On confirm: persist + push to the profile API and flip the
    // direction instantly (no restart — direction is a Yoga style at the root).
    const switchLanguage = () => {
        const next = locale === "ar" ? "en" : "ar";
        setConfirm({
            title: t({ ar: "تغيير اللغة", en: "Change language" }),
            message: t({
                ar: "هل تريد تغيير لغة التطبيق؟",
                en: "Switch the app language?",
            }),
            confirmLabel: next === "ar" ? "العربية" : "English",
            cancelLabel: t({ ar: "إلغاء", en: "Cancel" }),
            onConfirm: async () => {
                // Persists locally + pushes to the profile API (SMS/push match).
                await setLocale(next);
                // Keep the cached auth user in sync so login-adoption stays
                // consistent across relaunches.
                if (user) await updateUser({ ...user, locale: next });
            },
        });
        router.push("/confirm");
    };

    const menuItems: MenuItemConfig[] = [
        // Language toggle hidden while Arabic/RTL is disabled (see
        // LOCALE_SWITCHING_ENABLED in lib/i18n).
        ...(LOCALE_SWITCHING_ENABLED
            ? [
                  {
                      key: "language",
                      Icon: LanguageIcon,
                      // Label is the language you'd switch TO (not translated).
                      label: locale === "ar" ? "English" : "العربية",
                      onPress: switchLanguage,
                  },
              ]
            : []),
        {
            key: "contact",
            Icon: ContactIcon,
            label: t({ ar: "تواصل معنا", en: "Contact us" }),
            onPress: () => router.push("/support"),
        },
        {
            key: "about",
            Icon: AboutIcon,
            label: t({ ar: "عن كالم", en: "About Calm" }),
            onPress: () => router.push("/page/about"),
        },
        {
            key: "terms",
            Icon: PolicyIcon,
            label: t({ ar: "الشروط والأحكام", en: "Terms of Service" }),
            onPress: () => router.push("/page/terms"),
        },
        {
            key: "privacy",
            Icon: PrivacyIcon,
            label: t({ ar: "سياسة الخصوصية", en: "Privacy Policy" }),
            onPress: () => router.push("/page/privacy"),
        },
        {
            key: "cancellation",
            Icon: PolicyIcon,
            label: t({
                ar: "سياسة الإلغاء والاسترداد",
                en: "Cancellation & Refund",
            }),
            onPress: () => router.push("/page/cancellation"),
        },
        {
            key: "community",
            Icon: AboutIcon,
            label: t({ ar: "معايير المجتمع", en: "Community Standards" }),
            onPress: () => router.push("/page/community"),
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <ThemedText
                    style={[
                        styles.title,
                        rtl,
                        {
                            fontFamily: fontFamilyFor("bold", locale),
                        },
                    ]}
                >
                    {t({ ar: TITLE_AR, en: "Account" })}
                </ThemedText>

                {!isAuthed ? (
                    <>
                        {/* Subtitle (not-logged-in only) */}
                        <ThemedText
                            style={[
                                styles.subtitle,
                                rtl,
                                {
                                    fontFamily: fontFamilyFor(
                                        "regular",
                                        locale,
                                    ),
                                },
                            ]}
                        >
                            {t({
                                ar: SUBTITLE_AR,
                                en: "Sign in to plan your next trip or manage your listings.",
                            })}
                        </ThemedText>
                        <View style={styles.ctaWrap}>
                            <PressableScale
                                onPress={() => router.push("/login")}
                                scaleTo={0.97}
                                haptic="forward"
                                style={styles.loginBtn}
                            >
                                <ThemedText
                                    style={[
                                        styles.loginBtnText,
                                        {
                                            fontFamily: fontFamilyFor(
                                                "bold",
                                                locale,
                                            ),
                                        },
                                    ]}
                                >
                                    {t({ ar: "تسجيل الدخول", en: "Login" })}
                                </ThemedText>
                            </PressableScale>
                        </View>
                    </>
                ) : (
                    <>
                        {/* User identity card */}
                        <View style={styles.userCard}>
                            <View style={styles.cardTopRow}>
                                <PressableScale
                                    haptic="select"
                                    scaleTo={0.95}
                                    onPress={() => router.push("/edit-profile")}
                                    style={styles.editBtn}
                                >
                                    <ThemedText
                                        style={[
                                            styles.editBtnText,
                                            {
                                                fontFamily: fontFamilyFor(
                                                    "bold",
                                                    locale,
                                                ),
                                            },
                                        ]}
                                    >
                                        {t({ ar: "تعديل", en: "Edit" })}
                                    </ThemedText>
                                </PressableScale>
                            </View>

                            <View style={styles.userRow}>
                                <View style={styles.avatarTile}>
                                    {user?.avatar_url ? (
                                        <Image
                                            source={{ uri: user.avatar_url }}
                                            style={styles.avatarImg}
                                            contentFit="cover"
                                            transition={150}
                                        />
                                    ) : (
                                        <ThemedText
                                            style={[
                                                styles.avatarText,
                                                {
                                                    fontFamily: fontFamilyFor(
                                                        "bold",
                                                        locale,
                                                    ),
                                                },
                                            ]}
                                        >
                                            {initial}
                                        </ThemedText>
                                    )}
                                </View>
                                <View style={styles.userFields}>
                                    <UserField
                                        label={t({ ar: "الأسم", en: "Name" })}
                                        value={nameDisplay}
                                        locale={locale}
                                    />
                                    <UserField
                                        label={t({
                                            ar: "رقم الجوال",
                                            en: "Phone",
                                        })}
                                        value={phoneDisplay}
                                        locale={locale}
                                    />
                                </View>
                            </View>

                            <View style={styles.cardDivider} />

                            <UserField
                                label={t({ ar: "الجنس", en: "Gender" })}
                                value={genderDisplay}
                                locale={locale}
                            />
                            <UserField
                                label={t({
                                    ar: "البريد الإلكتروني",
                                    en: "Email",
                                })}
                                value={emailDisplay}
                                locale={locale}
                            />
                            <UserField
                                label={t({
                                    ar: "تاريخ الميلاد",
                                    en: "Birth date",
                                })}
                                value={birthDisplay}
                                locale={locale}
                            />
                        </View>

                        {/* Become a host — informational only, does not switch mode */}
                        {showBecomeHostCard ? (
                            <PressableScale
                                haptic="select"
                                scaleTo={0.98}
                                onPress={() => {}}
                                style={styles.hostCard}
                            >
                                <ThemedText
                                    style={[
                                        styles.hostTitle,
                                        rtl,
                                        {
                                            fontFamily: fontFamilyFor(
                                                "bold",
                                                locale,
                                            ),
                                        },
                                    ]}
                                >
                                    {t({
                                        ar: HOST_TITLE_AR,
                                        en: "Become a host",
                                    })}
                                </ThemedText>
                                <ThemedText
                                    style={[
                                        styles.hostSubtitle,
                                        rtl,
                                        {
                                            fontFamily: fontFamilyFor(
                                                "regular",
                                                locale,
                                            ),
                                        },
                                    ]}
                                >
                                    {t({
                                        ar: SUBTITLE_AR,
                                        en: "Sign in to plan your next trip or manage your listings.",
                                    })}
                                </ThemedText>
                            </PressableScale>
                        ) : null}
                    </>
                )}

                {/* {isAuthed ? (
                    <>
                        <View style={{ marginTop: 12 }}></View>
                        <View style={styles.menuList}>
                            <MenuRow
                                Icon={ReviewsIcon}
                                label={
                                    inHostShell
                                        ? t({
                                              ar: "تقييمات على عقاراتي",
                                              en: "Reviews on my places",
                                          })
                                        : t({
                                              ar: "تقييمات عني",
                                              en: "Reviews about me",
                                          })
                                }
                                onPress={() => {}}
                                locale={locale}
                            /> 
                        </View>
                    </>
                ) : null} */}

                <View style={styles.divider} />

                {/* Menu list */}
                <View style={styles.menuList}>
                    {menuItems.map((item) => (
                        <MenuRow
                            key={item.key}
                            Icon={item.Icon}
                            label={item.label}
                            onPress={item.onPress}
                            locale={locale}
                        />
                    ))}
                    {isAuthed ? (
                        <MenuRow
                            Icon={DeleteIcon}
                            label={t({
                                ar: "حذف الحساب",
                                en: "Delete account",
                            })}
                            onPress={() => router.push("/delete-account")}
                            locale={locale}
                        />
                    ) : null}
                    {isAuthed ? (
                        <MenuRow
                            Icon={SignOutIcon}
                            label={t({ ar: "تسجيل الخروج", en: "Log out" })}
                            onPress={() => {
                                setConfirm({
                                    title: t({
                                        ar: "تسجيل الخروج",
                                        en: "Log out",
                                    }),
                                    message: t({
                                        ar: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
                                        en: "Are you sure you want to log out?",
                                    }),
                                    confirmLabel: t({
                                        ar: "خروج",
                                        en: "Log out",
                                    }),
                                    cancelLabel: t({
                                        ar: "إلغاء",
                                        en: "Cancel",
                                    }),
                                    destructive: true,
                                    onConfirm: () => signOut().catch(() => {}),
                                });
                                router.push("/confirm");
                            }}
                            locale={locale}
                            tint="#C53030"
                        />
                    ) : null}
                </View>

                <View style={styles.divider} />

                {/* Footer */}
                <View style={styles.footer}>
                    <Image
                        source={require("@/assets/logo/gray-logo.png")}
                        style={styles.footerLogo}
                        contentFit="contain"
                    />
                    <ThemedText
                        style={[
                            styles.footerVersion,
                            { fontFamily: fontFamilyFor("medium", locale) },
                        ]}
                    >
                        v{appVersion}
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.footerCopy,
                            { fontFamily: fontFamilyFor("regular", locale) },
                        ]}
                    >
                        {t({
                            ar: `جميع الحقوق محفوظة شركة كالم تيك © ${currentYear}`,
                            en: `© ${currentYear} Calm. All rights reserved.`,
                        })}
                    </ThemedText>
                </View>
            </ScrollView>

            {showSwitchFab ? (
                <View
                    pointerEvents="box-none"
                    style={[
                        styles.fabWrap,
                        { bottom: tabBarHeight + Spacing[4] },
                    ]}
                >
                    <PressableScale
                        scaleTo={0.95}
                        haptic="forward"
                        onPress={() =>
                            router.push({
                                pathname: "/mode-transition",
                                params: { to: switchTo },
                            })
                        }
                        style={styles.fab}
                    >
                        <BlurView
                            intensity={30}
                            tint="dark"
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.fabTint} />
                        <SwitchIcon size={16} color="#FFFFFF" />
                        <ThemedText
                            style={[
                                styles.fabText,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                },
                            ]}
                        >
                            {fabLabel}
                        </ThemedText>
                    </PressableScale>
                </View>
            ) : null}
        </SafeAreaView>
    );
}

function UserField({
    label,
    value,
    locale,
}: {
    label: string;
    value: string;
    locale: "ar" | "en";
}) {
    const isRTL = locale === "ar";
    const rtl = {
        textAlign: "left" as "right" | "left",
        writingDirection: (isRTL ? "rtl" : "ltr") as "rtl" | "ltr",
    };
    return (
        <View style={styles.userFieldRow}>
            <ThemedText
                style={[
                    styles.userFieldLabel,
                    rtl,
                    { fontFamily: fontFamilyFor("medium", locale) },
                ]}
            >
                {label}
            </ThemedText>
            <ThemedText
                numberOfLines={1}
                style={[
                    styles.userFieldValue,
                    rtl,
                    { fontFamily: fontFamilyFor("regular", locale) },
                ]}
            >
                {value}
            </ThemedText>
        </View>
    );
}

function MenuRow({
    Icon,
    label,
    onPress,
    locale,
    tint,
}: {
    Icon: MenuIcon;
    label: string;
    onPress: () => void;
    locale: "ar" | "en";
    tint?: string;
}) {
    const color = tint ?? TEXT_PRIMARY;
    const isRTL = locale === "ar";
    return (
        <PressableScale
            haptic="select"
            scaleTo={0.99}
            onPress={onPress}
            style={styles.menuRow}
        >
            <View style={styles.menuIconTile}>
                <Icon size={26} color={color} />
            </View>
            <ThemedText
                style={[
                    styles.menuLabel,
                    {
                        color,
                        fontFamily: fontFamilyFor("bold", locale),
                        textAlign: "left",
                        writingDirection: isRTL ? "rtl" : "ltr",
                    },
                ]}
                numberOfLines={1}
            >
                {label}
            </ThemedText>
        </PressableScale>
    );
}

const CARD_SHADOW = {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 50,
    elevation: 4,
} as const;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    scroll: {
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[8],
        paddingBottom: 140,
        gap: Spacing[5],
    },

    title: {
        fontSize: 22,
        lineHeight: 28,
        color: TEXT_PRIMARY,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: TEXT_SECONDARY,
    },

    ctaWrap: { alignItems: "flex-start" },
    loginBtn: {
        paddingHorizontal: Spacing[6],
        paddingVertical: Spacing[4],
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 4,
    },
    loginBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        lineHeight: 20,
    },

    userCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 30,
        borderCurve: "continuous",
        paddingHorizontal: Spacing[6],
        paddingTop: Spacing[4],
        paddingBottom: Spacing[6],
        gap: Spacing[4],
        ...CARD_SHADOW,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    cardDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#EEEEEE",
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing[5],
    },
    avatarTile: {
        width: 88,
        height: 88,
        borderRadius: 22,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        padding: 3,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 5,
    },
    avatarImg: {
        width: "100%",
        height: "100%",
        borderRadius: 19,
        borderCurve: "continuous",
        backgroundColor: SURFACE,
    },
    avatarText: {
        fontSize: 34,
        lineHeight: 40,
        color: TEXT_SECONDARY,
    },
    editBtn: {
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[4],
        borderRadius: 999,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: "#EAEAEA",
        backgroundColor: "#FFFFFF",
    },
    editBtnText: {
        fontSize: 13,
        lineHeight: 18,
        color: TEXT_PRIMARY,
    },
    userFields: {
        flex: 1,
        gap: Spacing[2],
    },
    userFieldRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing[3],
    },
    userFieldLabel: {
        fontSize: 15,
        lineHeight: 20,
        color: TEXT_PRIMARY,
        width: "30%",
    },
    userFieldValue: {
        fontSize: 15,
        lineHeight: 20,
        color: TEXT_SECONDARY,
        flexShrink: 1,
        width: "70%",
    },

    hostCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        borderCurve: "continuous",
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[5],
        gap: Spacing[2],
        ...CARD_SHADOW,
    },
    hostTitle: {
        fontSize: 15,
        lineHeight: 20,
        color: TEXT_PRIMARY,
    },
    hostSubtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: TEXT_SECONDARY,
    },

    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#D5D5D5",
        marginVertical: Spacing[2],
    },

    menuList: {
        gap: Spacing[1],
    },
    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing[3],
        paddingVertical: Spacing[3],
        paddingHorizontal: Spacing[1],
    },
    menuIconTile: {
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        lineHeight: 20,
        color: TEXT_PRIMARY,
    },

    footer: {
        alignItems: "center",
        paddingTop: Spacing[8],
        gap: 4,
    },
    footerLogo: { width: 80, height: 30 },
    footerVersion: {
        fontSize: 12,
        lineHeight: 16,
        color: "#D5D5D5",
        marginTop: 2,
    },
    footerCopy: {
        fontSize: 11,
        lineHeight: 16,
        color: "#D5D5D5",
        textAlign: "center",
    },

    fabWrap: {
        position: "absolute",
        bottom: Spacing[8],
        left: 0,
        right: 0,
        alignItems: "center",
    },
    fab: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing[2],
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[3],
        borderRadius: Radius.pill,
        overflow: "hidden",
        ...Shadows.modal,
    },
    fabTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(45, 45, 45, 0.8)",
    },
    fabText: {
        color: "#FFFFFF",
        fontSize: 12,
        lineHeight: 18,
    },
});
