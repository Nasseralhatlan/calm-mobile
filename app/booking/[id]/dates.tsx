import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { WhenContent, type DateRange } from '@/components/search/when-content';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
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

  const nights = useMemo(() => {
    if (!range.start || !range.end) return 0;
    const ms = range.end.getTime() - range.start.getTime();
    return Math.max(1, Math.round(ms / 86_400_000));
  }, [range.start, range.end]);

  const canSubmit = !!range.start && !!range.end;

  const headerSubtitle = useMemo(() => {
    if (range.start && range.end) {
      return `${formatDay(range.start, locale)} – ${formatDay(range.end, locale)}`;
    }
    if (range.start) {
      return `${formatDay(range.start, locale)} – ${t({ ar: 'اختر المغادرة', en: 'Pick check-out' })}`;
    }
    return t({ ar: 'متى تريد تروح؟', en: 'When are you going?' });
  }, [range, locale, t]);

  const onNext = () => {
    if (!canSubmit) return;
    router.replace({
      pathname: '/booking/[id]/services',
      params: {
        id,
        startDate: range.start!.toISOString(),
        endDate: range.end!.toISOString(),
      },
    });
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
              {nights > 0
                ? `${nights} ${t({ ar: nights === 1 ? 'ليلة' : 'ليالٍ', en: nights === 1 ? 'night' : 'nights' })}`
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
          <WhenContent range={range} onChange={setRange} />
        </View>

        {/* Sticky footer */}
        <View
          style={[styles.footer, { paddingBottom: Math.max(Spacing[3], insets.bottom) }]}>
          <PressableScale
            haptic="forward"
            scaleTo={0.98}
            disabled={!canSubmit}
            onPress={onNext}
            style={canSubmit ? styles.nextCta : [styles.nextCta, styles.nextCtaDisabled]}>
            <ThemedText
              style={[styles.nextCtaText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'التالي', en: 'Next' })}
            </ThemedText>
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

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
});
