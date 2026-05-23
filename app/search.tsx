import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MagnifierIcon } from '@/components/icons/magnifier-icon';
import { PressableScale } from '@/components/pressable-scale';
import { ExpandableCard } from '@/components/search/expandable-card';
import { WhereContent } from '@/components/search/where-content';
import { WhenContent, type DateRange } from '@/components/search/when-content';
import { WhoContent, type GuestCounts } from '@/components/search/who-content';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { fireHaptic } from '@/lib/haptics';
import { useLocale, useT } from '@/lib/i18n';

type CardKey = 'where' | 'when' | 'who';

const DEFAULT_GUESTS: GuestCounts = { total: 5 };

export default function SearchModal() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useT();
  const insets = useSafeAreaInsets();

  const [expanded, setExpanded] = useState<CardKey>('when');
  const [city, setCity] = useState(t({ ar: 'الرياض', en: 'Riyadh' }));
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [guests, setGuests] = useState<GuestCounts>(DEFAULT_GUESTS);
  const [searchFocused, setSearchFocused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const overlay = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    overlay.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 18, stiffness: 220, mass: 0.8 });
  }, [overlay, scale]);

  const close = () => {
    scale.value = withTiming(0.96, { duration: 220, easing: Easing.in(Easing.cubic) });
    overlay.value = withTiming(
      0,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(router.back)();
      },
    );
  };

  const reset = () => {
    fireHaptic('select');
    setCity(t({ ar: 'الرياض', en: 'Riyadh' }));
    setRange({ start: null, end: null });
    setGuests(DEFAULT_GUESTS);
    setSearchFocused(false);
    setExpanded('when');
    setResetKey((k) => k + 1);
  };

  const handleSearch = () => {
    router.replace({
      pathname: '/results',
      params: {
        city,
        startDate: range.start ? range.start.toISOString() : '',
        endDate: range.end ? range.end.toISOString() : '',
        guests: String(guests.total),
      },
    });
  };

  const toggle = (key: CardKey) => {
    setExpanded((prev) => (prev === key ? ('' as unknown as CardKey) : key));
  };

  const guestsLabel = useMemo(() => {
    if (!guests.total) return t({ ar: 'أضف ضيوف', en: 'Add guests' });
    return `${guests.total} ${t({
      ar: guests.total === 1 ? 'ضيف' : 'ضيف',
      en: guests.total === 1 ? 'guest' : 'guests',
    })}`;
  }, [guests, t]);

  const dateLabel = useMemo(() => {
    if (!range.start) return t({ ar: 'اختر التواريخ', en: 'Pick dates' });
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    if (!range.end) {
      return `${fmt(range.start)} — ${t({ ar: 'اختر المغادرة', en: 'Pick check-out' })}`;
    }
    return `${fmt(range.start)} — ${fmt(range.end)}`;
  }, [range, t]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
      <BlurView intensity={90 } tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} pointerEvents="none" />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          fireHaptic('back');
          close();
        }}
      />

      <Animated.View
        style={[
          styles.frame,
          { paddingTop: insets.top + Spacing[3], paddingBottom: insets.bottom + Spacing[3] },
          contentStyle,
        ]}
        pointerEvents="box-none">
          {/* Header: X (start) + calm logo (absolutely centered) */}
          <View style={styles.header} pointerEvents="box-none">
            <PressableScale onPress={close} scaleTo={0.88} haptic="back" style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color={Colors.light.text} />
            </PressableScale>
            <View style={styles.logoCenter} pointerEvents="none">
              <Image
                source={require('@/assets/logo/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
          </View>

          {/* Three stacked cards */}
          <View style={styles.cardsCol}>
            <ExpandableCard
              label={t({ ar: 'وين ؟', en: 'Where?' })}
              value={city}
              expanded={expanded === 'where'}
              edgeToEdge={expanded === 'where' && searchFocused}
              onToggle={() => toggle('where')}>
              <WhereContent
                key={resetKey}
                value={city}
                onChange={setCity}
                onFocusChange={setSearchFocused}
                onConfirm={() => {
                  setSearchFocused(false);
                  setExpanded('when');
                }}
              />
            </ExpandableCard>

            <ExpandableCard
              label={t({ ar: 'متى ؟', en: 'When?' })}
              value={dateLabel}
              expanded={expanded === 'when'}
              onToggle={() => toggle('when')}>
              <WhenContent
                range={range}
                onChange={setRange}
                onConfirm={() => setExpanded('who')}
              />
            </ExpandableCard>

            <ExpandableCard
              label={t({ ar: 'كم شخص ؟', en: 'How many?' })}
              value={guestsLabel}
              expanded={expanded === 'who'}
              onToggle={() => toggle('who')}>
              <WhoContent value={guests} onChange={setGuests} />
            </ExpandableCard>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={reset} hitSlop={Spacing[3]}>
              <ThemedText
                style={[
                  styles.resetText,
                  { fontFamily: fontFamilyFor('medium', locale) },
                ]}>
                {t({ ar: 'امسح الكل', en: 'Clear all' })}
              </ThemedText>
            </Pressable>
            <PressableScale onPress={handleSearch} scaleTo={0.95} haptic="forward" style={styles.searchBtn}>
              <MagnifierIcon size={16} color="#FFFFFF" />
              <ThemedText
                style={[
                  styles.searchText,
                  { fontFamily: fontFamilyFor('bold', locale) },
                ]}>
                {t({ ar: 'ابحث', en: 'Search' })}
              </ThemedText>
            </PressableScale>
          </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  frame: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },
  header: {
    height: 48,
    justifyContent: 'center',
    paddingBottom: Spacing[4],
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
    alignSelf: 'flex-start',
  },
  logoCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 80, height: 32 },

  cardsCol: {
    flex: 1,
    gap: Spacing[3],
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
  },
  resetText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    textDecorationLine: 'underline',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: Colors.light.coral,
    shadowColor: Colors.light.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  searchText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
});
