import { useEffect, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useSplashGone } from '@/lib/splash-status';

interface EntranceItemProps {
  delay?: number;
  from?: number;
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function EntranceItem({ delay = 0, from = 10, children, style }: EntranceItemProps) {
  const splashGone = useSplashGone();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(from);

  useEffect(() => {
    if (!splashGone) return;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 14, stiffness: 300, mass: 0.6 }),
    );
  }, [splashGone, delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
