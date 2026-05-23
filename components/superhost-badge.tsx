import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

import { LaurelIcon } from '@/components/icons/laurel-icon';

interface SuperhostBadgeProps {
  size?: number;
  color?: string;
}

const GOLD = '#F1C40F';

export function SuperhostBadge({ size = 30, color = GOLD }: SuperhostBadgeProps) {
  const iconSize = Math.round(size * 0.62);
  return (
    <View
      style={[
        styles.clip,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={[styles.tint, { borderRadius: size / 2 }]} />
      <LaurelIcon size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
