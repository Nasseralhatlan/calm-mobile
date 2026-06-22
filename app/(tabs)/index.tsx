import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { EntranceItem } from "@/components/entrance-item";
import { HomeResumeCard } from "@/components/home-resume-card";
import { MagnifierIcon } from "@/components/icons/magnifier-icon";
import { SearchPlusIcon } from "@/components/icons/search-plus-icon";
import { PlaceCardCompact } from "@/components/place-card-compact";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ViewAllCard } from "@/components/view-all-card";
import {
    Colors,
    Radius,
    Shadows,
    Spacing,
    fontFamilyFor,
} from "@/constants/theme";
import { useAuthState } from "@/data/auth-state";
import { invalidatePlaceCaches } from "@/data/caches";
import { useHomeData, useHomeRefresh } from "@/data/home";
import { setPlaceList } from "@/data/place-list";
import type { ApiPlace, ApiPlaceType } from "@/lib/api";
import { LAYOUT_RTL, useLocale, useT } from "@/lib/i18n";

export default function ExploreScreen() {
    const palette = Colors.light;
    const t = useT();
    const { locale } = useLocale();
    const isRTL = LAYOUT_RTL;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const headerHeight = insets.top + 132;
    // Give the refresh spinner breathing room below the header (and above the
    // content) instead of being glued to the header's edge.
    const refreshTopInset = headerHeight + Spacing[5];
    // Custom tab bar is position:absolute → useBottomTabBarHeight returns 0. Compute manually.
    const tabBarHeight = insets.bottom * 0.75 + 64;

    const home = useHomeData();
    const refreshHome = useHomeRefresh();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        invalidatePlaceCaches();
        // Keep the spinner up long enough to read as a refresh even when the
        // API answers instantly.
        await Promise.all([
            refreshHome(),
            new Promise((r) => setTimeout(r, 700)),
        ]);
        setRefreshing(false);
    }, [refreshHome]);

    const openSearch = (typeId?: string) => {
        router.push(
            typeId ? { pathname: "/search", params: { typeId } } : "/search",
        );
    };

    const { user } = useAuthState();
    const firstName = useMemo(() => {
        const name = user?.name?.trim();
        if (name) return name.split(" ")[0];
        return t({ ar: "بك", en: "there" });
    }, [user?.name, t]);

    const placeTypes = home?.placeTypes ?? [];
    const mostLiked = home?.mostLiked ?? [];
    const lists = useMemo(
        () =>
            (home?.lists ?? [])
                .filter((l) => l.places.length > 0)
                .sort((a, b) => a.sort_order - b.sort_order),
        [home?.lists],
    );

    return (
        <View
            style={[styles.container, { backgroundColor: palette.background }]}
        >
            <EntranceItem delay={0} style={styles.headerWrap}>
                <BlurView
                    intensity={80}
                    tint="light"
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.headerTint} pointerEvents="none" />
                <SafeAreaView edges={["top"]}>
                    <View style={styles.logoBar}>
                        <Image
                            source={require("@/assets/logo/logo.png")}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>
                    <View style={styles.searchBar}>
                        <PressableScale
                            scaleTo={0.97}
                            haptic="select"
                            onPress={() => openSearch()}
                            style={styles.searchPill}
                        >
                            <MagnifierIcon
                                size={16}
                                color={Colors.light.text}
                            />
                            <ThemedText
                                style={[
                                    styles.searchPillText,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "bold",
                                            locale,
                                        ),
                                    },
                                ]}
                                numberOfLines={2}
                            >
                                {t({
                                    ar: "ابدء البحث",
                                    en: "Start search",
                                })}
                            </ThemedText>
                        </PressableScale>
                    </View>
                </SafeAreaView>
            </EntranceItem>

            <ScrollView
                showsVerticalScrollIndicator={false}
                // Translucent header overlaps the scroll; on iOS the refresh
                // spinner must sit below it (contentInset), on Android we pad +
                // offset the progress view.
                {...(Platform.OS === "ios"
                    ? {
                          contentInset: { top: refreshTopInset },
                          contentOffset: { x: 0, y: -refreshTopInset },
                          scrollIndicatorInsets: { top: headerHeight },
                      }
                    : null)}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={
                            Platform.OS === "ios" ? 0 : refreshTopInset
                        }
                        tintColor={Colors.light.coral}
                        colors={[Colors.light.coral]}
                    />
                }
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingTop: Platform.OS === "ios" ? 0 : headerHeight,
                        paddingBottom: tabBarHeight + Spacing[6],
                    },
                ]}
            >
                <EntranceItem delay={60}>
                    <View style={styles.greetingWrap}>
                        <ThemedText
                            variant="title"
                            style={[
                                styles.greeting,
                                {
                                    textAlign: isRTL ? "right" : "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {t({
                                ar: `اهــــلا ${firstName}`,
                                en: `Hello, ${firstName}`,
                            })}
                        </ThemedText>
                    </View>
                </EntranceItem>

                <EntranceItem delay={80}>
                    <HomeResumeCard />
                </EntranceItem>

                <CategoriesGrid
                    placeTypes={placeTypes}
                    isRTL={isRTL}
                    onPress={openSearch}
                />

                <PlacesSection
                    title={t({ ar: "النـــاس اعجبها", en: "People liked" })}
                    headerDelay={440}
                    places={mostLiked}
                    emptyMessage={t({
                        ar: "تعذر تحميل البيانات الآن",
                        en: "Could not load right now",
                    })}
                />

                {lists.map((list, idx) => (
                    <PlacesSection
                        key={list.id}
                        title={locale === "ar" ? list.name_ar : list.name_en}
                        headerDelay={780 + idx * 300}
                        places={list.places}
                        emptyMessage={t({
                            ar: "لا توجد عناصر",
                            en: "No items",
                        })}
                    />
                ))}
            </ScrollView>

            <View
                pointerEvents="box-none"
                style={[styles.fabWrap, { bottom: tabBarHeight + Spacing[5] }]}
            >
                <EntranceItem delay={950} from={16}>
                    <PressableScale
                        scaleTo={0.95}
                        onPress={() => openSearch()}
                        haptic="forward"
                        style={styles.fab}
                    >
                        <BlurView
                            intensity={30}
                            tint="dark"
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.fabTint} />
                        <SearchPlusIcon size={16} color="#FFFFFF" />
                        <ThemedText
                            style={[
                                styles.fabText,
                                { fontFamily: fontFamilyFor("medium", locale) },
                            ]}
                        >
                            {t({
                                ar: "ابدء بحث جديد",
                                en: "Start a new search",
                            })}
                        </ThemedText>
                    </PressableScale>
                </EntranceItem>
            </View>
        </View>
    );
}

