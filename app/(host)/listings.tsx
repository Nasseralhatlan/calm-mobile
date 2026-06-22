import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarIcon } from '@/components/icons/star-icon';
import { HostHeader, HOST_HEADER_HEIGHT } from '@/components/host/host-header';
import { SkeletonBlock } from '@/components/skeleton-block';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useAuthState } from '@/data/auth-state';
import { getHostListings, type ApiHostListing, type HostReviewStatus } from '@/lib/api';
import { formatSar } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DIVIDER = '#F0F0F0';
const PER_PAGE = 20;
const MIN_SKELETON_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Localized = { ar: string; en: string };

const REVIEW_THEME: Record<HostReviewStatus, { bg: string; fg: string; label: Localized }> = {
  draft: { bg: '#F4F4F4', fg: '#374151', label: { ar: 'مسودة', en: 'Draft' } },
  pending_review: { bg: '#FEF3C7', fg: '#B45309', label: { ar: 'قيد المراجعة', en: 'In review' } },
  approved: { bg: '#E7F8EE', fg: '#15803D', label: { ar: 'منشور', en: 'Live' } },
  rejected: { bg: '#FEE4E2', fg: '#B42318', label: { ar: 'مرفوض', en: 'Rejected' } },
};

function RowSkeleton() {
  return (
    <View style={styles.skelCard}>
      <SkeletonBlock style={styles.skelThumb} />
      <View style={styles.skelBody}>
        <SkeletonBlock style={{ width: '70%', height: 14 }} />
        <SkeletonBlock style={{ width: '40%', height: 12 }} />
        <SkeletonBlock style={{ width: '55%', height: 12 }} />
      </View>
    </View>
  );
}

function ListingCardRow({ listing }: { listing: ApiHostListing }) {
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';
  const rowDir = 'row' as const;
  const align = isRTL ? ('right' as const) : ('left' as const);
  const wd = isRTL ? ('rtl' as const) : ('ltr' as const);

  const review = REVIEW_THEME[listing.review_status];
  const cityName = locale === 'ar' ? listing.city.name_ar : listing.city.name_en;

  return (
    <View style={[styles.card, { flexDirection: rowDir }]}>
      <Image
        source={{ uri: listing.cover_photo_url ?? undefined }}
        style={styles.thumb}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.body}>
        <View style={[styles.topRow, { flexDirection: rowDir }]}>
          <ThemedText
            numberOfLines={1}
            style={[styles.title, { fontFamily: fontFamilyFor('bold', locale), textAlign: align, writingDirection: wd }]}>
            {listing.title}
          </ThemedText>
          <View style={[styles.statusChip, { backgroundColor: review.bg }]}>
            <ThemedText style={[styles.statusChipText, { color: review.fg, fontFamily: fontFamilyFor('bold', locale) }]}>
              {t(review.label)}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          numberOfLines={1}
          style={[styles.meta, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
          {cityName} · {formatSar(listing.price)}
          {listing.status === 'inactive' ? ` · ${t({ ar: 'متوقف', en: 'Inactive' })}` : ''}
        </ThemedText>

        <View style={[styles.statsRow, { flexDirection: rowDir }]}>
          <View style={[styles.stat, { flexDirection: rowDir }]}>
            <StarIcon size={11} color={TEXT_PRIMARY} />
            <ThemedText style={[styles.statText, { fontFamily: fontFamilyFor('medium', locale) }]}>
              {' '}
              {listing.rating.avg != null ? listing.rating.avg.toFixed(1) : '—'} ({listing.rating.count})
            </ThemedText>
          </View>
          <ThemedText style={[styles.statText, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {listing.bookings_count} {t({ ar: 'حجز', en: 'bookings' })}
          </ThemedText>
          <ThemedText style={[styles.statText, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {listing.likes_count} {t({ ar: 'إعجاب', en: 'likes' })}
          </ThemedText>
        </View>

        {listing.review_status === 'rejected' && listing.rejection_reason ? (
          <ThemedText
            numberOfLines={2}
            style={[styles.reject, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
            {listing.rejection_reason}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

export default function HostListings() {
  const t = useT();
  const { locale } = useLocale();
  const { token } = useAuthState();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + HOST_HEADER_HEIGHT;

  const [items, setItems] = useState<ApiHostListing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async (nextPage: number) => {
    const res = await getHostListings({ page: nextPage, per_page: PER_PAGE });
    setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
    setHasMore(res.pagination.has_more);
    setPage(res.pagination.page);
    loadedOnce.current = true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      const firstLoad = !loadedOnce.current;
      if (firstLoad) setLoading(true);
      const work = firstLoad
        ? Promise.all([load(1), sleep(MIN_SKELETON_MS)]).then(() => undefined)
        : load(1);
      work
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [load, token]),
  );

  const onEndReached = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    load(page + 1)
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  };

  const contentPad = {
    paddingTop: headerHeight + Spacing[4],
    paddingBottom: insets.bottom + Spacing[16],
  };

  return (
    <View style={styles.container}>
      <HostHeader title={t({ ar: 'عقاراتي', en: 'My listings' })} />

      {loading ? (
        <FlatList
          data={[0, 1, 2, 3]}
          keyExtractor={(i) => `s${i}`}
          renderItem={() => <RowSkeleton />}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, contentPad]}
        />
      ) : items.length === 0 ? (
        <View style={[styles.empty, { paddingTop: headerHeight + Spacing[16] }]}>
          <ThemedText style={[styles.emptyTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {t({ ar: 'لا توجد عقارات', en: 'No listings yet' })}
          </ThemedText>
          <ThemedText style={[styles.emptyBody, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {t({ ar: 'أضف عقارك الأول من لوحة المضيف على الويب.', en: 'Add your first place from the host web dashboard.' })}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <ListingCardRow listing={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, contentPad]}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          removeClippedSubviews
          initialNumToRender={8}
          windowSize={5}
          ListFooterComponent={loadingMore ? <RowSkeleton /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing[5], gap: Spacing[3] },
  empty: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing[8], gap: Spacing[2] },
  emptyTitle: { fontSize: 18, lineHeight: 24, color: TEXT_PRIMARY, textAlign: 'center' },
  emptyBody: { fontSize: 14, lineHeight: 21, color: Colors.light.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: DIVIDER,
    padding: Spacing[2] + 2,
    alignItems: 'center',
    gap: Spacing[3],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  thumb: { width: 84, height: 84, borderRadius: 14, borderCurve: 'continuous', backgroundColor: '#F3F4F6' },
  body: { flex: 1, gap: Spacing[1] + 2, paddingVertical: 2 },
  topRow: { alignItems: 'center', gap: Spacing[2] },
  title: { flex: 1, fontSize: 15, lineHeight: 20, color: TEXT_PRIMARY },
  meta: { fontSize: 12, lineHeight: 16, color: TEXT_SECONDARY },
  statsRow: { marginTop: Spacing[1], alignItems: 'center', gap: Spacing[3], flexWrap: 'wrap' },
  stat: { alignItems: 'center' },
  statText: { fontSize: 11, lineHeight: 15, color: TEXT_SECONDARY },
  reject: { marginTop: 2, fontSize: 11, lineHeight: 15, color: '#B42318' },
  statusChip: { paddingHorizontal: Spacing[2] + 2, paddingVertical: 3, borderRadius: 999 },
  statusChipText: { fontSize: 10, lineHeight: 13 },

  skelCard: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: DIVIDER,
    padding: Spacing[2] + 2,
    alignItems: 'center',
  },
  skelThumb: { width: 84, height: 84, borderRadius: 14 },
  skelBody: { flex: 1, gap: Spacing[2] },
});
