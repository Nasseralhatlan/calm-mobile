import { useEffect, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedFieldProps {
  focused: boolean;
  style: ViewStyle | ViewStyle[];
  children: ReactNode;
}

export function AnimatedField({ focused, style, children }: AnimatedFieldProps) {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused, focus]);

  const animStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      ['rgba(0,0,0,0)', '#000000'],
    ),
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
