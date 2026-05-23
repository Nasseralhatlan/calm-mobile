import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { HeartIcon } from '@/components/icons/heart-icon';
import { ThemedText } from '@/components/themed-text';
import { Colors, fontFamilyFor } from '@/constants/theme';
import { useLocale } from '@/lib/i18n';

interface AvatarStackProps {
  avatars: string[];
  count: number;
  size?: number;
}

export function AvatarStack({ avatars, count, size = 28 }: AvatarStackProps) {
  const { locale } = useLocale();
  const overlap = Math.round(size * 0.32);
  const shown = avatars.slice(0, 3);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {shown.map((url, i) => (
          <View
            key={`${url}-${i}`}
            style={[
              styles.avatarRing,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                marginStart: i === 0 ? 0 : -overlap,
                zIndex: shown.length - i,
              },
            ]}>
            <Image
              source={{ uri: url }}
              style={[
                styles.avatar,
                { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 },
              ]}
              contentFit="cover"
              transition={200}
            />
          </View>
        ))}
      </View>
      <View style={styles.countRow}>
        <HeartIcon size={12} stroke={Colors.light.coral} fill={Colors.light.coral} strokeWidth={1.8} />
        <ThemedText
          style={[styles.countText, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {count}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    backgroundColor: '#F3F4F6',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#000000',
  },
});
