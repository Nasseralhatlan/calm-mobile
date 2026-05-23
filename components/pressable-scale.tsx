import { forwardRef, type ReactNode } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Springs } from '@/constants/theme';
import { fireHaptic, type HapticKind } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  scaleTo?: number;
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  haptic?: HapticKind;
}

export const PressableScale = forwardRef<typeof AnimatedPressable, PressableScaleProps>(
  function PressableScale(
    { scaleTo = 0.96, onPress, onPressIn, onPressOut, style, children, haptic = 'tap', disabled, ...rest },
    _ref,
  ) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const handlePress = (e: GestureResponderEvent) => {
      if (disabled) return;
      fireHaptic(haptic);
      onPress?.(e);
    };

    return (
      <AnimatedPressable
        disabled={disabled}
        onPress={onPress ? handlePress : undefined}
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
