import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';

const PULSE_COLOR = '#E5E7EB';

export function SkeletonCard() {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, animStyle]} />
      <View style={styles.meta}>
        <Animated.View style={[styles.line, styles.lineLarge, animStyle]} />
        <Animated.View style={[styles.line, styles.lineMed, animStyle]} />
        <Animated.View style={[styles.line, styles.lineSmall, animStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing[6],
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    backgroundColor: PULSE_COLOR,
  },
  meta: {
    paddingTop: Spacing[3],
    gap: Spacing[2],
  },
  line: {
    height: 14,
    borderRadius: 4,
    backgroundColor: PULSE_COLOR,
  },
  lineLarge: { width: '72%' },
  lineMed: { width: '50%' },
  lineSmall: { width: '40%' },
});
