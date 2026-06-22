import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HostBookingCard } from '@/components/host/host-booking-card';
import { HostHeader, HOST_HEADER_HEIGHT } from '@/components/host/host-header';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonBlock } from '@/components/skeleton-block';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useAuthState } from '@/data/auth-state';
import {
  getHostBookings,
  getHostEarnings,
  getHostListings,
  type ApiHostBookingItem,
  type ApiHostEarnings,
} from '@/lib/api';
import { dateKey, riyadhToday } from '@/lib/date-key';
import { formatSar } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

type HomeFilter = 'today' | 'upcoming';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';

interface Dashboard {
  earnings: ApiHostEarnings;
  recent: ApiHostBookingItem[];
  bookingsTotal: number;
  listingsTotal: number;
}

export default function HostHome() {
  const t = useT();
  const { locale } = useLocale();
  const { user, token } = useAuthState();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const align = isRTL ? ('right' as const) : ('left' as const);
  const wd = isRTL ? ('rtl' as const) : ('ltr' as const);
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + HOST_HEADER_HEIGHT;

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HomeFilter>('today');
  const loadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      if (!loadedOnce.current) setLoading(true);
      Promise.all([
        getHostEarnings(),
        getHostBookings({ page: 1, per_page: 50 }),
        getHostListings({ page: 1, per_page: 1 }),
      ])
        .then(([earnings, bookings, listings]) => {
          if (!active) return;
          setData({
            earnings,
            recent: bookings.items,
            bookingsTotal: bookings.pagination.total,
            listingsTotal: listings.pagination.total,
          });
          loadedOnce.current = true;
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [token]),
  );

  const firstName = user?.name ? user.name.split(' ')[0] : null;
  const greeting = firstName
    ? t({ ar: `مرحباً ${firstName}`, en: `Hi ${firstName}` })
    : t({ ar: 'لوحة التحكم', en: 'Dashboard' });

  const todayKey = dateKey(riyadhToday());
  const recent = (data?.recent ?? []).filter((b) =>
    filter === 'today'
      ? b.start_date <= todayKey && b.end_date >= todayKey
      : b.start_date > todayKey,
  );

  const Chip = ({ value, label }: { value: HomeFilter; label: string }) => {
    const active = filter === value;
    return (
      <PressableScale
        scaleTo={0.95}
        haptic="select"
        onPress={() => setFilter(value)}
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

  const Tile = ({ value, label, onPress }: { value: string; label: string; onPress: () => void }) => (
    <PressableScale scaleTo={0.97} haptic="select" onPress={onPress} style={styles.tile}>
      <ThemedText style={[styles.tileValue, { fontFamily: fontFamilyFor('bold', locale), textAlign: align }]}>
        {value}
      </ThemedText>
      <ThemedText
        style={[styles.tileLabel, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
        {label}
      </ThemedText>
    </PressableScale>
  );

  return (
    <View style={styles.container}>
      <HostHeader title={greeting} subtitle={t({ ar: 'لوحة تحكم المضيف', en: 'Host dashboard' })} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + Spacing[4], paddingBottom: insets.bottom + Spacing[16] },
        ]}>
        {loading ? (
          <>
            <SkeletonBlock style={styles.heroSkel} />
            <View style={styles.row}>
              <SkeletonBlock style={styles.tileSkel} />
              <SkeletonBlock style={styles.tileSkel} />
            </View>
          </>
        ) : (
          <>
            {/* Earnings hero → Finance */}
            <PressableScale
              scaleTo={0.98}
              haptic="select"
              onPress={() => router.navigate('/(host)/finance')}
              style={styles.hero}>
              <ThemedText
                style={[styles.heroLabel, { fontFamily: fontFamilyFor('medium', locale), textAlign: align, writingDirection: wd }]}>
                {t({ ar: 'إجمالي الأرباح', en: 'Total earnings' })}
              </ThemedText>
              <ThemedText style={[styles.heroValue, { fontFamily: fontFamilyFor('bold', locale), textAlign: align }]}>
                {formatSar(data?.earnings.total ?? 0)}
              </ThemedText>
              <ThemedText
                style={[styles.heroSub, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
                {t({
                  ar: `${formatSar(data?.earnings.not_paid ?? 0)} قيد الدفع`,
                  en: `${formatSar(data?.earnings.not_paid ?? 0)} pending payout`,
                })}
              </ThemedText>
            </PressableScale>

            <View style={styles.row}>
              <Tile
                value={String(data?.listingsTotal ?? 0)}
                label={t({ ar: 'عقاراتي', en: 'Listings' })}
                onPress={() => router.navigate('/(host)/listings')}
              />
              <Tile
                value={String(data?.bookingsTotal ?? 0)}
                label={t({ ar: 'الحجوزات', en: 'Bookings' })}
                onPress={() => router.navigate('/(host)/bookings')}
              />
            </View>

            {/* Bookings, filtered by Today / Upcoming */}
            <View style={[styles.chipsRow, { flexDirection: 'row' }]}>
              <Chip value="today" label={t({ ar: 'اليوم', en: 'Today' })} />
              <Chip value="upcoming" label={t({ ar: 'القادمة', en: 'Upcoming' })} />
            </View>

            {recent.length > 0 ? (
              <View style={{ gap: Spacing[3] }}>
                {recent.map((b) => (
                  <HostBookingCard key={b.id} booking={b} />
                ))}
              </View>
            ) : (
              <ThemedText
                style={[styles.emptyBody, { fontFamily: fontFamilyFor('regular', locale), textAlign: 'center' }]}>
                {filter === 'today'
                  ? t({ ar: 'لا حجوزات اليوم.', en: 'No bookings today.' })
                  : t({ ar: 'لا حجوزات قادمة.', en: 'No upcoming bookings.' })}
              </ThemedText>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing[5], gap: Spacing[4] },

  hero: {
    backgroundColor: '#000000',
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing[5],
    gap: Spacing[1],
  },
  heroLabel: { fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.7)' },
  heroValue: { fontSize: 32, lineHeight: 40, color: '#FFFFFF' },
  heroSub: { fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  row: { flexDirection: 'row', gap: Spacing[3] },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
    padding: Spacing[4],
    gap: Spacing[1],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  tileValue: { fontSize: 24, lineHeight: 30, color: TEXT_PRIMARY },
  tileLabel: { fontSize: 13, lineHeight: 18, color: TEXT_SECONDARY },

  chipsRow: { alignItems: 'center', gap: Spacing[2], marginTop: Spacing[2] },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 999,
    borderCurve: 'continuous',
  },
  chipActive: { backgroundColor: '#000000' },
  chipText: { fontSize: 13, lineHeight: 18, color: TEXT_SECONDARY },
  chipTextActive: { fontSize: 13, lineHeight: 18, color: '#FFFFFF' },
  emptyBody: { fontSize: 14, lineHeight: 21, color: Colors.light.textMuted, paddingVertical: Spacing[4] },

  heroSkel: { height: 132, borderRadius: 24 },
  tileSkel: { flex: 1, height: 92, borderRadius: 20 },
});
