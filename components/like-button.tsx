import { StyleSheet } from 'react-native';

import { HeartIcon } from '@/components/icons/heart-icon';
import { PressableScale } from '@/components/pressable-scale';
import { Colors } from '@/constants/theme';

interface LikeButtonProps {
  liked: boolean;
  onPress: () => void;
  size?: number;
  iconScale?: number;
}

export function LikeButton({ liked, onPress, size = 30, iconScale = 0.73 }: LikeButtonProps) {
  const iconSize = Math.round(size * iconScale);

  return (
    <PressableScale
      scaleTo={0.86}
      onPress={onPress}
      hitSlop={10}
      style={[styles.wrap, { width: size, height: size }]}>
      <HeartIcon
        size={iconSize}
        stroke="#FFFFFF"
        fill={liked ? Colors.light.coral : 'rgba(0, 0, 0, 0.45)'}
        strokeWidth={1.8}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
