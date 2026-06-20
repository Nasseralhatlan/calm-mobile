import { BlurView } from "expo-blur";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { HeartIcon } from "@/components/icons/heart-icon";
import { ListingCard } from "@/components/listing-card";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { SkeletonCard } from "@/components/skeleton-card";
import { ThemedText } from "@/components/themed-text";
import { Colors, fontFamilyFor, Spacing } from "@/constants/theme";
import { useAuthState } from "@/data/auth-state";
import { invalidatePlaceCaches } from "@/data/caches";
import {
  getFavoritesCache,
  isFavoritesStale,
  setFavoritesCache,
} from "@/data/favorites-cache";
import { useLikes } from "@/data/likes";
import { adaptApiPlaceToListing } from "@/data/place-adapter";
import type { Listing } from "@/data/types";
import { getFavorites, type ApiPlace } from "@/lib/api";
import { useLocale, useT } from "@/lib/i18n";
import { STR } from "@/lib/strings";

const TEXT_PRIMARY = "#000000";
const PER_PAGE = 20;
const SKELETON_COUNT = 4;
// Keep the skeleton up long enough to register even when the API is instant —
// same feel as the search results screen.
const MIN_SKELETON_MS = 450;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function LikesScreen() {
    const t = useT();
    const { locale } = useLocale();
    const isRTL = locale === "ar";
    const insets = useSafeAreaInsets();
    const { isAuthed } = useAuthState();
    const { isLiked } = useLikes();

    const headerHeight = insets.top + 70;

    // Seed from the module-level cache so a revisit renders instantly.
    const seed = getFavoritesCache();
    const [items, setItems] = useState<ApiPlace[]>(seed.items);
    const [page, setPage] = useState(seed.page);
    const [hasMore, setHasMore] = useState(seed.hasMore);
    const [loading, setLoading] = useState(!seed.loaded);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { height: windowH } = useWindowDimensions();

    const load = useCallback(async (nextPage: number) => {
        const res = await getFavorites({ page: nextPage, per_page: PER_PAGE });
        // Append onto the cache (the source of truth for pagination).
        const base = nextPage === 1 ? [] : getFavoritesCache().items;
        const merged = [...base, ...res.items];
        setItems(merged);
        setHasMore(res.pagination.has_more);
        setPage(res.pagination.page);
        setFavoritesCache({
            items: merged,
            page: res.pagination.page,
            hasMore: res.pagination.has_more,
            loaded: true,
        });
    }, []);

    // On focus: use the cache as-is unless it's stale (a like/unlike happened) or
    // never loaded. Skeletons show only when there's nothing cached to display;
    // a stale refresh updates silently over the existing list.
    useFocusEffect(
        useCallback(() => {
            if (!isAuthed) return;
            const cache = getFavoritesCache();
            if (cache.loaded && !isFavoritesStale()) {
                setItems(cache.items);
                setPage(cache.page);
                setHasMore(cache.hasMore);
                setLoading(false);
                return;
            }
            let active = true;
            const firstLoad = !cache.loaded;
            if (firstLoad) setLoading(true);
            // On the first load (nothing cached) hold the skeleton for a beat so it's
            // actually perceptible; a stale refresh updates silently over the list.
            const work = firstLoad
                ? Promise.all([load(1), sleep(MIN_SKELETON_MS)]).then(
                      () => undefined,
                  )
                : load(1);
            work.catch(() => {
                /* keep whatever we already had */
            }).finally(() => {
                if (active) setLoading(false);
            });
            return () => {
                active = false;
            };
        }, [isAuthed, load]),
    );

    const onEndReached = () => {
        if (loading || loadingMore || !hasMore) return;
        setLoadingMore(true);
        load(page + 1)
            .catch(() => setHasMore(false))
            .finally(() => setLoadingMore(false));
    };

    // Pull-to-refresh: spinner stays while the fresh page loads (list keeps its
    // place — no remount). Also invalidate place caches so opening a place
    // afterwards refetches it.
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        invalidatePlaceCaches();
        // Hold the spinner briefly so a fast API still reads as a refresh instead of
        // snapping back behind the cards instantly.
        Promise.all([load(1).catch(() => {}), sleep(700)]).finally(() =>
            setRefreshing(false),
        );
    }, [load]);

    const listings = useMemo(
        () => items.map((p) => adaptApiPlaceToListing(p)),
        [items],
    );
    // Favorites are all liked; the moment one is unliked here its override flips
    // false, so we drop it from the list immediately (the API call still fires
    // through `toggle`, and the cache is marked stale for the next visit).
    const visible = useMemo(
        () => listings.filter((l) => isLiked(l.id, true)),
        [listings, isLiked],
    );

    const header = (
        <View style={[styles.headerWrap, { paddingBottom: Spacing[2] }]}>
            <BlurView
                intensity={80}
                tint="light"
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.headerTint} pointerEvents="none" />
            <SafeAreaView edges={["top"]}>
                <View style={styles.titleBar}>
                    <ThemedText
                        style={[
                            styles.title,
                            {
                                fontFamily: fontFamilyFor("bold", locale),
                                textAlign: isRTL ? "right" : "left",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {t(STR.likes.title)}
                    </ThemedText>
                </View>
            </SafeAreaView>
        </View>
    );

    if (!isAuthed) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <SignInPrompt
                    message={{
                        ar: "سجل دخولك عشان تشوف الأماكن المحفوظة.",
                        en: "Sign in to see your saved places.",
                    }}
                />
            </SafeAreaView>
        );
    }

    const topInset = headerHeight + Spacing[5];
    const bottomPad = insets.bottom + Spacing[12];
    const contentPad = { paddingTop: topInset, paddingBottom: bottomPad };
    // iOS: refresh spinner must sit below the translucent header via contentInset.
    const iosScroll =
        Platform.OS === "ios"
            ? {
                  contentInset: { top: topInset },
                  contentOffset: { x: 0, y: -topInset },
                  scrollIndicatorInsets: { top: headerHeight },
              }
            : null;

    const isEmpty = visible.length === 0;
    // Height of the visible area between the header and the tab bar, so the empty
    // state sits centered there and bounces with the pull (never rests off-screen).
    const tabBar = insets.bottom + 64;
    const emptyHeight = Math.max(0, windowH - topInset - tabBar);

    return (
        <View style={styles.container}>
            {header}

            {loading ? (
                // Same skeleton treatment as the search results screen.
                <FlatList
                    data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
                    keyExtractor={(i) => `s${i}`}
                    renderItem={() => <SkeletonCard />}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    contentContainerStyle={[styles.scroll, contentPad]}
                />
            ) : (
                <FlatList
                    data={visible as Listing[]}
                    keyExtractor={(l) => l.id}
                    renderItem={({ item }) => <ListingCard listing={item} />}
                    showsVerticalScrollIndicator={false}
                    // flex:1 so the list always fills the screen (so an empty list is still
                    // pull-to-refreshable); content scrolling is unchanged.
                    style={styles.list}
                    {...iosScroll}
                    contentContainerStyle={[
                        styles.scroll,
                        {
                            paddingTop: Platform.OS === "ios" ? 0 : topInset,
                            paddingBottom: isEmpty ? 0 : bottomPad,
                        },
                    ]}
                    alwaysBounceVertical
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            progressViewOffset={
                                Platform.OS === "ios" ? 0 : topInset
                            }
                            tintColor={Colors.light.coral}
                            colors={[Colors.light.coral]}
                        />
                    }
                    ListEmptyComponent={
                        // Sized to the visible area so it sits centered and bounces with the
                        // pull, but can never rest scrolled off-screen.
                        <View
                            style={[
                                styles.emptyCenter,
                                { height: emptyHeight },
                            ]}
                        >
                            <View style={styles.emptyHeart}>
                                <HeartIcon
                                    size={64}
                                    fill={Colors.light.coral}
                                    stroke="#FFFFFF"
                                    strokeWidth={1.8}
                                />
                            </View>
                            <ThemedText
                                style={[
                                    styles.emptyBody,
                                    {
                                        fontFamily: fontFamilyFor(
                                            "regular",
                                            locale,
                                        ),
                                    },
                                ]}
                            >
                                {t(STR.likes.emptyBody)}
                            </ThemedText>
                        </View>
                    }
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    removeClippedSubviews
                    initialNumToRender={5}
                    windowSize={5}
                    ListFooterComponent={loadingMore ? <SkeletonCard /> : null}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },

    headerWrap: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        zIndex: 10,
    },
    headerTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    titleBar: {
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[3],
        paddingBottom: Spacing[3],
    },
    title: {
        fontSize: 22,
        lineHeight: 44,
        color: TEXT_PRIMARY,
        letterSpacing: -0.3,
    },

    scroll: {
        paddingHorizontal: Spacing[5],
    },
    list: { flex: 1 },
    emptyCenter: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing[8],
        gap: Spacing[5],
    },
    emptyHeart: {
        shadowColor: Colors.light.coral,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 6,
    },
    emptyBody: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.light.textMuted,
        textAlign: "center",
    },
});