function CategoriesGrid({
    placeTypes,
    isRTL,
    onPress,
}: {
    placeTypes: ApiPlaceType[];
    isRTL: boolean;
    onPress: (typeId?: string) => void;
}) {
    const { locale } = useLocale();
    const t = useT();

    if (placeTypes.length === 0) {
        return (
            <View style={styles.grid}>
                <View style={styles.emptyTileRow}>
                    <ThemedText
                        style={[
                            styles.emptyText,
                            { fontFamily: fontFamilyFor("regular", locale) },
                        ]}
                    >
                        {t({
                            ar: "تعذر تحميل الفئات",
                            en: "Could not load categories",
                        })}
                    </ThemedText>
                </View>
            </View>
        );
    }

    const tiles = placeTypes.slice(0, 3);

    return (
        <View style={styles.grid}>
            {tiles.map((type, i) => (
                <View key={type.id} style={styles.gridCell}>
                    <EntranceItem delay={140 + i * 50}>
                        <PressableScale
                            scaleTo={0.95}
                            haptic="select"
                            onPress={() => onPress(type.id)}
                            style={styles.gridTile}
                        >
                            <ThemedText style={styles.gridEmoji}>
                                {type.icon}
                            </ThemedText>
                            <ThemedText
                                variant="caption"
                                style={styles.gridLabel}
                                numberOfLines={1}
                            >
                                {locale === "ar" ? type.name_ar : type.name_en}
                            </ThemedText>
                        </PressableScale>
                    </EntranceItem>
                </View>
            ))}
        </View>
    );
}

