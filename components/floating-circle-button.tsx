import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import type { HapticKind } from '@/lib/haptics';

interface FloatingCircleButtonProps {
  onPress?: () => void;
  size?: number;
  children: React.ReactNode;
  style?: ViewStyle;
  haptic?: HapticKind;
}

export function FloatingCircleButton({
  onPress,
  size = 38,
  children,
  style,
  haptic = 'tap',
}: FloatingCircleButtonProps) {
  const merged: ViewStyle[] = [
    styles.wrap,
    { width: size, height: size, borderRadius: size / 2 },
    ...(style ? [style] : []),
  ];
  return (
    <PressableScale onPress={onPress} scaleTo={0.88} haptic={haptic} style={merged}>
      <BlurView
        intensity={30}
        tint="light"
        style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
      />
      <View style={[styles.tint, { borderRadius: size / 2 }]} />
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
