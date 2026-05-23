import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
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

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { fireHaptic } from '@/lib/haptics';
import { useLocale } from '@/lib/i18n';

interface BlurredModalShellProps {
  title: string;
  children: ReactNode;
}

export function BlurredModalShell({ title, children }: BlurredModalShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();

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

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
      <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
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
          styles.content,
          { paddingTop: insets.top + Spacing[3], paddingBottom: insets.bottom + Spacing[3] },
          contentStyle,
        ]}
        pointerEvents="box-none">
        <View style={styles.headerRow} pointerEvents="box-none">
          <PressableScale onPress={close} scaleTo={0.88} haptic="back" style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.titleWrap}>
            <ThemedText
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}
              numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
          <View style={styles.closeBtn} />
        </View>
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  content: {
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
  title: { fontSize: 18, lineHeight: 24, color: Colors.light.text },
  body: { flex: 1 },
});
