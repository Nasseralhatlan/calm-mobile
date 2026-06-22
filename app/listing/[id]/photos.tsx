import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeartIcon } from "@/components/icons/heart-icon";
import { ShareIcon } from "@/components/icons/share-icon";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, fontFamilyFor } from "@/constants/theme";
import { useLikes } from "@/data/likes";
import { setPhotoViewer, type PhotoViewerItem } from "@/data/photo-viewer";
import { addPlaceInterest } from "@/data/place-interest";
import { useListingForId } from "@/hooks/use-listing-for-id";
import { useLocale, useT } from "@/lib/i18n";
import { setAspect } from "@/lib/photo-aspect-cache";
import { sharePlace } from "@/lib/share";

const { width: SCREEN_W } = Dimensions.get("window");
const CHIP_W = 76;
const CHIP_H = 54;
const SECTION_PAD = Spacing[5];
const HEADER_ROW_HEIGHT = 52;
// Thin white seam between full-bleed gallery photos.
const GALLERY_GAP = 6;
// Fixed hero ratio (wide landscape). Keeping every row a known height lets the
// section navigator jump to an exact computed offset (no FlashList estimate).
const HERO_ASPECT = 3 / 2;
// Section header heights (title + optional one-line detail) — see styles below.
const HEADER_H = 72;
const HEADER_H_WITH_DETAIL = 92;

// Full-width "hero" photo at a fixed ratio (cover-cropped).
function GalleryPhoto({ uri, onPress }: { uri: string; onPress: () => void }) {
    return (
        <PressableScale
            onPress={onPress}
            scaleTo={0.98}
            haptic="select"
            unstable_pressDelay={70}
            style={styles.photo}
        >
            <ExpoImage
                source={{ uri }}
                // recyclingKey keeps a reused cell from briefly showing the prior photo.
                recyclingKey={uri}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                // Cache the natural aspect so the full-screen viewer sizes instantly.
                onLoad={(e) => {
                    const w = e.source?.width ?? 0;
                    const h = e.source?.height ?? 0;
                    if (w > 0 && h > 0) setAspect(uri, w / h);
                }}
            />
        </PressableScale>
    );
}

const hasDetail = (g: RoomGroup) =>
    !!(g.detail.ar?.trim() || g.detail.en?.trim());

// One tile in a 2-up row — fixed ratio, cover-cropped.
function GalleryTile({ uri, onPress }: { uri: string; onPress: () => void }) {
    return (
        <PressableScale
            onPress={onPress}
            scaleTo={0.98}
            haptic="select"
            unstable_pressDelay={70}
            style={styles.tile}
        >
            <ExpoImage
                source={{ uri }}
                recyclingKey={uri}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />
        </PressableScale>
    );
}

// Flattened row model so FlashList only mounts on-screen photos. `index` is the
// photo's position in the flat all-photos list (for opening the viewer).
type GalleryRow =
    | { type: "header"; key: string; group: RoomGroup }
    | { type: "full"; key: string; uri: string; index: number }
    | {
          type: "pair";
          key: string;
          left: string;
          leftIndex: number;
          right: string;
          rightIndex: number;
      };

interface RoomGroup {
    key: string;
    title: { ar: string; en: string };
    detail: { ar: string; en: string };
    photos: string[];
}

