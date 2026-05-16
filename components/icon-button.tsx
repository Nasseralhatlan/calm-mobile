import { type ComponentProps } from 'react';
import { type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

interface IconButtonProps {
  name: ComponentProps<typeof IconSymbol>['name'];
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  hitSlop?: number;
  style?: ViewStyle;
}

export function IconButton({
  name,
  onPress,
  size = 22,
  color = Colors.light.text,
  bg = 'transparent',
  hitSlop = 8,
  style,
}: IconButtonProps) {
  const dim = size + 18;
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={hitSlop}
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        ...style,
      }}>
      <IconSymbol name={name} size={size} color={color} />
    </PressableScale>
  );
}
