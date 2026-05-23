import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { BOOKINGS } from '@/data/bookings';
import { getListing } from '@/data/listings';
import type { Booking, BookingStatus } from '@/data/types';
import { formatMoneyEn, nightsBetween } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DIVIDER = '#EBEBEB';
const SURFACE = '#F4F4F4';

const STATUS_THEME: Record<
  BookingStatus,
  { bg: string; fg: string; label: { ar: string; en: string } }
> = {
  upcoming: {
    bg: '#E7F8EE',
    fg: '#15803D',
    label: { ar: 'قادم', en: 'Upcoming' },
  },
  completed: {
    bg: SURFACE,
    fg: '#374151',
    label: { ar: 'منتهٍ', en: 'Completed' },
  },
  cancelled: {
    bg: '#FEE4E2',
    fg: '#B42318',
    label: { ar: 'ملغي', en: 'Cancelled' },
  },
};

type TabKey = 'upcoming' | 'past';

function formatRangeEn(startISO: string, endISO: string): string {
  const a = new Date(startISO);
  const b = new Date(endISO);
  const fmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });
  const yr = a.getFullYear();
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${fmt.format(a)} – ${b.getDate()}, ${yr}`;
  }
  return `${fmt.format(a)} – ${fmt.format(b)}, ${yr}`;
}

export default function BookingsScreen() {
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const filtered = useMemo<Booking[]>(() => {
    if (activeTab === 'upcoming') {
      return BOOKINGS.filter((b) => b.status === 'upcoming');
    }
    return BOOKINGS.filter((b) => b.status !== 'upcoming');
  }, [activeTab]);

  const tabBarH = 80; // approx custom tab bar height

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <ThemedText
          style={[
            styles.title,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {t(STR.bookings.title)}
        </ThemedText>

        {/* Segmented control */}
        <View style={styles.segWrap}>
          <SegButton
            label={t({ ar: 'القادمة', en: 'Upcoming' })}
            active={activeTab === 'upcoming'}
            onPress={() => setActiveTab('upcoming')}
          />
          <SegButton
            label={t({ ar: 'السابقة', en: 'Past' })}
            active={activeTab === 'past'}
            onPress={() => setActiveTab('past')}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarH + Spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'upcoming'
                ? t(STR.bookings.emptyUpcomingTitle)
                : t({ ar: 'لا حجوزات سابقة', en: 'No past bookings yet' })
            }
            body={
              activeTab === 'upcoming'
                ? t(STR.bookings.emptyUpcomingBody)
                : t({
                    ar: 'حجوزاتك الماضية تظهر هنا.',
                    en: 'Your past stays will appear here.',
                  })
            }
          />
        ) : (
          filtered.map((b) => {
            const listing = getListing(b.listingId);
            if (!listing) return null;
            const status = STATUS_THEME[b.status];
            const nights = nightsBetween(b.checkIn, b.checkOut);

            return (
              <Link key={b.id} href={`/booking-detail/${b.id}`} asChild>
                <PressableScale scaleTo={0.98} haptic="forward" style={styles.card}>
                  <Image
                    source={{ uri: listing.photos[0] }}
                    style={styles.thumb}
                    contentFit="cover"
                    transition={250}
                  />
                  <View style={styles.body}>
                    <View
                      style={[
                        styles.topRow,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      ]}>
                      <ThemedText
                        numberOfLines={1}
                        style={[
                          styles.cardTitle,
                          {
                            fontFamily: fontFamilyFor('bold', locale),
                            textAlign: isRTL ? 'right' : 'left',
                            writingDirection: isRTL ? 'rtl' : 'ltr',
                          },
                        ]}>
                        {t(listing.title)}
                      </ThemedText>
                      <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
                        <ThemedText
                          style={[
                            styles.statusChipText,
                            { color: status.fg, fontFamily: fontFamilyFor('bold', locale) },
                          ]}>
                          {t(status.label)}
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText
                      numberOfLines={1}
                      style={[
                        styles.cardMeta,
                        {
                          fontFamily: fontFamilyFor('regular', locale),
                          textAlign: isRTL ? 'right' : 'left',
                          writingDirection: isRTL ? 'rtl' : 'ltr',
                        },
                      ]}>
                      {t(listing.city)} · {t(listing.region)}
                    </ThemedText>

                    <ThemedText
                      numberOfLines={1}
                      style={[
                        styles.cardMeta,
                        {
                          fontFamily: fontFamilyFor('regular', locale),
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}>
                      {formatRangeEn(b.checkIn, b.checkOut)} ·{' '}
                      {nights} {t({ ar: nights === 1 ? 'ليلة' : 'ليالٍ', en: nights === 1 ? 'night' : 'nights' })}
                    </ThemedText>

                    <View
                      style={[
                        styles.bottomRow,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      ]}>
                      <ThemedText
                        style={[
                          styles.guests,
                          { fontFamily: fontFamilyFor('regular', locale) },
                        ]}>
                        {b.guests} {t({ ar: 'ضيف', en: 'guests' })}
                      </ThemedText>
                      <View style={{ flex: 1 }} />
                      <ThemedText
                        style={[
                          styles.price,
                          { fontFamily: fontFamilyFor('bold', locale) },
                        ]}>
                        {formatMoneyEn(b.pricing.total, 0)}
                      </ThemedText>
                    </View>
                  </View>
                </PressableScale>
              </Link>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SegButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { locale } = useLocale();
  return (
    <PressableScale
      scaleTo={0.96}
      haptic="select"
      onPress={onPress}
      style={active ? [styles.segBtn, styles.segBtnActive] : styles.segBtn}>
      <ThemedText
        style={[
          styles.segLabel,
          active && styles.segLabelActive,
          { fontFamily: fontFamilyFor(active ? 'bold' : 'medium', locale) },
        ]}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  headerWrap: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
    gap: Spacing[4],
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },

  segWrap: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    padding: 4,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  segBtn: {
    flex: 1,
    paddingVertical: Spacing[2] + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segLabel: {
    fontSize: 13,
    lineHeight: 17,
    color: TEXT_SECONDARY,
  },
  segLabelActive: {
    color: TEXT_PRIMARY,
  },

  scroll: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  thumb: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  body: {
    padding: Spacing[4],
    gap: Spacing[2],
  },
  topRow: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
  cardMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_SECONDARY,
  },
  bottomRow: {
    marginTop: Spacing[2],
    paddingTop: Spacing[2] + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
    alignItems: 'center',
  },
  guests: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_SECONDARY,
  },
  price: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  statusChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
