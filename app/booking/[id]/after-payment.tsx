import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarIcon } from '@/components/icons/star-icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useListingForId } from '@/hooks/use-listing-for-id';
import { getBookingPaymentStatus, type ApiBooking } from '@/lib/api';
import { addDaysIso, formatDateTime, formatSar } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DIVIDER = '#F4F4F4';

const LOADER_SUCCESS = require('@/assets/lottie/loader-and-success.json');
const LOADER_PENDING = require('@/assets/lottie/loader-and-pending.json');

const { width } = Dimensions.get('window');
const LOTTIE_W = Math.min(width - 200, 150);
// Reserve the footer height up-front so revealing the CTA never shifts the
// content above it.
const FOOTER_H = 53 + Spacing[5] + Spacing[3];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Poll cadence: 10 tries × 2s ≈ 20s of grace for the bank → backend webhook.
const MAX_TRIES = 10;
const POLL_DELAY = 2000;

type Phase = 'checking' | 'confirmed' | 'pending';

function Row({
  isRTL,
  locale,
  label,
  value,
  strong,
}: {
  isRTL: boolean;
  locale: 'ar' | 'en';
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={[styles.row, { flexDirection: 'row' }]}>
      <ThemedText
        style={[styles.rowLabel, { fontFamily: fontFamilyFor('regular', locale) }]}>
        {label}
      </ThemedText>
      <ThemedText
        style={[
          strong ? styles.rowValueStrong : styles.rowValue,
          { fontFamily: fontFamilyFor(strong ? 'bold' : 'medium', locale) },
        ]}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function AfterPaymentScreen() {
  // startDate/endDate/guests/total are forwarded from the booking we just
  // created, so the summary card renders fully before the status poll returns.
  const { id, bookingId, startDate, endDate, guests, total } = useLocalSearchParams<{
    id: string;
    bookingId: string;
    startDate?: string;
    endDate?: string;
    guests?: string;
    total?: string;
  }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const { listing } = useListingForId(id);

  const [phase, setPhase] = useState<Phase>('checking');
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const checkingAnim = useRef<LottieView>(null);
  const successAnim = useRef<LottieView>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let last: ApiBooking | null = null;
      for (let i = 0; i < MAX_TRIES && !cancelled; i++) {
        try {
          last = await getBookingPaymentStatus(bookingId);
          if (!cancelled) setBooking(last);
        } catch {
          // transient — keep polling
        }
        if (last && last.status !== 'pending_payment') break;
        await sleep(POLL_DELAY);
      }
      if (cancelled) return;
      setPhase(last?.status === 'confirmed' ? 'confirmed' : 'pending');
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Loop the loader segment (0–85) while we wait, matching the Malabis flow.
  // Once confirmed, skip the loader entirely and play only the checkmark reveal
  // (85–145) so the success shows immediately instead of replaying the loader.
  useEffect(() => {
    if (phase === 'checking') checkingAnim.current?.play(0, 85);
    else if (phase === 'confirmed') successAnim.current?.play(85, 145);
  }, [phase]);

  const align = isRTL ? 'right' : 'left';
  const writingDirection = isRTL ? 'rtl' : 'ltr';

  const title =
    phase === 'checking'
      ? t({ ar: 'نتحقق من دفعتك', en: 'Confirming your payment' })
      : phase === 'confirmed'
        ? t({ ar: 'تم تأكيد حجزك', en: 'Booking confirmed' })
        : t({ ar: 'لم نتمكن من تأكيد الدفع', en: 'We couldn’t confirm your payment' });

  const subtitle =
    phase === 'checking'
      ? t({
          ar: 'لحظات ونتأكد من حالة الدفع… لا تغلق هذه الصفحة.',
          en: 'Just a moment while we check the payment status… please don’t close this page.',
        })
      : phase === 'confirmed'
        ? t({
            ar: 'سيتواصل معك المضيف قبل وصولك. تجد تفاصيل حجزك في صفحة حجوزاتي.',
            en: 'Your host will reach out before you arrive. Find the details under My bookings.',
          })
        : t({
            ar: 'لا تقلق — إذا تم الدفع فعلاً، سنؤكد حجزك تلقائياً بمجرد وصول تأكيد البنك.',
            en: 'Don’t worry — if the payment went through, we’ll confirm it automatically once the bank notifies us.',
          });

  // Prefer the live poll once it lands, but fall back to the params passed in
  // so the card is populated immediately.
  const dispStart = booking?.start_date ?? startDate;
  const dispEnd = booking?.end_date ?? endDate;
  const dispGuests = booking?.guests ?? (guests ? Number(guests) : listing?.capacity.guests) ?? null;
  const dispTotal = booking?.pricing.total ?? (total ? Number(total) : null);

  // Check-in / check-out with exact times. Times come from the live booking
  // when available, else the place detail; checkout_next_day (place detail)
  // shifts the displayed checkout date to the day after the last booked day.
  const checkInTime = booking?.check_in_time ?? listing?.checkInTime;
  const checkOutTime = booking?.check_out_time ?? listing?.checkOutTime;
  const nextDay = booking?.checkout_next_day ?? listing?.checkoutNextDay ?? false;
  // Prefer the backend's resolved checkout_at (date part); fall back to the
  // forwarded end date (+1 when overnight) until the poll lands.
  const checkOutDateDisp = booking?.checkout_at
    ? booking.checkout_at.slice(0, 10)
    : dispEnd && nextDay
      ? addDaysIso(dispEnd, 1)
      : dispEnd;
  const checkInText = dispStart ? formatDateTime(dispStart, checkInTime, locale) : '—';
  const checkOutText = checkOutDateDisp
    ? formatDateTime(checkOutDateDisp, checkOutTime, locale) +
      (nextDay ? ` (${t({ ar: 'اليوم التالي', en: 'next day' })})` : '')
    : '—';
  const guestsText =
    dispGuests != null
      ? `${dispGuests} ${t({ ar: dispGuests === 1 ? 'ضيف' : 'ضيوف', en: dispGuests === 1 ? 'guest' : 'guests' })}`
      : '—';
  const totalText = dispTotal != null ? formatSar(dispTotal) : '—';

  const onCta = () => {
    if (phase === 'confirmed') router.replace('/(tabs)/bookings');
    else router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Loader / result animation. A key per phase forces a fresh mount so
              the success/pending clip autoplays from frame 0 (the green check
              actually shows). */}
          <View style={styles.lottieWrap}>
            {phase === 'checking' ? (
              <LottieView
                key="checking"
                ref={checkingAnim}
                source={LOADER_SUCCESS}
                autoPlay={false}
                loop
                style={{ width: LOTTIE_W, height: LOTTIE_W }}
              />
            ) : phase === 'confirmed' ? (
              <LottieView
                key="confirmed"
                ref={successAnim}
                source={LOADER_SUCCESS}
                autoPlay={false}
                loop={false}
                style={{ width: LOTTIE_W, height: LOTTIE_W }}
              />
            ) : (
              <LottieView
                key="pending"
                source={LOADER_PENDING}
                autoPlay
                loop={false}
                style={{ width: LOTTIE_W, height: LOTTIE_W }}
              />
            )}
          </View>

          {/* Title reflecting what we're doing right now */}
          <Animated.View key={phase} entering={FadeIn.duration(260)} style={styles.text}>
            <ThemedText
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale), writingDirection }]}>
              {title}
            </ThemedText>
            <ThemedText
              style={[
                styles.subtitle,
                { fontFamily: fontFamilyFor('regular', locale), textAlign: 'center', writingDirection },
              ]}>
              {subtitle}
            </ThemedText>
          </Animated.View>

          {/* Order summary card — same shape as the checkout summary. */}
          {listing ? (
            <View style={styles.card}>
              <View style={[styles.listingHead, { flexDirection: 'row' }]}>
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
                      { fontFamily: fontFamilyFor('bold', locale), textAlign: align, writingDirection },
                    ]}>
                    {t(listing.title)}
                  </ThemedText>
                  <View style={[styles.listingMeta, { flexDirection: 'row' }]}>
                    <View style={[styles.metaPart, { flexDirection: 'row' }]}>
                      <StarIcon size={11} color={TEXT_PRIMARY} />
                      <ThemedText style={[styles.metaText, { fontFamily: fontFamilyFor('regular', locale) }]}>
                        {' '}
                        {listing.rating.average.toFixed(2)} ({listing.rating.count})
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardDivider} />
              <Row isRTL={isRTL} locale={locale} label={t({ ar: 'الوصول', en: 'Check-in' })} value={checkInText} />
              <View style={styles.cardDivider} />
              <Row isRTL={isRTL} locale={locale} label={t({ ar: 'المغادرة', en: 'Check-out' })} value={checkOutText} />
              <View style={styles.cardDivider} />
              <Row isRTL={isRTL} locale={locale} label={t({ ar: 'الضيوف', en: 'Guests' })} value={guestsText} />
              <View style={styles.cardDivider} />
              <Row
                isRTL={isRTL}
                locale={locale}
                label={t({ ar: 'الإجمالي', en: 'Total' })}
                value={totalText}
                strong
              />
            </View>
          ) : null}
        </View>

        {/* Footer is always reserved (fixed height); the single CTA fades in
            once checking finishes, so nothing above shifts. */}
        <View style={styles.footer}>
          {phase !== 'checking' ? (
            <Animated.View entering={FadeIn.duration(320)}>
              <PressableScale haptic="forward" scaleTo={0.98} onPress={onCta} style={styles.cta}>
                <ThemedText style={[styles.ctaText, { fontFamily: fontFamilyFor('bold', locale) }]}>
                  {phase === 'confirmed'
                    ? t({ ar: 'عرض حجوزاتي', en: 'View my bookings' })
                    : t({ ar: 'العودة للرئيسية', en: 'Back to home' })}
                </ThemedText>
              </PressableScale>
            </Animated.View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
    gap: Spacing[5],
  },

  lottieWrap: {
    width: LOTTIE_W,
    height: LOTTIE_W,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    alignItems: 'center',
    gap: Spacing[2],
    maxWidth: 360,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_SECONDARY,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: DIVIDER,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 25,
    elevation: 6,
  },
  listingHead: {
    paddingVertical: Spacing[2],
    gap: Spacing[4],
    alignItems: 'center',
  },
  listingImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
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

  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER,
    marginVertical: Spacing[1],
  },
  row: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 14, lineHeight: 19, color: TEXT_SECONDARY },
  rowValue: { fontSize: 14, lineHeight: 19, color: TEXT_PRIMARY },
  rowValueStrong: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },

  footer: {
    height: FOOTER_H,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[5],
  },
  cta: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
});