export default function ListingPhotosScreen() {
    const { id, section } = useLocalSearchParams<{
        id: string;
        section?: string;
    }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const t = useT();
    const { locale } = useLocale();
    const isRTL = locale === "ar";
    const { isLiked, toggle } = useLikes();

    const { listing, apiDetail } = useListingForId(id);
    const liked = listing ? isLiked(listing.id, listing.isLiked) : false;

    const flashRef = useRef<FlashListRef<GalleryRow>>(null);
    const headerHeight = insets.top + HEADER_ROW_HEIGHT;
    // Measured height of the whole top bar (header row + navigator), so list
    // content starts below it and section jumps land just under it.
    const [barH, setBarH] = useState(0);
    const navTop = barH || headerHeight + 92;

    // Collapse just the header row (back/title/actions) on scroll-down and bring
    // it back on a small scroll-up; the image navigator stays pinned either way.
    const collapsed = useSharedValue(0);
    const lastY = useRef(0);
    const onScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = e.nativeEvent.contentOffset.y;
            const dy = y - lastY.current;
            if (y <= HEADER_ROW_HEIGHT) {
                collapsed.value = withTiming(0, { duration: 180 });
            } else if (dy > 6) {
                collapsed.value = withTiming(1, { duration: 180 });
            } else if (dy < -6) {
                collapsed.value = withTiming(0, { duration: 180 });
            }
            // Scrolling the gallery is an interest signal (counts once/session).
            if (y > 240) addPlaceInterest(id, "galleryScroll", 8);
            lastY.current = y;
        },
        [collapsed, id],
    );

    // On scroll-down we collapse the section navigator (NOT the header row): it
    // shrinks to zero height + fades, so the bar reduces to just the header row
    // (back / share / like). Scrolling up brings the navigator back.
    const [navH, setNavH] = useState(0);
    const navAnim = useAnimatedStyle(() => ({
        height: navH > 0 ? navH * (1 - collapsed.value) : undefined,
        opacity: 1 - collapsed.value,
    }));

    const groups = useMemo<RoomGroup[]>(() => {
        if (!listing) return [];

        // Backend ships the gallery pre-grouped by amenity and pre-ordered.
        if (apiDetail?.photo_groups?.length) {
            return apiDetail.photo_groups.map((g): RoomGroup => {
                const desc = g.attribute_id
                    ? (apiDetail.attributes.find(
                          (a) => a.attribute.id === g.attribute_id,
                      )?.description ?? "")
                    : "";
                return {
                    key: g.attribute_id ?? "general",
                    title: g.attribute
                        ? { ar: g.attribute.name_ar, en: g.attribute.name_en }
                        : { ar: "عام", en: "General" },
                    detail: { ar: desc, en: desc },
                    photos: g.photos.map((p) => p.url),
                };
            });
        }

        if (!listing.photos.length) return [];
        return [
            {
                key: "all",
                title: { ar: "جميع الصور", en: "All photos" },
                detail: { ar: "", en: "" },
                photos: listing.photos,
            },
        ];
    }, [listing, apiDetail]);

    // Flatten groups → header + a full-width hero (only when the photo count is
    // odd) + 2-up pair rows. Remember each header's row index for the chips, and
    // a flat photo list so a tapped tile can open the viewer at the right index.
    const { rows, sectionOffsetByKey, allPhotos } = useMemo(() => {
        const out: GalleryRow[] = [];
        const offsetByKey: Record<string, number> = {};
        const flat: PhotoViewerItem[] = [];

        // Deterministic row heights → exact scroll offsets for the navigator.
        const pairRowH = ((SCREEN_W - GALLERY_GAP) / 2) * (3 / 4) + GALLERY_GAP;
        const heroRowH = SCREEN_W / HERO_ASPECT + GALLERY_GAP;
        let y = 0;

        for (const g of groups) {
            offsetByKey[g.key] = y;
            out.push({ type: "header", key: `h-${g.key}`, group: g });
            y += hasDetail(g) ? HEADER_H_WITH_DETAIL : HEADER_H;

            const ps = g.photos;
            const n = ps.length;
            if (n === 0) continue;
            // Strictly alternate pair/full rows so two 2-up rows are never
            // adjacent. Start type is chosen so the photos divide exactly:
            //  1→[full], 2→[pair], 3→[full,pair], 4→[full,pair,full],
            //  5→[pair,full,pair], 6→[full,pair,full,pair], …
            let i = 0;
            let nextIsPair = n % 3 === 2;
            while (i < n) {
                const base = flat.length;
                if (nextIsPair && n - i >= 2) {
                    flat.push(
                        { uri: ps[i], section: g.title },
                        { uri: ps[i + 1], section: g.title },
                    );
                    out.push({
                        type: "pair",
                        key: `${g.key}-${i}`,
                        left: ps[i],
                        leftIndex: base,
                        right: ps[i + 1],
                        rightIndex: base + 1,
                    });
                    y += pairRowH;
                    i += 2;
                } else {
                    flat.push({ uri: ps[i], section: g.title });
                    out.push({
                        type: "full",
                        key: `${g.key}-${i}`,
                        uri: ps[i],
                        index: base,
                    });
                    y += heroRowH;
                    i += 1;
                }
                nextIsPair = !nextIsPair;
            }
        }
        return {
            rows: out,
            sectionOffsetByKey: offsetByKey,
            allPhotos: flat,
        };
    }, [groups]);

    // Opened from a space card on the place page → jump straight to that section.
    const didJumpRef = useRef(false);
    useEffect(() => {
        if (didJumpRef.current || !section) return;
        const offset = sectionOffsetByKey[section];
        if (offset === undefined) return;
        didJumpRef.current = true;
        const jump = () =>
            flashRef.current?.scrollToOffset({ offset, animated: false });
        // Once on the next frame, and again after layout settles (offsets are
        // deterministic, but the list needs a beat to measure before scrolling).
        requestAnimationFrame(jump);
        const tid = setTimeout(jump, 120);
        return () => clearTimeout(tid);
    }, [section, sectionOffsetByKey]);

    if (!listing) {
        return (
            <View style={styles.notFound}>
                <Stack.Screen options={{ headerShown: false }} />
                <ThemedText variant="heading">
                    {t({
                        ar: "لم يتم العثور على الصور",
                        en: "Photos not found",
                    })}
                </ThemedText>
            </View>
        );
    }

    const close = () => {
        router.back();
    };

    const handleLike = () => {
        toggle(listing.id, liked);
    };

    const openViewer = (index: number) => {
        addPlaceInterest(listing.id, "preview", 10);
        setPhotoViewer({
            items: allPhotos,
            index,
            placeId: listing.id,
            title: listing.title,
            likedFallback: liked,
        });
        router.push("/photo-viewer");
    };

    const scrollToSection = (key: string) => {
        const offset = sectionOffsetByKey[key];
        if (offset !== undefined) {
            // Scroll to the section's exact precomputed offset so the header lands
            // right under the bar (start of section) — no FlashList estimate.
            flashRef.current?.scrollToOffset({ offset, animated: true });
        }
    };

    const chipStrip = (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
        >
            {groups.map((g) => (
                <View key={g.key}>
                    <PressableScale
                        onPress={() => scrollToSection(g.key)}
                        scaleTo={0.95}
                        style={styles.chip}
                    >
                        <ExpoImage
                            source={{ uri: g.photos[0] }}
                            style={styles.chipImage}
                            contentFit="cover"
                        />
                        <ThemedText
                            numberOfLines={1}
                            style={[
                                styles.chipLabel,
                                { fontFamily: fontFamilyFor("medium", locale) },
                            ]}
                        >
                            {t(g.title)}
                        </ThemedText>
                    </PressableScale>
                </View>
            ))}
        </ScrollView>
    );

    const renderRow = ({ item }: { item: GalleryRow }) => {
        if (item.type === "header") {
            const g = item.group;
            return (
                <View style={styles.sectionHeader}>
                    <ThemedText
                        numberOfLines={1}
                        style={[
                            styles.sectionTitle,
                            {
                                fontFamily: fontFamilyFor("bold", locale),
                                textAlign: isRTL ? "right" : "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {t(g.title)}
                    </ThemedText>
                    {t(g.detail) ? (
                        <ThemedText
                            numberOfLines={1}
                            style={[
                                styles.sectionDetail,
                                {
                                    fontFamily: fontFamilyFor(
                                        "regular",
                                        locale,
                                    ),
                                    textAlign: isRTL ? "right" : "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {t(g.detail)}
                        </ThemedText>
                    ) : null}
                </View>
            );
        }
        if (item.type === "full") {
            return (
                <View style={styles.photoWrap}>
                    <GalleryPhoto
                        uri={item.uri}
                        onPress={() => openViewer(item.index)}
                    />
                </View>
            );
        }
        return (
            <View style={styles.pairRow}>
                <GalleryTile
                    uri={item.left}
                    onPress={() => openViewer(item.leftIndex)}
                />
                <GalleryTile
                    uri={item.right}
                    onPress={() => openViewer(item.rightIndex)}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" animated />

            <FlashList
                ref={flashRef}
                data={rows}
                keyExtractor={(r) => r.key}
                getItemType={(r) => r.type}
                renderItem={renderRow}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    paddingTop: navTop + Spacing[2],
                    paddingBottom: insets.bottom + Spacing[6],
                }}
            />

            {/* One blurred bar: a collapsing header row above the always-pinned
                image navigator (no seam between two bars). */}
            <View
                style={styles.topBar}
                pointerEvents="box-none"
                onLayout={(e) => {
                    if (!barH) setBarH(e.nativeEvent.layout.height);
                }}
            >
                <BlurView
                    intensity={70}
                    tint="light"
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.topBarTint} pointerEvents="none" />

                <View style={[styles.headerRow, { marginTop: insets.top }]}>
                    <PressableScale
                        onPress={close}
                        scaleTo={0.88}
                        haptic="back"
                        style={styles.iconBtn}
                    >
                        <IconSymbol
                            name="chevron.left"
                            size={20}
                            color={Colors.light.text}
                        />
                    </PressableScale>
                    <View style={styles.titleCenter} pointerEvents="none">
                        <ThemedText
                            style={[
                                styles.title,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {t({ ar: "جولة بالصور", en: "Photo tour" })}
                        </ThemedText>
                    </View>
                    <View style={styles.topActions}>
                        <PressableScale
                            onPress={() =>
                                sharePlace(listing.id, t(listing.title))
                            }
                            scaleTo={0.88}
                            style={styles.iconBtn}
                        >
                            <ShareIcon
                                size={18}
                                stroke={Colors.light.text}
                                strokeWidth={2.2}
                            />
                        </PressableScale>
                        <PressableScale
                            onPress={handleLike}
                            scaleTo={0.88}
                            style={styles.iconBtn}
                        >
                            <HeartIcon
                                size={20}
                                stroke={
                                    liked
                                        ? Colors.light.coral
                                        : Colors.light.text
                                }
                                fill={liked ? Colors.light.coral : "none"}
                                strokeWidth={1.8}
                            />
                        </PressableScale>
                    </View>
                </View>

                <Animated.View style={[styles.navWrap, navAnim]}>
                    <View
                        onLayout={(e) => {
                            if (!navH) setNavH(e.nativeEvent.layout.height);
                        }}
                    >
                        {chipStrip}
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    notFound: { flex: 1, alignItems: "center", justifyContent: "center" },

    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        overflow: "hidden",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.06)",
    },
    topBarTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.65)",
    },
    headerRow: {
        height: HEADER_ROW_HEIGHT,
        paddingHorizontal: Spacing[4],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    titleCenter: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 17,
        lineHeight: 22,
        color: Colors.light.text,
    },
    topActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    navWrap: { overflow: "hidden" },

    chipsRow: {
        paddingHorizontal: SECTION_PAD,
        paddingVertical: Spacing[3],
        gap: Spacing[3],
    },
    chip: {
        width: CHIP_W,
        gap: 5,
        alignItems: "center",
    },
    chipImage: {
        width: CHIP_W,
        height: CHIP_H,
        borderRadius: Radius.md,
        borderCurve: "continuous",
        backgroundColor: "#F3F4F6",
    },
    chipLabel: {
        fontSize: 11,
        lineHeight: 16,
        color: Colors.light.text,
        textAlign: "center",
    },

    sectionHeader: {
        paddingHorizontal: SECTION_PAD,
        paddingTop: Spacing[6],
        paddingBottom: Spacing[4],
    },
    sectionTitle: {
        fontSize: 26,
        lineHeight: 40,
        color: Colors.light.text,
        letterSpacing: -0.4,
    },
    sectionDetail: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.light.textMuted,
    },
    photoWrap: {
        paddingBottom: GALLERY_GAP,
    },
    photo: {
        width: "100%",
        aspectRatio: HERO_ASPECT,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
    },
    pairRow: {
        flexDirection: "row",
        gap: GALLERY_GAP,
        paddingBottom: GALLERY_GAP,
    },
    tile: {
        flex: 1,
        aspectRatio: 4 / 3,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
    },
});
