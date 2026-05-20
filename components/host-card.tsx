import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { SuperhostBadge } from '@/components/superhost-badge';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import type { Host } from '@/data/types';
import { useLocale, useT } from '@/lib/i18n';

interface HostCardProps {
  host: Host;
  onPress?: () => void;
}

export function HostCard({ host, onPress }: HostCardProps) {
  const { locale } = useLocale();
  const t = useT();
  const joinedYear = new Date(host.joinedAt).getFullYear();

  return (
    <PressableScale scaleTo={0.985} onPress={onPress} style={styles.wrap}>
      <Image source={{ uri: host.avatarUrl }} style={styles.avatar} contentFit="cover" />
      <View style={styles.col}>
        <View style={styles.titleRow}>
          <ThemedText
            style={[styles.name, { fontFamily: fontFamilyFor('bold', locale) }]}
            numberOfLines={1}>
            {t(host.name)}
          </ThemedText>
          {host.isSuperHost ? <SuperhostBadge size={26} /> : null}
        </View>
        <ThemedText
          style={[styles.meta, { fontFamily: fontFamilyFor('regular', locale) }]}>
          {t({ ar: 'مضيف منذ', en: 'Host since' })} {joinedYear}
          {' · '}
          {host.responseRate}% {t({ ar: 'معدل الرد', en: 'response rate' })}
        </ThemedText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  col: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  name: {
    fontSize: 16,
    lineHeight: 20,
    color: Colors.light.text,
    flexShrink: 1,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textMuted,
  },
});
