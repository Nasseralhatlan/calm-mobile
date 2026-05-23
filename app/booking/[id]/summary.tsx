import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarIcon } from '@/components/icons/star-icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { getListing } from '@/data/listings';
import { getService } from '@/data/services';
import type { AddOnService } from '@/data/types';
import { formatMoneyEn, nightsBetween } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const DIVIDER = '#EBEBEB';
const SURFACE = '#F4F4F4';

type PayMethod = 'apple_pay' | 'tabby' | 'tamara' | 'card';

interface PayOptionDef {
  key: PayMethod;
  title: { ar: string; en: string };
  subtitle?: { ar: string; en: string };
  emoji: string;
  accent?: string;
}

const PAY_OPTIONS: PayOptionDef[] = [
  {
    key: 'apple_pay',
    title: { ar: 'Apple Pay', en: 'Apple Pay' },
    subtitle: { ar: 'دفع سريع وآمن', en: 'Fast and secure checkout' },
    emoji: '',
  },
  {
    key: 'tabby',
    title: { ar: 'تابي', en: 'Tabby' },
    subtitle: { ar: 'قسّمها على ٤ دفعات بدون فوائد', en: 'Split into 4 interest-free payments' },
    emoji: '🟢',
    accent: '#3BCEAC',
  },
  {
    key: 'tamara',
    title: { ar: 'تمارا', en: 'Tamara' },
    subtitle: { ar: 'ادفع بعد ٣٠ يوم أو على دفعات', en: 'Pay in 30 days or in 3 instalments' },
    emoji: '🟣',
    accent: '#FF8DB1',
  },
  {
    key: 'card',
    title: { ar: 'بطاقة ائتمان أو خصم', en: 'Credit or debit card' },
    subtitle: { ar: 'Visa أو Mastercard أو mada', en: 'Visa, Mastercard, or mada' },
    emoji: '💳',
  },
];

function totalForService(service: AddOnService, qty: number, guests: number): number {
  if (service.unit === 'flat') return qty > 0 ? service.price : 0;
  if (service.unit === 'per_guest') return service.price * guests * qty;
  return service.price * qty;
}

interface ServiceLine {
  service: AddOnService;
  qty: number;
  total: number;
}

function parseServices(serialized: string | undefined, guests: number): ServiceLine[] {
  if (!serialized) return [];
  return serialized
    .split(',')
    .map((entry) => {
      const [sid, qStr] = entry.split(':');
      const service = getService(sid);
      const qty = Number(qStr) || 0;
      if (!service || qty <= 0) return null;
      return { service, qty, total: totalForService(service, qty, guests) };
    })
    .filter((l): l is ServiceLine => l !== null);
}

