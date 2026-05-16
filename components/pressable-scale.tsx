import { forwardRef, type ReactNode } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Springs } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  scaleTo?: number;
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const PressableScale = forwardRef<typeof AnimatedPressable, PressableScaleProps>(
  function PressableScale({ scaleTo = 0.96, onPressIn, onPressOut, style, children, ...rest }, _ref) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <AnimatedPressable
        onPressIn={(e) => {
          scale.value = withSpring(scaleTo, Springs.bouncy);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, Springs.bouncy);
          onPressOut?.(e);
        }}
        style={[animatedStyle, style]}
        {...rest}>
        {children}
      </AnimatedPressable>
    );
  },
);
