import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LikeButton } from '@/components/like-button';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import type { ApiPlace } from '@/lib/api';
import { formatSarInt } from '@/lib/format';
import { useLocale } from '@/lib/i18n';

interface PlaceCardCompactProps {
  place: ApiPlace;
}

const CARD_SIZE = 158;

function PlaceCardCompactBase({ place }: PlaceCardCompactProps) {
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const { isLiked, toggle } = useLikes();
  const liked = isLiked(place.id, place.is_liked);

  const imageUrl = place.cover_photo_url ?? place.photos?.[0]?.url ?? null;
  const cityName = locale === 'ar' ? place.city.name_ar : place.city.name_en;
  const areaName = place.city_area
    ? locale === 'ar'
      ? place.city_area.name_ar
      : place.city_area.name_en
    : null;
  const location = areaName ? `${areaName} · ${cityName}` : cityName;
  const price = formatSarInt(place.price);

  const textBase = {
    fontSize: 12,
    lineHeight: 16,
    color: '#000000',
    textAlign: 'left' as const,
    writingDirection: isRTL ? ('rtl' as const) : ('ltr' as const),
  };

  return (
    <Link href={`/listing/${place.id}`} asChild>
      <PressableScale scaleTo={0.98} haptic="forward" style={styles.card}>
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              recyclingKey={imageUrl}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.imageFallback}>
              <ThemedText style={styles.fallbackIcon}>{place.type.icon}</ThemedText>
            </View>
          )}
          <View style={styles.heart}>
            <LikeButton liked={liked} onPress={() => toggle(place.id, liked)} size={30} />
          </View>
        </View>

        <View style={styles.meta}>
          <ThemedText
            numberOfLines={1}
            style={[textBase, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {place.title}
          </ThemedText>
          <ThemedText
            numberOfLines={1}
            style={[textBase, { fontFamily: fontFamilyFor('light', locale) }]}>
            {location}
          </ThemedText>
          <ThemedText
            numberOfLines={1}
            style={[textBase, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {price}
          </ThemedText>
        </View>
      </PressableScale>
    </Link>
  );
}

export const PlaceCardCompact = memo(PlaceCardCompactBase);

const styles = StyleSheet.create({
  card: { width: CARD_SIZE },
  imageWrap: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  fallbackIcon: { fontSize: 48, lineHeight: 52 },
  heart: {
    position: 'absolute',
    top: Spacing[3],
    insetInlineStart: Spacing[3],
  },
  meta: {
    paddingTop: Spacing[2],
    gap: 3,
  },
});
