import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { amenityEmoji } from '@/data/amenities';
import type { AmenityId } from '@/data/types';

interface AmenityIconProps {
  id: AmenityId;
  size?: number;
}

export function AmenityIcon({ id, size = 22 }: AmenityIconProps) {
  return (
    <ThemedText
      style={[
        styles.emoji,
        { fontSize: size, lineHeight: size * 1.4, width: size * 1.5 },
      ]}>
      {amenityEmoji(id)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});
