import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LikeButton } from '@/components/like-button';
import { PressableScale } from '@/components/pressable-scale';
import { SuperhostBadge } from '@/components/superhost-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import type { Listing } from '@/data/types';
import { formatPriceSR } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

interface ListingCardCompactProps {
  listing: Listing;
}

const CARD_SIZE = 158;

export function ListingCardCompact({ listing }: ListingCardCompactProps) {
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
    fontSize: 12,
    lineHeight: 16,
    color: '#000000',
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    writingDirection: isRTL ? ('rtl' as const) : ('ltr' as const),
  };

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <PressableScale scaleTo={0.98} style={styles.card}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: listing.photos[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heart}>
            <LikeButton liked={liked} onPress={() => toggle(listing.id)} size={30} />
          </View>
          {isSuperhost ? (
            <View style={styles.badge}>
              <SuperhostBadge size={30} />
            </View>
          ) : null}
        </View>

        <View style={styles.meta}>
          <ThemedText
            numberOfLines={1}
            style={[textBase, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {t(listing.title)}
          </ThemedText>
          <ThemedText
            numberOfLines={1}
            style={[textBase, { fontFamily: fontFamilyFor('light', locale) }]}>
            {specs}
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
    paddingTop: Spacing[2],
    gap: 3,
  },
});
