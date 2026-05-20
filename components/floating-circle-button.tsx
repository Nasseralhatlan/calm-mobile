import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';

interface FloatingCircleButtonProps {
  onPress?: () => void;
  size?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FloatingCircleButton({
  onPress,
  size = 38,
  children,
  style,
}: FloatingCircleButtonProps) {
  const merged: ViewStyle[] = [
    styles.wrap,
    { width: size, height: size, borderRadius: size / 2 },
    ...(style ? [style] : []),
  ];
  return (
    <PressableScale onPress={onPress} scaleTo={0.88} style={merged}>
      <BlurView
        intensity={70}
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});
