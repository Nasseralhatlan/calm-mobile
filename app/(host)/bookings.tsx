import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HostBookingCard } from '@/components/host/host-booking-card';
import { HostHeader, HOST_HEADER_HEIGHT } from '@/components/host/host-header';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonBlock } from '@/components/skeleton-block';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useAuthState } from '@/data/auth-state';
import { dateKey, riyadhToday } from '@/lib/date-key';
import { getHostBookings, type ApiHostBookingItem } from '@/lib/api';
import { useLocale, useT } from '@/lib/i18n';

const PER_PAGE = 50;
const STRIP_DAYS = 45;
const MIN_SKELETON_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ViewMode = 'calendar' | 'list';

function RowSkeleton() {
  return (
    <View style={styles.skelCard}>
      <SkeletonBlock style={styles.skelThumb} />
      <View style={styles.skelBody}>
        <SkeletonBlock style={{ width: '70%', height: 14 }} />
        <SkeletonBlock style={{ width: '45%', height: 12 }} />
        <SkeletonBlock style={{ width: '55%', height: 12 }} />
      </View>
    </View>
  );
}

export default function HostBookings() {
  const t = useT();
  const { locale } = useLocale();
  const { token } = useAuthState();
  const isRTL = locale === 'ar';
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + HOST_HEADER_HEIGHT;

  const todayKey = dateKey(riyadhToday());
  const [view, setView] = useState<ViewMode>('calendar');
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [items, setItems] = useState<ApiHostBookingItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async (nextPage: number) => {
    const res = await getHostBookings({ page: nextPage, per_page: PER_PAGE });
    setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
    setHasMore(res.pagination.has_more);
    setPage(res.pagination.page);
    loadedOnce.current = true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Wait for the auth token (restored async on cold start) before fetching,
      // and re-run once it lands — otherwise the first call goes out
      // unauthenticated and the screen shows empty.
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

  // Days from today for the calendar strip.
  const days = useMemo(() => {
    const start = riyadhToday();
    const dayFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', {
      day: 'numeric',
    });
    const wdFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', {
      weekday: 'short',
    });
    return Array.from({ length: STRIP_DAYS }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dateKey(d);
      return {
        key,
        dayNum: dayFmt.format(d),
        weekday: i === 0 ? t({ ar: 'اليوم', en: 'Today' }) : wdFmt.format(d),
      };
    });
  }, [locale, t]);

  const coversDay = (b: ApiHostBookingItem, key: string) => b.start_date <= key && b.end_date >= key;
  const dayBookings = useMemo(
    () => items.filter((b) => coversDay(b, selectedKey)),
    [items, selectedKey],
  );

  const contentPad = {
    paddingTop: headerHeight + Spacing[4],
    paddingBottom: insets.bottom + Spacing[16],
  };

  const Toggle = ({ value, label }: { value: ViewMode; label: string }) => {
    const active = view === value;
    return (
      <PressableScale
        scaleTo={0.95}
        haptic="select"
        onPress={() => setView(value)}
        style={active ? [styles.chip, styles.chipActive] : styles.chip}>
        <ThemedText
          style={[
            active ? styles.chipTextActive : styles.chipText,
            { fontFamily: fontFamilyFor(active ? 'bold' : 'medium', locale) },
          ]}>
          {label}
        </ThemedText>
      </PressableScale>
    );
  };

  return (
    <View style={styles.container}>
      <HostHeader title={t({ ar: 'الحجوزات', en: 'Bookings' })} />

      {loading ? (
        <FlatList
          data={[0, 1, 2, 3]}
          keyExtractor={(i) => `s${i}`}
          renderItem={() => <RowSkeleton />}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, contentPad]}
        />
      ) : (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          {/* View toggle */}
          <View style={[styles.toggleRow, { flexDirection: 'row' }]}>
            <Toggle value="calendar" label={t({ ar: 'التقويم', en: 'Calendar' })} />
            <Toggle value="list" label={t({ ar: 'قائمة', en: 'List' })} />
          </View>

          {view === 'calendar' ? (
            <>
              {/* Horizontal date strip */}
              <View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.strip}>
                  {days.map((d) => {
                    const selected = d.key === selectedKey;
                    const hasDot = items.some((b) => coversDay(b, d.key));
                    return (
                      <PressableScale
                        key={d.key}
                        scaleTo={0.94}
                        haptic="select"
                        onPress={() => setSelectedKey(d.key)}
                        style={selected ? [styles.dayCell, styles.dayCellActive] : styles.dayCell}>
                        <ThemedText
                          numberOfLines={1}
                          style={[
                            selected ? styles.dayWeekActive : styles.dayWeek,
                            { fontFamily: fontFamilyFor('medium', locale) },
                          ]}>
                          {d.weekday}
                        </ThemedText>
                        <ThemedText
                          style={[
                            selected ? styles.dayNumActive : styles.dayNum,
                            { fontFamily: fontFamilyFor('bold', locale) },
                          ]}>
                          {d.dayNum}
                        </ThemedText>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: hasDot ? (selected ? '#FFFFFF' : Colors.light.coral) : 'transparent' },
                          ]}
                        />
                      </PressableScale>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Bookings for the selected day */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scroll, { paddingTop: Spacing[4], paddingBottom: insets.bottom + Spacing[16] }]}>
                {dayBookings.length > 0 ? (
                  dayBookings.map((b) => <HostBookingCard key={b.id} booking={b} />)
                ) : (
                  <ThemedText
                    style={[styles.dayEmpty, { fontFamily: fontFamilyFor('regular', locale), textAlign: 'center' }]}>
                    {t({ ar: 'لا حجوزات في هذا اليوم.', en: 'No bookings on this day.' })}
                  </ThemedText>
                )}
              </ScrollView>
            </>
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={[styles.emptyTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {t({ ar: 'لا توجد حجوزات بعد', en: 'No bookings yet' })}
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { fontFamily: fontFamilyFor('regular', locale) }]}>
                {t({ ar: 'ستظهر حجوزات ضيوفك على عقاراتك هنا.', en: 'Guest bookings on your places will show here.' })}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(b) => b.id}
              renderItem={({ item }) => <HostBookingCard booking={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scroll, { paddingTop: Spacing[4], paddingBottom: insets.bottom + Spacing[16] }]}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.3}
              removeClippedSubviews
              initialNumToRender={8}
              windowSize={5}
              ListFooterComponent={loadingMore ? <RowSkeleton /> : null}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing[5], gap: Spacing[3] },

  toggleRow: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
  },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 999,
    borderCurve: 'continuous',
  },
  chipActive: { backgroundColor: '#000000' },
  chipText: { fontSize: 13, lineHeight: 18, color: '#6B7280' },
  chipTextActive: { fontSize: 13, lineHeight: 18, color: '#FFFFFF' },

  strip: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
  },
  dayCell: {
    width: 58,
    paddingVertical: Spacing[3],
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 4,
  },
  dayCellActive: { backgroundColor: '#000000', borderColor: '#000000' },
  dayWeek: { fontSize: 11, lineHeight: 14, color: '#6B7280' },
  dayWeekActive: { fontSize: 11, lineHeight: 14, color: 'rgba(255,255,255,0.7)' },
  dayNum: { fontSize: 16, lineHeight: 20, color: '#000000' },
  dayNumActive: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  dot: { width: 5, height: 5, borderRadius: 999 },
  dayEmpty: { fontSize: 14, lineHeight: 21, color: Colors.light.textMuted, paddingVertical: Spacing[8] },

  empty: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing[8], paddingTop: Spacing[12], gap: Spacing[2] },
  emptyTitle: { fontSize: 18, lineHeight: 24, color: '#000000', textAlign: 'center' },
  emptyBody: { fontSize: 14, lineHeight: 21, color: Colors.light.textMuted, textAlign: 'center' },

  skelCard: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
    padding: Spacing[2] + 2,
    alignItems: 'center',
  },
  skelThumb: { width: 84, height: 84, borderRadius: 14 },
  skelBody: { flex: 1, gap: Spacing[2] },
});
