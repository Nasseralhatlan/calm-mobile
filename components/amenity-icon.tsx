import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { AmenityId } from '@/data/types';

const EMOJI: Record<AmenityId, string> = {
  wifi: '🛜',
  pool: '🏊',
  kitchen: '🍳',
  parking: '🅿️',
  ac: '❄️',
  bbq: '🍖',
  sound_system: '🔊',
  tv: '📺',
  private_entrance: '🚪',
  majlis: '🛋️',
  kids_area: '🧸',
  prayer_room: '🕌',
};

interface AmenityIconProps {
  id: AmenityId;
  size?: number;
}

export function AmenityIcon({ id, size = 22 }: AmenityIconProps) {
  return (
    <ThemedText style={[styles.emoji, { fontSize: size, lineHeight: size + 2 }]}>
      {EMOJI[id]}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});