function PlacesSection({
    title,
    headerDelay = 0,
    places,
    emptyMessage,
}: {
    title: string;
    headerDelay?: number;
    places: ApiPlace[];
    emptyMessage: string;
}) {
    const { locale } = useLocale();
    const router = useRouter();
    const isRTL = locale === "ar";

    // The trailing "view all" card animates when it actually scrolls on screen.
    const [viewAllVisible, setViewAllVisible] = useState(false);
    const onViewable = useRef(
        ({ viewableItems }: { viewableItems: { key?: string }[] }) => {
            setViewAllVisible(viewableItems.some((v) => v.key === "view-all"));
        },
    ).current;
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 60,
    }).current;

    const openAll = () => {
        setPlaceList({ title, places });
        router.push("/place-list");
    };

    // Show at most 5 cards + a trailing "view all" card when there's more.
    const cells: Cell[] = places
        .slice(0, 5)
        .map((place) => ({ kind: "place" as const, place }));
    if (places.length > 5) {
        const thumbs = places
            .slice(0, 2)
            .map((p) => p.cover_photo_url ?? p.photos?.[0]?.url ?? null)
            .filter((u): u is string => !!u);
        cells.push({ kind: "all", thumbs });
    }
    const data = cells;

    return (
        <View style={styles.section}>
            <EntranceItem delay={headerDelay}>
                <View
                    style={[
                        styles.sectionHeader,
                        // DOM order is [moreChip, title]; row-reverse renders the
                        // title at the reading start in both directions (native).
                        { flexDirection: "row-reverse" },
                    ]}
                >
                    <PressableScale
                        scaleTo={0.92}
                        onPress={openAll}
                        style={styles.moreChip}
                    >
                        <IconSymbol
                            name="chevron.left"
                            size={16}
                            color={Colors.light.text}
                            style={
                                isRTL
                                    ? undefined
                                    : { transform: [{ rotate: "180deg" }] }
                            }
                        />
                    </PressableScale>
                    <ThemedText
                        variant="heading"
                        style={[
                            styles.sectionTitle,
                            {
                                textAlign: isRTL ? "right" : "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {title}
                    </ThemedText>
                </View>
            </EntranceItem>

            {places.length === 0 ? (
                <View style={styles.emptyState}>
                    <ThemedText
                        style={[
                            styles.emptyText,
                            {
                                fontFamily: fontFamilyFor("regular", locale),
                                textAlign: isRTL ? "right" : "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {emptyMessage}
                    </ThemedText>
                </View>
            ) : (
                <FlatList
                    data={data}
                    horizontal
                    keyExtractor={(c) =>
                        c.kind === "place" ? c.place.id : "view-all"
                    }
                    renderItem={({ item, index }) => (
                        <EntranceItem delay={headerDelay + 40 + index * 60}>
                            {item.kind === "place" ? (
                                <PlaceCardCompact place={item.place} />
                            ) : (
                                <ViewAllCard
                                    photos={item.thumbs}
                                    active={viewAllVisible}
                                    onPress={openAll}
                                />
                            )}
                        </EntranceItem>
                    )}
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewable}
                    viewabilityConfig={viewabilityConfig}
                    contentContainerStyle={styles.carousel}
                    // The row is capped at ~6 cards, so keep them all mounted
                    // (no clipping) — otherwise scrolling back re-triggers each
                    // card's entrance animation.
                    initialNumToRender={6}
                    removeClippedSubviews={false}
                />
            )}
        </View>
    );
}

// A home carousel cell: a place card or the trailing "view all" card.
type Cell =
    | { kind: "place"; place: ApiPlace }
    | { kind: "all"; thumbs: string[] };

const TILE_GAP = Spacing[3];

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: Spacing[20] },

    headerWrap: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 25,
        elevation: 6,
        zIndex: 10,
        paddingBottom: Spacing[2],
    },
    headerTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    logoBar: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: Spacing[3],
        paddingBottom: Spacing[3],
    },
    logo: { width: 90, height: 36 },
    searchBar: {
        paddingHorizontal: Spacing[5],
        paddingBottom: Spacing[4],
    },
    searchPill: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing[2],
        minHeight: 56,
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[3],
        borderRadius: 999,
        backgroundColor: "#FFFFFF",
        borderWidth: 0.5,
        borderColor: "#F4F4F4",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
    },
    searchPillText: {
        flexShrink: 1,
        fontSize: 14,
        lineHeight: 18,
        color: Colors.light.text,
    },

    greetingWrap: {
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[2],
        marginTop: Spacing[5],
    },
    greeting: { fontSize: 16, lineHeight: 22 },

    grid: {
        marginTop: Spacing[6],
        paddingHorizontal: Spacing[5],
        flexDirection: "row",
        gap: TILE_GAP,
    },
    gridCell: {
        flex: 1,
        minWidth: 0,
    },
    gridTile: {
        width: "100%",
        aspectRatio: 0.95,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing[3],
        paddingVertical: Spacing[3],
        borderWidth: 0.5,
        borderColor: "#F4F4F4",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 25,
        elevation: 6,
    },
    gridEmoji: { fontSize: 34, lineHeight: 46, textAlign: "center" },
    gridLabel: { textAlign: "center" },
    emptyTileRow: {
        flex: 1,
        paddingHorizontal: Spacing[3],
        paddingVertical: Spacing[5],
        alignItems: "center",
    },

    section: {
        paddingTop: Spacing[8],
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing[5],
        paddingBottom: Spacing[4],
    },
    sectionTitle: { fontSize: 16, lineHeight: 22 },
    moreChip: {
        width: 36,
        height: 36,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    carousel: {
        paddingHorizontal: Spacing[5],
        gap: Spacing[3],
    },
    emptyState: {
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[6],
    },
    emptyText: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.light.textMuted,
    },

    fabWrap: {
        position: "absolute",
        bottom: Spacing[3],
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
        fontSize: 14,
        lineHeight: 18,
    },
});
