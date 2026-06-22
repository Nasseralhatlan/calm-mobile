import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, fontFamilyFor } from "@/constants/theme";
import { loadLastSearch, type LastSearch } from "@/data/last-search";
import { clearResume } from "@/data/resume";
import { setAppliedFilters } from "@/data/search-filters";
import { fireHaptic } from "@/lib/haptics";
import { useLocale, useT } from "@/lib/i18n";

const SPRING = { damping: 13, stiffness: 130 };

// A stacked "deck" of the top results — two cards fan out behind the front one
// when it appears, hinting there are more options.
function StackedThumb({ urls }: { urls: string[] }) {
    const items = urls.slice(0, 3);
    const back = useSharedValue(0);
    const mid = useSharedValue(0);

    useEffect(() => {
        mid.value = withDelay(80, withSpring(17, SPRING));
        back.value = withDelay(150, withSpring(-19, SPRING));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urls.join("|")]);

    const backStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${back.value}deg` }],
    }));
    const midStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${mid.value}deg` }],
    }));

    return (
        <View style={styles.stack}>
            {items[2] ? (
                <View style={styles.layer}>
                    <Animated.View style={[styles.frame, backStyle]}>
                        <Image
                            source={{ uri: items[2] }}
                            style={styles.frameImg}
                            contentFit="cover"
                        />
                    </Animated.View>
                </View>
            ) : null}
            {items[1] ? (
                <View style={styles.layer}>
                    <Animated.View style={[styles.frame, midStyle]}>
                        <Image
                            source={{ uri: items[1] }}
                            style={styles.frameImg}
                            contentFit="cover"
                        />
                    </Animated.View>
                </View>
            ) : null}
            <View style={styles.layer}>
                <View style={styles.frame}>
                    {items[0] ? (
                        <Image
                            source={{ uri: items[0] }}
                            style={styles.frameImg}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.frameImg, styles.fallback]} />
                    )}
                </View>
            </View>
        </View>
    );
}

export function LastSearchCard() {
    const router = useRouter();
    const t = useT();
    const { locale } = useLocale();
    const isRTL = locale === "ar";
    const [last, setLast] = useState<LastSearch | null>(null);

    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    // Re-read on every focus so a fresh search shows up when returning home.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            loadLastSearch().then((s) => {
                if (active) setLast(s);
            });
            return () => {
                active = false;
            };
        }, []),
    );

    // Reset the exit transform whenever a (new) search appears.
    useEffect(() => {
        if (last) {
            opacity.value = 1;
            scale.value = 1;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [last]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    if (!last) return null;

    const loc = (v: { ar: string; en: string }) => (isRTL ? v.ar : v.en);
    const cityLabel = last.city ? loc(last.city) : null;
    const areaLabel =
        last.areas.length > 0
            ? loc(last.areas[0]) +
              (last.areas.length > 1 ? ` +${last.areas.length - 1}` : "")
            : null;
    const typeLabel =
        last.types.length > 0
            ? loc(last.types[0]) +
              (last.types.length > 1 ? ` +${last.types.length - 1}` : "")
            : null;
    const subtitle = [cityLabel, areaLabel, typeLabel]
        .filter(Boolean)
        .join(" · ");

    const open = () => {
        setAppliedFilters(last.filters);
        router.push({ pathname: "/results", params: { resume: "1" } });
    };

    const finishClear = () => {
        void clearResume();
        setLast(null);
    };

    const clear = () => {
        fireHaptic("select");
        opacity.value = withTiming(0, { duration: 220 });
        scale.value = withTiming(0.96, { duration: 220 }, (done) => {
            if (done) runOnJS(finishClear)();
        });
    };

    return (
        <Animated.View style={[styles.wrap, animStyle]}>
            {/* Clear: a small contained button above the card at the trailing end. */}
            <View style={styles.clearRow}>
                <Pressable onPress={clear} hitSlop={8} style={styles.clearBtn}>
                    <ThemedText
                        style={[
                            styles.clearText,
                            { fontFamily: fontFamilyFor("medium", locale) },
                        ]}
                    >
                        {t({ ar: "مسح", en: "Clear" })}
                    </ThemedText>
                </Pressable>
            </View>

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
                    <ThemedText
                        numberOfLines={2}
                        style={[
                            styles.title,
                            {
                                fontFamily: fontFamilyFor("bold", locale),
                                textAlign: isRTL ? "right" : "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {t({
                            ar: "أكمل بحثك الأخير",
                            en: "Continue your last search",
                        })}
                    </ThemedText>
                    <View
                        style={[
                            styles.subRow,
                            { flexDirection: "row" },
                        ]}
                    >
                        <ThemedText
                            numberOfLines={1}
                            style={[
                                styles.subtitle,
                                { fontFamily: fontFamilyFor("medium", locale) },
                            ]}
                        >
                            {subtitle ||
                                t({ ar: "كل الأماكن", en: "All places" })}
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

                <StackedThumb urls={last.thumbs ?? []} />
            </PressableScale>
        </Animated.View>
    );
}

const FRAME_IMG = 66;

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: Spacing[5],
    },
    clearRow: {
        // Clear chip at the far (trailing) end — right in LTR, left in RTL.
        alignItems: "flex-end",
        marginBottom: Spacing[2],
    },
    clearBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 8,
        paddingTop: 4,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "#F0F0F0",
    },
    clearText: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 26,
        borderCurve: "continuous",
        paddingVertical: Spacing[3],
        paddingHorizontal: Spacing[5],
        alignItems: "center",
        gap: Spacing[3],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        elevation: 3,
    },
    textCol: {
        flex: 1,
        gap: Spacing[1] + 1,
    },
    title: {
        fontSize: 14,
        lineHeight: 19,
        color: "#000000",
    },
    subRow: {
        alignItems: "center",
        gap: Spacing[1] + 2,
    },
    subtitle: {
        flexShrink: 1,
        fontSize: 12,
        lineHeight: 16,
        color: Colors.light.textMuted,
    },

    stack: {
        width: 92,
        height: 88,
    },
    layer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    frame: {
        backgroundColor: "#FFFFFF",
        padding: 3,
        borderRadius: 20,
        borderCurve: "continuous",
        transformOrigin: "50% 100%",
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
    fallback: {
        backgroundColor: "#F0EEEC",
    },
});
