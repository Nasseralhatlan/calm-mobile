import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import type { Coordinates } from '@/data/types';
import { useLocale, useT } from '@/lib/i18n';

interface MapPreviewProps {
  coordinates: Coordinates;
  cityLabel: string;
  onPress?: () => void;
  showOverlay?: boolean;
  height?: number;
}

function staticMapUrl({ lat, lng }: Coordinates) {
  // OpenStreetMap-based static map (no API key). Mocked for v1; swap to Mapbox/Google in prod.
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=1200x900&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
}

export function MapPreview({
  coordinates,
  cityLabel,
  onPress,
  showOverlay = true,
  height = 180,
}: MapPreviewProps) {
  const { locale } = useLocale();
  const t = useT();
  return (
    <PressableScale scaleTo={0.985} onPress={onPress} style={[styles.wrap, { height }]}>
      <Image
        source={{ uri: staticMapUrl(coordinates) }}
        style={styles.map}
        contentFit="cover"
        transition={200}
      />
      {showOverlay ? (
        <View style={styles.overlay}>
          <ThemedText
            style={[styles.location, { fontFamily: fontFamilyFor('bold', locale) }]}>
            📍 {cityLabel}
          </ThemedText>
          <ThemedText
            style={[styles.cta, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {t({ ar: 'اعرض الخريطة', en: 'View map' })}
          </ThemedText>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.text,
  },
  cta: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.coral,
  },
});
