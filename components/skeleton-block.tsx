import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const PULSE = '#E5E7EB';

/** A single pulsing grey block — compose these into skeleton layouts. */
export function SkeletonBlock({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.block, style, anim]} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: PULSE, borderRadius: 8 },
});
