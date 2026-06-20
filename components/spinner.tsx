import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SpinnerProps {
  /** Outer diameter in px. */
  size?: number;
  /** Color of the rotating arc. */
  color?: string;
  /** Color of the faint full ring behind the arc. */
  trackColor?: string;
  /** Ring thickness. Defaults to ~12% of size. */
  thickness?: number;
}

/**
 * Thin rotating-ring loading indicator — a faint full circle with one solid
 * arc that spins. The app's single loading style; use everywhere instead of
 * ActivityIndicator. On dark surfaces use the white default; on light ones
 * pass a dark `color`.
 */
export function Spinner({
  size = 18,
  color = '#FFFFFF',
  trackColor = 'rgba(255,255,255,0.3)',
  thickness,
}: SpinnerProps) {
  const rotation = useSharedValue(0);
  const border = thickness ?? Math.max(2, Math.round(size * 0.12));

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 750, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: trackColor,
          borderTopColor: color,
        },
        animStyle,
      ]}
    />
  );
}
