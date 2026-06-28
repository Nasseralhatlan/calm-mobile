import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarIcon } from '@/components/icons/star-icon';
import { PressableScale } from '@/components/pressable-scale';
import { Spinner } from '@/components/spinner';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useAuthState } from '@/data/auth-state';
import { setConfirm } from '@/data/confirm-dialog';
import { clearInterest } from '@/data/place-interest';
import { fetchQuote } from '@/data/quote';
import { useListingForId } from '@/hooks/use-listing-for-id';
import { ApiError, createBooking, type ApiQuote } from '@/lib/api';
import { addDaysIso, formatDateTime, formatSar } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const DIVIDER = '#F4F4F4';
const SURFACE = '#F4F4F4';

export default function BookingSummaryScreen() {
  const { id, checkIn, checkOut } = useLocalSearchParams<{
    id: string;
    checkIn?: string;
    checkOut?: string;
  }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const insets = useSafeAreaInsets();
  const { listing } = useListingForId(id);
  const { isAuthed } = useAuthState();

  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // Set when the user taps "Continue" while signed out — once they finish the
  // login modal and come back authed, we resume straight to payment.
  const resumeAfterLogin = useRef(false);

  // Quotes are never cached — always fetch a fresh price/availability on mount.
  const [quote, setQuote] = useState<ApiQuote | null>(null);

  useEffect(() => {
    if (!id || !checkIn || !checkOut) return;
    let cancelled = false;
    fetchQuote(id, checkIn, checkOut)
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, checkIn, checkOut]);

  if (!listing) {
    return (
      <SafeAreaView style={styles.notFound}>
        <ThemedText variant="heading">Listing not found</ThemedText>
      </SafeAreaView>
    );
  }

  // Exact check-in / check-out, each as date · time. checkout_next_day means
  // the checkout date is the day after the last booked day.
  const checkOutDateDisp =
    checkOut && listing.checkoutNextDay ? addDaysIso(checkOut, 1) : checkOut;
  const checkInValue =
    checkIn && checkOut
      ? formatDateTime(checkIn, listing.checkInTime, locale)
      : t({ ar: 'لم يتم اختيار تواريخ', en: 'No dates selected' });
  const checkOutValue = checkOutDateDisp
    ? formatDateTime(checkOutDateDisp, listing.checkOutTime, locale) +
      (listing.checkoutNextDay ? ` (${t({ ar: 'اليوم التالي', en: 'next day' })})` : '')
    : '';

  const changeDates = () =>
    router.replace({
      pathname: '/booking/[id]/dates',
      params: { id, startDate: checkIn, endDate: checkOut },
    });

  const totalText = quote ? formatSar(quote.pricing.total) : '—';

  const canPay = !!quote?.bookable;

  const requestLeave = () => {
    if (processing) return;
    setConfirm({
      title: t({ ar: 'هل تريد المغادرة؟', en: 'Leave checkout?' }),
      message: t({
        ar: 'سيتم تجاهل تفاصيل الحجز التي اخترتها.',
        en: 'Your selected booking details will be discarded.',
      }),
      confirmLabel: t({ ar: 'مغادرة', en: 'Leave' }),
      cancelLabel: t({ ar: 'البقاء', en: 'Stay' }),
      destructive: true,
      // The date modal was already dismissed when summary opened, so a single
      // back returns to the listing.
      onConfirm: () => router.back(),
    });
    router.push('/confirm');
  };

  // Intercept the Android hardware back so it also asks before leaving.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestLeave();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processing]);

  const onContinue = async () => {
    if (!canPay || !checkIn || !checkOut || processing) return;
    if (!isAuthed) {
      resumeAfterLogin.current = true;
      router.push('/login');
      return;
    }

    const placeId = listing.id;
    setPayError(null);
    setProcessing(true);
    try {
      // ③ Create the booking — server re-verifies price + holds the dates.
      // guests is required by the booking validation; send the place's max for
      // now (no guest picker yet, and guests don't affect the price).
      const guestsToSend = quote?.max_guests ?? listing.capacity.guests ?? 1;
      const booking = await createBooking(placeId, {
        check_in: checkIn,
        check_out: checkOut,
        guests: guestsToSend,
      });

      // It's now a real (pending) booking in the Bookings tab — drop the local
      // interest nudge so the home card doesn't duplicate it.
      void clearInterest(placeId);

      // ④ Open the Moyasar hosted page in an embedded WebView. That screen
      // detects the return redirect, polls payment-status (⑤), and routes on.
      router.push({
        pathname: '/booking/[id]/pay',
        params: {
          id: placeId,
          bookingId: booking.id,
          paymentUrl: booking.payment.url,
          // Forwarded to the after-payment screen so its summary card renders
          // instantly, before the status poll comes back.
          startDate: booking.start_date,
          endDate: booking.end_date,
          guests: String(booking.guests ?? guestsToSend),
          total: String(booking.pricing.total),
        },
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push('/login');
      } else if (e instanceof ApiError) {
        // Surface the specific field error from a 422 instead of the generic
        // "Validation failed", so it's clear what the backend rejected.
        const errs = (e.payload as { errors?: Record<string, string[]> } | undefined)
          ?.errors;
        const firstField = errs ? Object.values(errs)[0] : undefined;
        const detail = Array.isArray(firstField) ? firstField[0] : undefined;
        setPayError(
          detail ||
            e.message ||
            t({ ar: 'تعذر بدء الدفع، حاول مجدداً.', en: 'Could not start payment, try again.' }),
        );
      } else {
        setPayError(t({ ar: 'حدث خطأ ما.', en: 'Something went wrong.' }));
      }
    } finally {
      setProcessing(false);
    }
  };

  // Resume the booking flow once the login modal returns us here signed in.
  useEffect(() => {
    if (isAuthed && resumeAfterLogin.current) {
      resumeAfterLogin.current = false;
      onContinue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <PressableScale
            onPress={requestLeave}
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
                { flexDirection: 'row' },
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
                      textAlign: 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                  ]}>
                  {t(listing.title)}
                </ThemedText>
                <View
                  style={[
                    styles.listingMeta,
                    { flexDirection: 'row' },
                  ]}>
                  <View
                    style={[
                      styles.metaPart,
                      { flexDirection: 'row' },
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

            {checkIn && checkOut ? (
              <>
                <Row
                  isRTL={isRTL}
                  label={t({ ar: 'الوصول', en: 'Check-in' })}
                  value={checkInValue}
                  action={t({ ar: 'تغيير', en: 'Change' })}
                  onAction={changeDates}
                />
                <View style={styles.cardDivider} />
                <Row
                  isRTL={isRTL}
                  label={t({ ar: 'المغادرة', en: 'Check-out' })}
                  value={checkOutValue}
                />
              </>
            ) : (
              <Row
                isRTL={isRTL}
                label={t({ ar: 'التواريخ', en: 'Dates' })}
                value={checkInValue}
                action={t({ ar: 'تغيير', en: 'Change' })}
                onAction={changeDates}
              />
            )}

            <View style={styles.cardDivider} />

            {/* Price breakdown from the quote (source of truth). */}
            {quote ? (
              <View style={styles.linesBlock}>
                <PriceRow
                  isRTL={isRTL}
                  label={`${t({ ar: 'الإقامة', en: 'Stay' })} · ${quote.days} ${t({ ar: quote.days === 1 ? 'يوم' : 'أيام', en: quote.days === 1 ? 'day' : 'days' })}`}
                  value={formatSar(quote.pricing.subtotal)}
                />
                <PriceRow
                  isRTL={isRTL}
                  label={`${t({ ar: 'ضريبة القيمة المضافة', en: 'VAT' })} (${quote.pricing.vat_percentage}%)`}
                  value={formatSar(quote.pricing.vat)}
                />
                <View style={styles.cardDivider} />
                <PriceRow
                  isRTL={isRTL}
                  emphasis
                  label={t({ ar: 'الإجمالي', en: 'Total' })}
                  value={totalText}
                />
              </View>
            ) : (
              <View style={styles.quoteLoading}>
                <Spinner size={20} color={Colors.light.text} trackColor="rgba(0,0,0,0.12)" />
              </View>
            )}
          </View>

        </ScrollView>

        {/* Continue to payment */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
          {payError ? (
            <ThemedText
              style={[
                styles.payError,
                {
                  fontFamily: fontFamilyFor('regular', locale),
                  textAlign: 'center',
                },
              ]}>
              {payError}
            </ThemedText>
          ) : null}
          <PressableScale
            haptic="forward"
            scaleTo={0.98}
            disabled={!canPay || processing}
            onPress={onContinue}
            style={
              canPay && !processing
                ? styles.payCta
                : [styles.payCta, styles.payCtaDisabled]
            }>
            {!quote || processing ? (
              <Spinner size={20} />
            ) : (
              <ThemedText
                style={[styles.payCtaText, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {t({ ar: 'متابعة للدفع', en: 'Continue to payment' })}
              </ThemedText>
            )}
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
  action?: string;
  onAction?: () => void;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View
      style={[
        styles.row,
        { flexDirection: 'row' },
      ]}>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText
          style={[
            styles.rowLabel,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: 'left',
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
              textAlign: 'left',
            },
          ]}>
          {value}
        </ThemedText>
      </View>
      {action && onAction ? (
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
      ) : null}
    </View>
  );
}

function PriceRow({
  label,
  value,
  isRTL,
  emphasis,
}: {
  label: string;
  value: string;
  isRTL: boolean;
  emphasis?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View
      style={[
        styles.priceRow,
        { flexDirection: 'row' },
      ]}>
      <ThemedText
        numberOfLines={1}
        style={[
          emphasis ? styles.priceLabelStrong : styles.priceLabel,
          {
            fontFamily: fontFamilyFor(emphasis ? 'bold' : 'regular', locale),
            textAlign: 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}>
        {label}
      </ThemedText>
      <ThemedText
        style={[
          emphasis ? styles.priceValueStrong : styles.priceValue,
          { fontFamily: fontFamilyFor('bold', locale) },
        ]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
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
    insetInlineStart: Spacing[5],
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
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    marginTop: Spacing[4],
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
  quoteLoading: {
    paddingVertical: Spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
    paddingVertical: 4,
  },
  priceLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_SECONDARY,
  },
  priceLabelStrong: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
  priceValue: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  priceValueStrong: {
    fontSize: 16,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  payCta: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4] + 2,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCtaDisabled: {
    opacity: 0.5,
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
  payError: {
    fontSize: 13,
    lineHeight: 18,
    color: '#C53030',
    marginBottom: Spacing[2],
  },
});
