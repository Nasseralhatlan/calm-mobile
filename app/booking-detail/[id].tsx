import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { getBooking } from '@/data/bookings';
import { getListing } from '@/data/listings';
import { getService } from '@/data/services';
import type { BookingStatus } from '@/data/types';
import { formatMoneyEn, nightsBetween } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const DIVIDER = '#EBEBEB';
const SURFACE = '#F4F4F4';

const STATUS_THEME: Record<BookingStatus, { bg: string; fg: string; label: { ar: string; en: string } }> = {
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

function formatSingle(iso: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const insets = useSafeAreaInsets();

  const booking = getBooking(id);
  const listing = booking ? getListing(booking.listingId) : undefined;

  if (!booking || !listing) {
    return (
      <SafeAreaView style={styles.notFound}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText variant="heading">
          {t({ ar: 'لم يتم العثور على الحجز', en: 'Booking not found' })}
        </ThemedText>
      </SafeAreaView>
    );
  }

  const status = STATUS_THEME[booking.status];
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const dateRange = formatRangeEn(booking.checkIn, booking.checkOut);

  const onSupport = () => {
    Linking.openURL('mailto:support@calm.sa?subject=Booking%20' + booking.id);
  };
  const onDirections = () => {
    const { lat, lng } = listing.coordinates;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };
  const onContactHost = () => {
    Linking.openURL('tel:+966500000000');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header with circular X */}
        <View style={styles.header}>
          <PressableScale
            onPress={() => router.back()}
            scaleTo={0.88}
            haptic="back"
            style={styles.closeBtn}>
            <IconSymbol name="chevron.left" size={18} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.headerTitleSlot} pointerEvents="none">
            <ThemedText
              style={[styles.headerTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'تفاصيل الحجز', en: 'Booking details' })}
            </ThemedText>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing[5],
            paddingBottom: insets.bottom + Spacing[10],
            gap: Spacing[5],
          }}>
          {/* Hero card: image + title + status */}
          <View style={styles.heroCard}>
            <Image
              source={{ uri: listing.photos[0] }}
              style={styles.heroImage}
              contentFit="cover"
              transition={250}
            />
            <View style={styles.heroBody}>
              <View
                style={[
                  styles.heroTopRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <ThemedText
                    numberOfLines={2}
                    style={[
                      styles.heroTitle,
                      {
                        fontFamily: fontFamilyFor('bold', locale),
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}>
                    {t(listing.title)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.heroSub,
                      {
                        fontFamily: fontFamilyFor('regular', locale),
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}>
                    {t(listing.city)} · {t(listing.region)}
                  </ThemedText>
                </View>
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
            </View>
          </View>

          {/* Dates section */}
          <Section title={t({ ar: 'التواريخ', en: 'Dates' })} isRTL={isRTL}>
            <View
              style={[
                styles.datesRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}>
              <DateCol
                label={t({ ar: 'الوصول', en: 'Check-in' })}
                value={formatSingle(booking.checkIn, locale)}
                isRTL={isRTL}
              />
              <View style={styles.datesDivider} />
              <DateCol
                label={t({ ar: 'المغادرة', en: 'Check-out' })}
                value={formatSingle(booking.checkOut, locale)}
                isRTL={isRTL}
              />
            </View>
            <View style={styles.nightsBadge}>
              <ThemedText
                style={[styles.nightsText, { fontFamily: fontFamilyFor('medium', locale) }]}>
                {nights} {t({ ar: nights === 1 ? 'ليلة' : 'ليالٍ', en: nights === 1 ? 'night' : 'nights' })}
                {'  ·  '}
                {dateRange}
              </ThemedText>
            </View>
          </Section>

          {/* Guests */}
          <Section title={t({ ar: 'الضيوف', en: 'Guests' })} isRTL={isRTL}>
            <Row
              isRTL={isRTL}
              label={t({ ar: `${booking.guests} ضيف`, en: `${booking.guests} guests` })}
              value=""
            />
          </Section>

          {/* Services */}
          {booking.services.length > 0 ? (
            <Section title={t({ ar: 'الخدمات الإضافية', en: 'Add-on services' })} isRTL={isRTL}>
              {booking.services.map((bs, idx) => {
                const svc = getService(bs.serviceId);
                if (!svc) return null;
                return (
                  <Row
                    key={bs.serviceId}
                    isRTL={isRTL}
                    label={`${t(svc.title)} × ${bs.quantity}`}
                    value=""
                    isLast={idx === booking.services.length - 1}
                  />
                );
              })}
            </Section>
          ) : null}

          {/* Pricing */}
          <Section title={t({ ar: 'الفاتورة', en: 'Pricing' })} isRTL={isRTL}>
            <PriceRow
              isRTL={isRTL}
              label={t({ ar: 'الإقامة', en: 'Stay subtotal' })}
              value={formatMoneyEn(booking.pricing.subtotal, 0)}
            />
            <PriceRow
              isRTL={isRTL}
              label={t({ ar: 'رسوم التنظيف', en: 'Cleaning fee' })}
              value={formatMoneyEn(booking.pricing.cleaningFee, 0)}
            />
            <PriceRow
              isRTL={isRTL}
              label={t({ ar: 'رسوم الخدمة', en: 'Service fee' })}
              value={formatMoneyEn(booking.pricing.serviceFee, 0)}
            />
            {booking.pricing.servicesTotal > 0 ? (
              <PriceRow
                isRTL={isRTL}
                label={t({ ar: 'الخدمات الإضافية', en: 'Add-ons' })}
                value={formatMoneyEn(booking.pricing.servicesTotal, 0)}
              />
            ) : null}
            <View
              style={[
                styles.totalRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}>
              <ThemedText
                style={[styles.totalLabel, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {t({ ar: 'الإجمالي', en: 'Total' })}
              </ThemedText>
              <ThemedText
                style={[styles.totalValue, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {formatMoneyEn(booking.pricing.total, 0)}
              </ThemedText>
            </View>
          </Section>

          {/* Support actions */}
          <View style={styles.actions}>
            <ActionTile
              icon="message"
              label={t({ ar: 'تواصل مع المضيف', en: 'Contact host' })}
              onPress={onContactHost}
              isRTL={isRTL}
            />
            <ActionTile
              icon="location"
              label={t({ ar: 'الاتجاهات', en: 'Get directions' })}
              onPress={onDirections}
              isRTL={isRTL}
            />
            <ActionTile
              icon="questionmark.circle"
              label={t({ ar: 'الدعم الفني', en: 'Get support' })}
              onPress={onSupport}
              isRTL={isRTL}
            />
          </View>

          {booking.status === 'upcoming' ? (
            <PressableScale
              haptic="back"
              scaleTo={0.98}
              onPress={() => {}}
              style={styles.cancelCta}>
              <ThemedText
                style={[styles.cancelCtaText, { fontFamily: fontFamilyFor('medium', locale) }]}>
                {t({ ar: 'إلغاء الحجز', en: 'Cancel reservation' })}
              </ThemedText>
            </PressableScale>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({
  title,
  children,
  isRTL,
}: {
  title: string;
  children: React.ReactNode;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View>
      <ThemedText
        style={[
          styles.sectionTitle,
          {
            fontFamily: fontFamilyFor('bold', locale),
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}>
        {title}
      </ThemedText>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function DateCol({
  label,
  value,
  isRTL,
}: {
  label: string;
  value: string;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View style={styles.dateCol}>
      <ThemedText
        style={[
          styles.dateLabel,
          {
            fontFamily: fontFamilyFor('regular', locale),
            textAlign: isRTL ? 'right' : 'left',
          },
        ]}>
        {label}
      </ThemedText>
      <ThemedText
        numberOfLines={2}
        style={[
          styles.dateValue,
          {
            fontFamily: fontFamilyFor('bold', locale),
            textAlign: isRTL ? 'right' : 'left',
          },
        ]}>
        {value}
      </ThemedText>
    </View>
  );
}

function Row({
  label,
  value,
  isRTL,
  isLast,
}: {
  label: string;
  value: string;
  isRTL: boolean;
  isLast?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View
      style={[
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        !isLast && styles.rowDivider,
      ]}>
      <ThemedText
        style={[
          styles.rowLabel,
          {
            fontFamily: fontFamilyFor('regular', locale),
            textAlign: isRTL ? 'right' : 'left',
          },
        ]}>
        {label}
      </ThemedText>
      {value ? (
        <ThemedText
          style={[styles.rowValue, { fontFamily: fontFamilyFor('regular', locale) }]}>
          {value}
        </ThemedText>
      ) : null}
    </View>
  );
}

function PriceRow({
  label,
  value,
  isRTL,
}: {
  label: string;
  value: string;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View
      style={[
        styles.priceRow,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}>
      <ThemedText
        style={[styles.priceLabel, { fontFamily: fontFamilyFor('regular', locale) }]}>
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.priceValue, { fontFamily: fontFamilyFor('regular', locale) }]}>
        {value}
      </ThemedText>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
  isRTL,
}: {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  label: string;
  onPress: () => void;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  return (
    <PressableScale
      haptic="select"
      scaleTo={0.98}
      onPress={onPress}
      style={[
        styles.actionTile,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}>
      <View style={styles.actionIconWrap}>
        <IconSymbol name={icon} size={20} color={Colors.light.text} />
      </View>
      <ThemedText
        style={[
          styles.actionLabel,
          {
            fontFamily: fontFamilyFor('bold', locale),
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}>
        {label}
      </ThemedText>
      <IconSymbol
        name="chevron.left"
        size={16}
        color={TEXT_MUTED}
        style={isRTL ? undefined : { transform: [{ rotate: '180deg' }] }}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    height: 64,
    paddingHorizontal: Spacing[5],
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'absolute',
    left: Spacing[5],
    top: Spacing[3],
    zIndex: 2,
  },
  headerTitleSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 64,
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },

  heroCard: {
    marginTop: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  heroImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  heroBody: {
    padding: Spacing[4],
  },
  heroTopRow: {
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  heroTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
  },
  statusChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    lineHeight: 15,
  },

  sectionTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
    marginBottom: Spacing[2],
    paddingHorizontal: 2,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    overflow: 'hidden',
  },

  datesRow: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    alignItems: 'stretch',
  },
  dateCol: {
    flex: 1,
    gap: 4,
  },
  datesDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER,
    marginHorizontal: Spacing[4],
  },
  dateLabel: {
    fontSize: 11,
    lineHeight: 15,
    color: TEXT_SECONDARY,
  },
  dateValue: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  nightsBadge: {
    backgroundColor: SURFACE,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
  },
  nightsText: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },

  row: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    alignItems: 'center',
    gap: Spacing[2],
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  rowValue: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
  },

  priceRow: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  priceLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  priceValue: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_PRIMARY,
  },
  totalRow: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3] + 2,
    marginTop: Spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: 16,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },

  actions: {
    gap: Spacing[2],
  },
  actionTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3] + 2,
    alignItems: 'center',
    gap: Spacing[3],
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },

  cancelCta: {
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelCtaText: {
    fontSize: 14,
    lineHeight: 19,
    color: '#B42318',
  },
});
