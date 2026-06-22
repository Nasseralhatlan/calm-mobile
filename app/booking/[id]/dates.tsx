import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { WhenContent, type DateRange } from '@/components/search/when-content';
import { Spinner } from '@/components/spinner';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { fetchQuote } from '@/data/quote';
import { useUnavailableDates } from '@/hooks/use-unavailable-dates';
import { ApiError } from '@/lib/api';
import { dateKey, rangeHasBlockedDay } from '@/lib/date-key';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DIVIDER = '#EBEBEB';

function formatDay(d: Date | null, locale: 'ar' | 'en'): string {
  if (!d) return '';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

export default function PickDatesModal() {
  const { id, startDate, endDate } = useLocalSearchParams<{
    id: string;
    startDate?: string;
    endDate?: string;
  }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const insets = useSafeAreaInsets();

  const [range, setRange] = useState<DateRange>(() => ({
    start: startDate ? new Date(startDate) : null,
    end: endDate ? new Date(endDate) : null,
  }));
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Days the quote endpoint reported blocked at confirm time, merged on top of
  // the prefetched calendar set.
  const [serverBlocked, setServerBlocked] = useState<Set<string>>(new Set());

  const prefetchedBlocked = useUnavailableDates(id);
  const unavailableDates = useMemo(() => {
    if (serverBlocked.size === 0) return prefetchedBlocked;
    return new Set<string>([...prefetchedBlocked, ...serverBlocked]);
  }, [prefetchedBlocked, serverBlocked]);

  // The blocked set can arrive AFTER the user has already picked a range
  // (it's fetched in the background). Reconcile whenever it updates: drop a
  // now-invalid stay whose days include a blocked one.
  useEffect(() => {
    if (unavailableDates.size === 0) return;
    setRange((r) => {
      if (!r.start) return r;
      if (unavailableDates.has(dateKey(r.start))) return { start: null, end: null };
      if (r.end && rangeHasBlockedDay(r.start, r.end, unavailableDates)) {
        return { start: r.start, end: null };
      }
      return r;
    });
  }, [unavailableDates]);

  // A start with no chosen end is a single day: end defaults to start.
  const effectiveEnd = range.end ?? range.start;

  // Per-day model: the stay occupies every day from start to end inclusive,
  // so days = (diff + 1) — Sat + Sun = 2 days, a lone start = 1 day.
  const days = useMemo(() => {
    if (!range.start || !effectiveEnd) return 0;
    const ms = effectiveEnd.getTime() - range.start.getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }, [range.start, effectiveEnd]);

  const canSubmit =
    !!range.start &&
    !!effectiveEnd &&
    !rangeHasBlockedDay(range.start, effectiveEnd, unavailableDates);

  const headerSubtitle = useMemo(() => {
    if (range.start && range.end) {
      const sameDate = range.start.toDateString() === range.end.toDateString();
      return sameDate
        ? formatDay(range.start, locale)
        : `${formatDay(range.start, locale)} – ${formatDay(range.end, locale)}`;
    }
    if (range.start) {
      // Single day so far — show the date with a hint that more is optional.
      return `${formatDay(range.start, locale)} · ${t({ ar: 'يوم واحد', en: '1 day' })}`;
    }
    return t({ ar: 'متى تريد تروح؟', en: 'When are you going?' });
  }, [range, locale, t]);

  const onNext = async () => {
    const { start } = range;
    const end = range.end ?? range.start;
    if (!start || !end || quoting) return;
    // Final backstop: never advance a stay that includes a blocked day.
    if (rangeHasBlockedDay(start, end, unavailableDates)) return;

    const checkIn = dateKey(start);
    const checkOut = dateKey(end);

    setError(null);
    setQuoting(true);
    try {
      // Quote is the source of truth for availability + pricing.
      const quote = await fetchQuote(id, checkIn, checkOut);

      if (!quote.bookable) {
        if (!quote.dates_available) {
          // Server marked some requested days blocked — fold them into the
          // calendar so they grey out, and clear the now-invalid end.
          setServerBlocked((prev) => {
            const nextSet = new Set(prev);
            for (const d of quote.unavailable_dates) nextSet.add(d);
            return nextSet;
          });
          setRange((r) => ({ start: r.start, end: null }));
          setError(t({ ar: 'بعض الأيام لم تعد متاحة', en: 'Some days are no longer available' }));
        } else if (!quote.guests_ok) {
          setError(
            t({
              ar: `الحد الأقصى ${quote.max_guests ?? ''} ضيف`,
              en: `Max ${quote.max_guests ?? ''} guests`,
            }),
          );
        } else {
          setError(t({ ar: 'هذه التواريخ غير متاحة', en: 'These dates are not available' }));
        }
        return;
      }

      // Close this date-picker modal, then open the summary as a full page
      // over the listing (instead of stacking it on top of the modal).
      router.back();
      router.push({
        pathname: '/booking/[id]/summary',
        params: { id, checkIn, checkOut },
      });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: 'تعذر إتمام العملية', en: 'Something went wrong' }),
      );
    } finally {
      setQuoting(false);
    }
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
          <View style={styles.headerTitleBlock} pointerEvents="none">
            <ThemedText
              numberOfLines={1}
              style={[
                styles.headerTitle,
                {
                  fontFamily: fontFamilyFor('bold', locale),
                  textAlign: 'center',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {days > 0
                ? `${days} ${t({ ar: days === 1 ? 'يوم' : 'أيام', en: days === 1 ? 'day' : 'days' })}`
                : t({ ar: 'اختر التواريخ', en: 'Pick your dates' })}
            </ThemedText>
            <ThemedText
              numberOfLines={1}
              style={[
                styles.headerSubtitle,
                {
                  fontFamily: fontFamilyFor('regular', locale),
                  textAlign: 'center',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {headerSubtitle}
            </ThemedText>
          </View>
        </View>

        {/* Calendar fills the remaining height */}
        <View style={styles.calendarWrap}>
          <WhenContent
            range={range}
            onChange={setRange}
            unavailableDates={unavailableDates}
          />
        </View>

        {/* Sticky footer */}
        <View
          style={[styles.footer, { paddingBottom: Math.max(Spacing[3], insets.bottom) }]}>
          {error ? (
            <ThemedText
              style={[
                styles.errorText,
                {
                  fontFamily: fontFamilyFor('regular', locale),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}>
              {error}
            </ThemedText>
          ) : null}
          <PressableScale
            haptic="forward"
            scaleTo={0.98}
            disabled={!canSubmit || quoting}
            onPress={onNext}
            style={
              canSubmit && !quoting
                ? styles.nextCta
                : [styles.nextCta, styles.nextCtaDisabled]
            }>
            {quoting ? (
              <Spinner size={20} />
            ) : (
              <ThemedText
                style={[styles.nextCtaText, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {t({ ar: 'التالي', en: 'Next' })}
              </ThemedText>
            )}
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },

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
  headerTitleBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 64,
    gap: 2,
  },
  headerTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: TEXT_SECONDARY,
  },

  calendarWrap: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },

  footer: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
    backgroundColor: '#FFFFFF',
  },
  nextCta: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCtaDisabled: {
    opacity: 0.35,
  },
  nextCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#C53030',
    marginBottom: Spacing[3],
  },
});
