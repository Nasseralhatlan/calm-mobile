import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeartIcon } from "@/components/icons/heart-icon";
import { ShareIcon } from "@/components/icons/share-icon";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { ZoomableImage } from "@/components/zoomable-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, fontFamilyFor } from "@/constants/theme";
import { useLikes } from "@/data/likes";
import { getPhotoViewer } from "@/data/photo-viewer";
import { addPlaceInterest } from "@/data/place-interest";
import { useLocale, useT } from "@/lib/i18n";
import { sharePlace } from "@/lib/share";

export default function PhotoViewerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const t = useT();
    const { locale } = useLocale();
    const { width, height } = useWindowDimensions();

    // Captured once on mount — the gallery stashed the set + start index here.
    const cfg = useRef(getPhotoViewer()).current;
    const items = useMemo(() => cfg?.items ?? [], [cfg]);
    const placeId = cfg?.placeId ?? "";
    const [index, setIndex] = useState(cfg?.index ?? 0);
    const [zoomed, setZoomed] = useState(false);

    // RTL previewer: a zoomable FlatList can't use the scaleX mirror trick (it
    // would invert pinch-pan), so instead reverse the data and map indices —
    // the list scrolls plain LTR but, with reversed data, the first photo sits
    // on the right and dragging right advances. `index` stays LOGICAL.
    const isRTL = locale === "ar";
    const len = items.length;
    const data = useMemo(
        () => (isRTL ? items.slice().reverse() : items),
        [items, isRTL],
    );
    const toListIndex = (logical: number) => (isRTL ? len - 1 - logical : logical);
    const toLogical = (li: number) => (isRTL ? len - 1 - li : li);
    // Keep the latest mapper reachable from the stable viewability ref below.
    const toLogicalRef = useRef(toLogical);
    toLogicalRef.current = toLogical;

    const { isLiked, toggle } = useLikes();
    const liked = isLiked(placeId, cfg?.likedFallback ?? false);

    const onShare = useCallback(() => {
        sharePlace(placeId, cfg?.title ? t(cfg.title) : undefined);
    }, [placeId, cfg, t]);

    // Track the visible page via viewability (direction-agnostic — works whether
    // the horizontal list scrolls LTR or RTL, unlike contentOffset math).
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
            const i = viewableItems[0]?.index;
            if (i != null) {
                setIndex(toLogicalRef.current(i));
                if (cfg?.placeId) addPlaceInterest(cfg.placeId, "swipe", 6);
            }
        },
    ).current;

    if (items.length === 0) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
            </View>
        );
    }

    const current = items[Math.min(index, items.length - 1)];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" animated />

            {/* Immersive backdrop: the current photo, blurred + dimmed. The source
          cross-fades as you swipe, so the whole screen shifts mood per photo. */}
            <Image
                source={{ uri: current.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={180}
            />
            <BlurView
                intensity={100}
                tint="dark"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                    },
                ]}
            />
            <View style={styles.backdropDim} pointerEvents="none" />

            <FlatList
                data={data}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                // Force LTR layout so getItemLayout's offsets (width * i) match the
                // actual item positions — otherwise the inherited RTL direction
                // mirrors the layout and the virtualization window misaligns,
                // leaving every page blank except the middle. RTL is achieved by
                // reversing `data` instead.
                style={styles.list}
                initialScrollIndex={toListIndex(index)}
                getItemLayout={(_, i) => ({
                    length: width,
                    offset: width * i,
                    index: i,
                })}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                // Lock paging while an image is zoomed in so panning works.
                scrollEnabled={!zoomed}
                windowSize={3}
                renderItem={({ item, index: i }) => (
                    <ZoomableImage
                        uri={item.uri}
                        width={width}
                        height={height}
                        // `i` is the list position; `index` is logical.
                        active={toLogical(i) === index}
                        onPinchChange={setZoomed}
                    />
                )}
            />

            {/* Self-contained blurry info pill: section + counter. */}
            <View
                style={[styles.infoPill, { top: insets.top + 8 }]}
                pointerEvents="none"
            >
                <BlurView
                    intensity={40}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.pillTint} />
                <ThemedText
                    style={[
                        styles.section,
                        { fontFamily: fontFamilyFor("bold", locale) },
                    ]}
                    numberOfLines={1}
                >
                    {t(current.section)}
                </ThemedText>
                <ThemedText
                    style={[
                        styles.counter,
                        { fontFamily: fontFamilyFor("medium", locale) },
                    ]}
                >
                    {index + 1} / {items.length}
                </ThemedText>
            </View>

            {/* Self-contained blurry circular close button. */}
            <PressableScale
                onPress={() => router.back()}
                scaleTo={0.9}
                haptic="back"
                style={[styles.closeBtn, { top: insets.top + 8 }]}
            >
                <BlurView
                    intensity={40}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.pillTint} />
                <IconSymbol name={locale === "ar" ? "chevron.right" : "chevron.left"} size={22} color="#FFFFFF" />
            </PressableScale>

            {/* Self-contained blurry share + like cluster. */}
            <View style={[styles.topRight, { top: insets.top + 8 }]}>
                <PressableScale
                    onPress={onShare}
                    scaleTo={0.9}
                    haptic="select"
                    style={styles.circleBtn}
                >
                    <BlurView
                        intensity={40}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.pillTint} />
                    <ShareIcon size={18} stroke="#FFFFFF" strokeWidth={2.2} />
                </PressableScale>
                <PressableScale
                    onPress={() => toggle(placeId, liked)}
                    scaleTo={0.9}
                    haptic="select"
                    style={styles.circleBtn}
                >
                    <BlurView
                        intensity={40}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.pillTint} />
                    <HeartIcon
                        size={20}
                        stroke={liked ? Colors.light.coral : "#FFFFFF"}
                        fill={liked ? Colors.light.coral : "none"}
                        strokeWidth={1.8}
                    />
                </PressableScale>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000000" },
    // Always LTR; RTL is handled by reversing the data + index mapping.
    list: { direction: "ltr" },
    backdropDim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
    },

    infoPill: {
        position: "absolute",
        alignSelf: "center",
        height: 42,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        maxWidth: "66%",
        paddingHorizontal: 16,
        borderRadius: 21,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.18)",
    },
    pillTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.25)",
    },
    section: {
        color: "#FFFFFF",
        fontSize: 14,
        flexShrink: 1,
    },
    counter: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
    },

    circleBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.18)",
    },
    closeBtn: {
        position: "absolute",
        insetInlineStart: 14,
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.18)",
    },
    topRight: {
        position: "absolute",
        insetInlineEnd: 14,
        flexDirection: "row",
        gap: 10,
    },
});
