import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LikeButton } from '@/components/like-button';
import { PressableScale } from '@/components/pressable-scale';
import { SuperhostBadge } from '@/components/superhost-badge';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import type { Listing } from '@/data/types';
import { formatPriceSR } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const { has, toggle } = useLikes();
  const liked = has(listing.id);
  const isSuperhost = listing.rating.average >= 4.9;

  const numFmt = useMemo(
    () => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US'),
    [locale],
  );

  const specs = `${numFmt.format(listing.capacity.guests)} ${t({ ar: 'اشخاص', en: 'guests' })} . ${numFmt.format(listing.capacity.bedrooms)} ${t({ ar: 'غرف نوم', en: 'bedrooms' })}`;
  const price = formatPriceSR(listing.pricing.nightly);

  const textBase = {
    color: '#000000',
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    writingDirection: isRTL ? ('rtl' as const) : ('ltr' as const),
  };

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <PressableScale scaleTo={0.985} style={styles.card}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: listing.photos[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heart}>
            <LikeButton liked={liked} onPress={() => toggle(listing.id)} size={32} />
          </View>
          {isSuperhost ? (
            <View style={styles.badge}>
              <SuperhostBadge size={32} />
            </View>
          ) : null}
        </View>

        <View style={styles.meta}>
          <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <ThemedText
              numberOfLines={1}
              style={[styles.title, textBase, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t(listing.title)}
            </ThemedText>
            <View style={[styles.rating, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <IconSymbol name="star.fill" size={13} color={Colors.light.text} />
              <ThemedText
                style={[styles.ratingText, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {' '}
                {listing.rating.average.toFixed(1)}
                <ThemedText
                  style={[styles.ratingCount, { fontFamily: fontFamilyFor('regular', locale) }]}>
                  {' '}
                  ({listing.rating.count})
                </ThemedText>
              </ThemedText>
            </View>
          </View>

          <ThemedText
            numberOfLines={1}
            style={[styles.description, textBase, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {t(listing.description)}
          </ThemedText>

          <ThemedText
            numberOfLines={1}
            style={[styles.specs, textBase, { fontFamily: fontFamilyFor('light', locale) }]}>
            {specs}
          </ThemedText>

          <ThemedText
            numberOfLines={1}
            style={[styles.price, textBase, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {price}
          </ThemedText>
        </View>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing[6],
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heart: {
    position: 'absolute',
    top: Spacing[3],
    insetInlineStart: Spacing[3],
  },
  badge: {
    position: 'absolute',
    top: Spacing[3],
    insetInlineEnd: Spacing[3],
  },
  meta: {
    paddingTop: Spacing[3],
    gap: 4,
  },
  titleRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  rating: {
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#000000',
  },
  ratingCount: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textMuted,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textMuted,
  },
  specs: {
    fontSize: 13,
    lineHeight: 18,
  },
  price: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});
