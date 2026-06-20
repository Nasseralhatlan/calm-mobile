import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/listing-card';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonCard } from '@/components/skeleton-card';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { adaptApiPlaceToListing } from '@/data/place-adapter';
import {
  loadLastSearch,
  setLastSearchProgress,
  setLastSearchThumbs,
} from '@/data/last-search';
import { getAppliedFilters, getFiltersVersion } from '@/data/search-filters';
import type { Listing } from '@/data/types';
import { searchPlaces, type ApiPlace } from '@/lib/api';
import { useLocale, useT } from '@/lib/i18n';

const HEADER_CONTENT_HEIGHT = 80;
const PER_PAGE = 20;
const MIN_SKELETON_MS = 400;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ResultsScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();

  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT;

  const [items, setItems] = useState<ApiPlace[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Re-render the header when filters change (cityLabel / count).
  const [, force] = useState(0);
  const versionRef = useRef(-1);

  // Opened from the home "continue your last search" card → resume scroll spot.
  const { resume } = useLocalSearchParams<{ resume?: string }>();
  const listRef = useRef<FlashListRef<Listing>>(null);
  const didResumeRef = useRef(false);
  const progressRef = useRef(0);
  // Stable handlers (FlashList requires these not to change between renders).
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const idxs = viewableItems
        .map((v) => v.index)
        .filter((i): i is number => i != null);
      if (idxs.length) progressRef.current = Math.min(...idxs);
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const city = getAppliedFilters().cityLabel;

  const load = useCallback(async (nextPage: number) => {
    const f = getAppliedFilters();
    if (!f.cityId) {
      setItems([]);
      setHasMore(false);
      setTotal(0);
      return null;
    }
    // The API filters by a single area; only narrow when exactly one is picked.
    const cityAreaId = f.areaIds.length === 1 ? f.areaIds[0] : undefined;
    const res = await searchPlaces({
      city_id: f.cityId,
      place_type_ids: f.typeIds.length ? f.typeIds : undefined,
      city_area_id: cityAreaId,
      amenities: f.amenityIds.length ? f.amenityIds : undefined,
      price_min: f.priceMin ?? undefined,
      price_max: f.priceMax ?? undefined,
      guests: f.guests ?? undefined,
      page: nextPage,
      per_page: PER_PAGE,
    });
    setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
    setHasMore(res.pagination.has_more);
    setTotal(res.pagination.total);
    setPage(res.pagination.page);

    // Tag the saved "last search" with the top-3-rated results' photos so the
    // home resume card shows a stacked deck of real place images.
    if (nextPage === 1) {
      const thumbs = [...res.items]
        .sort(
          (a, b) =>
            (b.rating.avg ?? 0) - (a.rating.avg ?? 0) ||
            b.rating.count - a.rating.count,
        )
        .map((p) => p.cover_photo_url)
        .filter((u): u is string => !!u)
        .slice(0, 3);
      void setLastSearchThumbs(thumbs);
    }
    return res;
  }, []);

  // Run on first mount, and whenever the applied filters change (e.g. after the
  // filters modal closes). Skeletons show on a fresh query; otherwise it's a
  // silent refresh.
  useFocusEffect(
    useCallback(() => {
      const v = getFiltersVersion();
      if (v === versionRef.current) return; // nothing changed since last load
      versionRef.current = v;
      force((n) => n + 1); // refresh header label
      let active = true;
      setLoading(true);

      (async () => {
        try {
          // Resume: load up to the page the user had reached, then scroll back
          // to the item they were last looking at.
          if (resume === '1' && !didResumeRef.current) {
            didResumeRef.current = true;
            const idx = (await loadLastSearch())?.progressIndex ?? 0;
            const needed = Math.max(1, Math.floor(idx / PER_PAGE) + 1);
            let loaded = 0;
            let more = true;
            for (let p = 1; p <= needed && more && active; p++) {
              const r = await load(p);
              if (!r) break;
              loaded += r.items.length;
              more = r.pagination.has_more;
            }
            await sleep(MIN_SKELETON_MS);
            if (!active) return;
            setLoading(false);
            const target = Math.min(idx, Math.max(0, loaded - 1));
            if (target > 0) {
              requestAnimationFrame(() =>
                listRef.current?.scrollToIndex({
                  index: target,
                  animated: false,
                }),
              );
            }
            return;
          }

          await Promise.all([load(1), sleep(MIN_SKELETON_MS)]);
          if (active) setLoading(false);
        } catch {
          if (active) {
            setItems([]);
            setHasMore(false);
            setTotal(0);
            setLoading(false);
          }
        }
      })();

      // Persist where the user stopped so the home card can resume here.
      return () => {
        active = false;
        void setLastSearchProgress(progressRef.current);
      };
    }, [load, resume]),
  );

  const onEndReached = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    load(page + 1)
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  };

  const listings = useMemo(() => items.map((p) => adaptApiPlaceToListing(p)), [items]);

  const summarySubLine = useMemo(() => {
    if (loading) return '';
    return `${total} ${t({ ar: total === 1 ? 'نتيجة' : 'نتيجة', en: total === 1 ? 'result' : 'results' })}`;
  }, [loading, total, t]);

  const goHome = () => {
    router.dismissAll();
  };

  const openFilters = () => {
    router.push('/filters');
  };

  const openSearch = () => {
    router.push('/search');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {loading ? (
        <View
          style={[
            styles.scroll,
            { paddingTop: headerHeight + Spacing[10] },
          ]}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={`s${i}`} />
          ))}
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyCenter}>
          <ThemedText
            style={[styles.emptyTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {t({ ar: 'لا توجد نتائج', en: 'No results' })}
          </ThemedText>
          <ThemedText
            style={[styles.emptyBody, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {t({
              ar: 'جرّب تغيير الفلاتر أو المنطقة.',
              en: 'Try adjusting your filters.',
            })}
          </ThemedText>
          <PressableScale onPress={openFilters} scaleTo={0.97} haptic="select" style={styles.emptyBtn}>
            <ThemedText
              style={[styles.emptyBtnText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'تعديل الفلاتر', en: 'Adjust filters' })}
            </ThemedText>
          </PressableScale>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={listings}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <ListingCard listing={item} />}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing[10],
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: Spacing[5],
          }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <SkeletonCard /> : null}
        />
      )}

      <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
        <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerTint} pointerEvents="none" />
        <View style={styles.headerRow}>
          <PressableScale onPress={goHome} scaleTo={0.88} haptic="back" style={styles.iconBtn}>
            <IconSymbol name="chevron.left" size={20} color={Colors.light.text} />
          </PressableScale>

          <PressableScale
            onPress={openSearch}
            scaleTo={0.97}
            haptic="select"
            style={styles.summaryPill}>
            <ThemedText
              style={[styles.summaryTitle, { fontFamily: fontFamilyFor('bold', locale) }]}
              numberOfLines={1}>
              {t({
                ar: city ? `أماكن في ${city}` : 'أماكن',
                en: city ? `Homes in ${city}` : 'Homes',
              })}
            </ThemedText>
            {summarySubLine ? (
              <ThemedText
                style={[styles.summarySub, { fontFamily: fontFamilyFor('regular', locale) }]}
                numberOfLines={1}>
                {summarySubLine}
              </ThemedText>
            ) : null}
          </PressableScale>

          <PressableScale onPress={openFilters} scaleTo={0.88} style={styles.iconBtn}>
            <IconSymbol
              name="slider.horizontal.3"
              size={20}
              color={Colors.light.text}
            />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },

  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 6,
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  summaryPill: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  summaryTitle: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.text,
  },
  summarySub: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  scroll: {
    paddingHorizontal: Spacing[5],
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[2],
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: Colors.light.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: Spacing[4],
    alignSelf: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 19,
  },
});
