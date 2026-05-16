import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import type { Listing } from '@/data/types';
import { formatMoney } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

interface ListingCardCompactProps {
  listing: Listing;
  width?: number;
}

export function ListingCardCompact({ listing, width = 220 }: ListingCardCompactProps) {
  const t = useT();
  const { locale } = useLocale();
  const { has, toggle } = useLikes();
  const liked = has(listing.id);
  const isSuperhost = listing.rating.average >= 4.9;

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <PressableScale scaleTo={0.98} style={{ width }}>
        <View style={[styles.imageWrap, { width }]}>
          <Image
            source={{ uri: listing.photos[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heart}>
            <IconButton
              name={liked ? 'heart.fill' : 'heart'}
              size={20}
              color={liked ? Colors.light.coral : '#FFFFFF'}
              onPress={() => toggle(listing.id)}
            />
          </View>
          {isSuperhost ? (
            <View style={styles.badge}>
              <ThemedText variant="micro" style={styles.badgeText}>
                🏅
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.meta}>
          <ThemedText variant="bodyMedium" numberOfLines={1}>
            {t(listing.title)}
          </ThemedText>
          <ThemedText variant="caption" tone="muted" numberOfLines={1}>
            {listing.capacity.guests} {t({ ar: 'اشخاص', en: 'guests' })}
            {' · '}
            {listing.capacity.bedrooms} {t({ ar: 'غرف نوم', en: 'bedrooms' })}
          </ThemedText>
          <ThemedText variant="bodyMedium" style={{ marginTop: 2 }}>
            {formatMoney(listing.pricing.nightly, locale)}
          </ThemedText>
        </View>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    aspectRatio: 1,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: { width: '100%', height: '100%' },
  heart: {
    position: 'absolute',
    top: Spacing[2],
    insetInlineStart: Spacing[2],
  },
  badge: {
    position: 'absolute',
    top: Spacing[2],
    insetInlineEnd: Spacing[2],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 16, lineHeight: 18 },
  meta: {
    paddingTop: Spacing[3],
    gap: 2,
  },
});
