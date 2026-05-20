import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

function SlideUpIn({
  delay = 0,
  from = 14,
  children,
  style,
}: {
  delay?: number;
  from?: number;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(from);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 14, stiffness: 280, mass: 0.7 }),
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export default function SearchModal() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();

  const overlay = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    overlay.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 18, stiffness: 220, mass: 0.8 });
  }, [overlay, scale]);

  const close = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scale.value = withTiming(0.96, { duration: 240, easing: Easing.in(Easing.cubic) });
    overlay.value = withTiming(
      0,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(router.back)();
      },
    );
  };

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
      <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} pointerEvents="none" />

      <Pressable style={StyleSheet.absoluteFill} onPress={close} />

      <Animated.View
        style={[
          styles.contentLayer,
          { paddingTop: insets.top + Spacing[3], paddingBottom: insets.bottom + Spacing[3] },
          contentStyle,
        ]}
        pointerEvents="box-none">
        <View style={styles.headerRow} pointerEvents="box-none">
          <SlideUpIn delay={0}>
            <PressableScale onPress={close} scaleTo={0.88} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color="#1A1A1A" />
            </PressableScale>
          </SlideUpIn>
          <SlideUpIn delay={40} style={styles.titleWrap}>
            <ThemedText
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'بحث جديد', en: 'New search' })}
            </ThemedText>
          </SlideUpIn>
          <View style={styles.closeBtn} />
        </View>

        <View style={styles.body} pointerEvents="box-none">
          <SlideUpIn delay={100}>
            <Pressable style={styles.searchField}>
              <IconSymbol name="magnifyingglass" size={18} color={Colors.light.textMuted} />
              <ThemedText
                style={[
                  styles.searchPlaceholder,
                  { fontFamily: fontFamilyFor('regular', locale) },
                ]}>
                {t({ ar: 'إلى أين تخطط؟', en: 'Where are you headed?' })}
              </ThemedText>
            </Pressable>
          </SlideUpIn>

          <View style={styles.row}>
            <SlideUpIn delay={160} style={styles.chipWrap}>
              <FloatingChip label={t({ ar: 'التاريخ', en: 'Dates' })} icon="calendar" />
            </SlideUpIn>
            <SlideUpIn delay={210} style={styles.chipWrap}>
              <FloatingChip
                label={t({ ar: 'الضيوف', en: 'Guests' })}
                icon="person.crop.circle"
              />
            </SlideUpIn>
          </View>

          <SlideUpIn delay={280}>
            <ThemedText variant="caption" tone="muted" style={styles.hint}>
              {t({ ar: 'اضغط خارج البطاقات للإغلاق', en: 'Tap outside to close' })}
            </ThemedText>
          </SlideUpIn>
        </View>

        <SlideUpIn delay={340} from={20}>
          <PressableScale onPress={close} scaleTo={0.96} style={styles.ctaPrimary}>
            <ThemedText
              style={[styles.ctaText, { fontFamily: fontFamilyFor('medium', locale) }]}>
              {t({ ar: 'ابحث', en: 'Search' })}
            </ThemedText>
          </PressableScale>
        </SlideUpIn>
      </Animated.View>
    </Animated.View>
  );
}

function FloatingChip({
  label,
  icon,
}: {
  label: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
}) {
  const { locale } = useLocale();
  return (
    <PressableScale scaleTo={0.96} style={styles.chip}>
      <IconSymbol name={icon} size={16} color="#1A1A1A" />
      <ThemedText
        style={[styles.chipText, { fontFamily: fontFamilyFor('medium', locale) }]}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  contentLayer: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing[5],
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, lineHeight: 24, color: '#1A1A1A' },
  body: {
    flex: 1,
    gap: Spacing[3],
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderRadius: 18,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  searchPlaceholder: { fontSize: 16, color: '#6B7280', flex: 1 },
  row: { flexDirection: 'row', gap: Spacing[3] },
  chipWrap: { flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: 14,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chipText: { fontSize: 13, color: '#1A1A1A' },
  hint: { textAlign: 'center', marginTop: Spacing[4] },
  ctaPrimary: {
    backgroundColor: Colors.light.coral,
    paddingVertical: Spacing[4],
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: Colors.light.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: { fontSize: 16, color: '#FFFFFF' },
});