function formatRangeEn(startISO: string, endISO: string): string {
  const a = new Date(startISO);
  const b = new Date(endISO);
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const yr = a.getFullYear();
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${fmt.format(a)} – ${b.getDate()}, ${yr}`;
  }
  return `${fmt.format(a)} – ${fmt.format(b)}, ${yr}`;
}

export default function BookingSummaryScreen() {
  const { id, startDate, endDate, services } = useLocalSearchParams<{
    id: string;
    startDate?: string;
    endDate?: string;
    services?: string;
  }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const insets = useSafeAreaInsets();
  const listing = getListing(id);

  const [payMethod, setPayMethod] = useState<PayMethod>('apple_pay');

  const guests = listing?.capacity.guests ?? 1;
  const nights = useMemo(() => {
    if (!startDate || !endDate) return 1;
    return nightsBetween(startDate, endDate);
  }, [startDate, endDate]);

  const lines = useMemo(
    () => (listing ? parseServices(services, guests) : []),
    [services, guests, listing],
  );

  const breakdown = useMemo(() => {
    if (!listing) return null;
    const subtotal = listing.pricing.nightly * nights;
    const cleaningFee = listing.pricing.cleaningFee;
    const serviceFee = listing.pricing.serviceFee;
    const servicesTotal = lines.reduce((sum, l) => sum + l.total, 0);
    const total = subtotal + cleaningFee + serviceFee + servicesTotal;
    return { subtotal, cleaningFee, serviceFee, servicesTotal, total };
  }, [listing, nights, lines]);

  if (!listing || !breakdown) {
    return (
      <SafeAreaView style={styles.notFound}>
        <ThemedText variant="heading">Listing not found</ThemedText>
      </SafeAreaView>
    );
  }

  const dateLabel =
    startDate && endDate
      ? formatRangeEn(startDate, endDate)
      : t({ ar: 'لم يتم اختيار تواريخ', en: 'No dates selected' });

  const guestsLabel = `${guests} ${t({ ar: guests === 1 ? 'ضيف' : 'ضيوف', en: guests === 1 ? 'guest' : 'guests' })}`;
  const totalText = formatMoneyEn(breakdown.total, 2);

  const ctaLabel = (() => {
    switch (payMethod) {
      case 'apple_pay':
        return t({ ar: 'الدفع بـ Apple Pay', en: 'Pay with' });
      case 'tabby':
        return t({ ar: 'متابعة مع تابي', en: 'Continue with Tabby' });
      case 'tamara':
        return t({ ar: 'متابعة مع تمارا', en: 'Continue with Tamara' });
      case 'card':
        return t({ ar: 'الدفع بالبطاقة', en: 'Pay with card' });
    }
  })();

  const onConfirm = () => {
    router.replace(`/booking/${listing.id}/confirmation`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <PressableScale
            onPress={() => router.back()}
            scaleTo={0.88}
            haptic="back"
            style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.headerTitleSlot} pointerEvents="none">
            <ThemedText
              style={[styles.headerTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'تأكيد و دفع', en: 'Confirm and pay' })}
            </ThemedText>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing[5],
            paddingBottom: insets.bottom + 130,
            gap: Spacing[5],
          }}>
          {/* Listing summary card */}
          <View style={styles.card}>
            <View
              style={[
                styles.listingHead,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}>
              <Image
                source={{ uri: listing.photos[0] }}
                style={styles.listingImage}
                contentFit="cover"
                transition={200}
              />
              <View style={{ flex: 1, gap: 6 }}>
                <ThemedText
                  numberOfLines={2}
                  style={[
                    styles.listingTitle,
                    {
                      fontFamily: fontFamilyFor('bold', locale),
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                  ]}>
                  {t(listing.title)}
                </ThemedText>
                <View
                  style={[
                    styles.listingMeta,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}>
                  <View
                    style={[
                      styles.metaPart,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}>
                    <StarIcon size={11} color={TEXT_PRIMARY} />
                    <ThemedText
                      style={[
                        styles.metaText,
                        { fontFamily: fontFamilyFor('regular', locale) },
                      ]}>
                      {' '}
                      {listing.rating.average.toFixed(2)} ({listing.rating.count})
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.metaDot}>·</ThemedText>
                  <ThemedText
                    style={[
                      styles.metaText,
                      { fontFamily: fontFamilyFor('regular', locale) },
                    ]}>
                    {t({ ar: 'مميز', en: 'Guest favorite' })}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <Row
              isRTL={isRTL}
              label={t({ ar: 'التواريخ', en: 'Dates' })}
              value={dateLabel}
              action={t({ ar: 'تغيير', en: 'Change' })}
              onAction={() =>
                router.replace({
                  pathname: '/booking/[id]/dates',
                  params: { id, startDate, endDate },
                })
              }
            />

            <View style={styles.cardDivider} />

            <Row
              isRTL={isRTL}
              label={t({ ar: 'الضيوف', en: 'Guests' })}
              value={guestsLabel}
              action={t({ ar: 'تغيير', en: 'Change' })}
              onAction={() => {}}
            />

            <View style={styles.cardDivider} />

            <Row
              isRTL={isRTL}
              label={t({ ar: 'الإجمالي', en: 'Total price' })}
              value={totalText}
              action={t({ ar: 'تفاصيل', en: 'Details' })}
              onAction={() => {}}
            />

            {lines.length > 0 ? (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.linesBlock}>
                  <ThemedText
                    style={[
                      styles.linesTitle,
                      {
                        fontFamily: fontFamilyFor('bold', locale),
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}>
                    {t({ ar: 'الخدمات الإضافية', en: 'Add-ons' })}
                  </ThemedText>
                  {lines.map((l, idx) => (
                    <View
                      key={l.service.id}
                      style={[
                        styles.lineRow,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        idx < lines.length - 1 && styles.lineRowDivider,
                      ]}>
                      <ThemedText
                        numberOfLines={1}
                        style={[
                          styles.lineLabel,
                          {
                            fontFamily: fontFamilyFor('regular', locale),
                            textAlign: isRTL ? 'right' : 'left',
                          },
                        ]}>
                        {t(l.service.title)} × {l.qty}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.lineValue,
                          { fontFamily: fontFamilyFor('bold', locale) },
                        ]}>
                        {formatMoneyEn(l.total, 0)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>

          {/* Payment method */}
          <View style={{ gap: Spacing[3] }}>
            <ThemedText
              style={[
                styles.sectionTitle,
                {
                  fontFamily: fontFamilyFor('bold', locale),
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t({ ar: 'اختر طريقة الدفع', en: 'Payment method' })}
            </ThemedText>

            <View style={styles.payCard}>
              {PAY_OPTIONS.map((opt, idx) => (
                <View key={opt.key}>
                  <PayOption
                    isRTL={isRTL}
                    option={opt}
                    selected={payMethod === opt.key}
                    onPress={() => setPayMethod(opt.key)}
                  />
                  {idx < PAY_OPTIONS.length - 1 ? <View style={styles.payDivider} /> : null}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Pay CTA — black, content depends on selection */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
          <PressableScale
            haptic="forward"
            scaleTo={0.98}
            onPress={onConfirm}
            style={styles.payCta}>
            <View
              style={[
                styles.payCtaInner,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}>
              <ThemedText
                style={[styles.payCtaText, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {ctaLabel}
              </ThemedText>
              {payMethod === 'apple_pay' ? (
                <ThemedText style={styles.applePayMark}>{' '} Pay</ThemedText>
              ) : null}
            </View>
          </PressableScale>
          <ThemedText
            style={[
              styles.legal,
              {
                fontFamily: fontFamilyFor('regular', locale),
                textAlign: 'center',
              },
            ]}>
            {t({
              ar: 'بالضغط، أوافق على شروط الحجز.',
              en: 'By tapping, I agree to the booking terms.',
            })}
          </ThemedText>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({
  label,
  value,
  action,
  onAction,
  isRTL,
}: {
  label: string;
  value: string;
  action: string;
  onAction: () => void;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View
      style={[
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText
          style={[
            styles.rowLabel,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {label}
        </ThemedText>
        <ThemedText
          style={[
            styles.rowValue,
            {
              fontFamily: fontFamilyFor('regular', locale),
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}>
          {value}
        </ThemedText>
      </View>
      <PressableScale
        haptic="select"
        scaleTo={0.95}
        onPress={onAction}
        style={styles.actionPill}>
        <ThemedText
          style={[styles.actionPillText, { fontFamily: fontFamilyFor('medium', locale) }]}>
          {action}
        </ThemedText>
      </PressableScale>
    </View>
  );
}

function PayOption({
  option,
  selected,
  onPress,
  isRTL,
}: {
  option: PayOptionDef;
  selected: boolean;
  onPress: () => void;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  const t = useT();
  return (
    <PressableScale
      haptic="select"
      scaleTo={0.99}
      onPress={onPress}
      style={[
        styles.payOption,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}>
      <View
        style={[
          styles.payIconWrap,
          option.accent ? { backgroundColor: option.accent + '22' } : null,
        ]}>
        {option.key === 'apple_pay' ? (
          <ThemedText style={styles.applePayBadge}> Pay</ThemedText>
        ) : (
          <ThemedText style={styles.payEmoji}>{option.emoji}</ThemedText>
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText
          style={[
            styles.payOptionTitle,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {t(option.title)}
        </ThemedText>
        {option.subtitle ? (
          <ThemedText
            style={[
              styles.payOptionSub,
              {
                fontFamily: fontFamilyFor('regular', locale),
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}>
            {t(option.subtitle)}
          </ThemedText>
        ) : null}
      </View>

      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginTop: Spacing[4],
  },
  listingHead: {
    paddingVertical: Spacing[3],
    gap: Spacing[3],
    alignItems: 'center',
  },
  listingImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
  listingTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  listingMeta: {
    alignItems: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  metaPart: { alignItems: 'center' },
  metaText: { fontSize: 12, lineHeight: 17, color: TEXT_PRIMARY },
  metaDot: { fontSize: 12, lineHeight: 17, color: TEXT_MUTED },

  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER,
    marginVertical: Spacing[1],
  },
  row: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
    gap: Spacing[3],
  },
  rowLabel: { fontSize: 14, lineHeight: 19, color: TEXT_PRIMARY },
  rowValue: { fontSize: 13, lineHeight: 18, color: TEXT_PRIMARY },
  actionPill: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    backgroundColor: SURFACE,
  },
  actionPillText: { fontSize: 13, lineHeight: 17, color: TEXT_PRIMARY },

  linesBlock: { paddingVertical: Spacing[2], gap: Spacing[2] },
  linesTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
    marginBottom: Spacing[1],
  },
  lineRow: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
    gap: Spacing[2],
  },
  lineRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  lineLabel: { flex: 1, fontSize: 13, lineHeight: 18, color: TEXT_PRIMARY },
  lineValue: { fontSize: 13, lineHeight: 18, color: TEXT_PRIMARY },

  sectionTitle: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
  payCard: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  payOption: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    alignItems: 'center',
    gap: Spacing[3],
  },
  payIconWrap: {
    width: 44,
    height: 28,
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applePayBadge: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
    fontFamily: 'Satoshi-Bold',
  },
  payEmoji: { fontSize: 18, lineHeight: 22 },
  payOptionTitle: { fontSize: 14, lineHeight: 19, color: TEXT_PRIMARY },
  payOptionSub: { fontSize: 12, lineHeight: 17, color: TEXT_SECONDARY },
  payDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER,
    marginHorizontal: Spacing[4],
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C9C9C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: '#000000' },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
    gap: Spacing[2],
  },
  payCta: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCtaInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
  applePayMark: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'Satoshi-Bold',
  },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    color: TEXT_MUTED,
  },
});
