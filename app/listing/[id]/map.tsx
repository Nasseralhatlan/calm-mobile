import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BlurredModalShell } from '@/components/blurred-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { getListing } from '@/data/listings';
import type { Coordinates } from '@/data/types';
import { useLocale, useT } from '@/lib/i18n';

function bigStaticMapUrl({ lat, lng }: Coordinates) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=800x1200&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
}

export default function MapModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const t = useT();
  const listing = getListing(id);

  return (
    <BlurredModalShell title={t({ ar: 'الموقع', en: 'Location' })}>
      {listing ? (
        <View style={styles.wrap}>
          <Image
            source={{ uri: bigStaticMapUrl(listing.coordinates) }}
            style={styles.map}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.caption}>
            <ThemedText
              style={[styles.captionText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              📍 {t(listing.city)} · {t(listing.region)}
            </ThemedText>
          </View>
        </View>
      ) : null}
    </BlurredModalShell>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  map: { flex: 1 },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  captionText: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
});
