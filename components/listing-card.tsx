import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { PriceBlock } from '@/components/price-block';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import type { Listing } from '@/data/types';
import { useT } from '@/lib/i18n';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const t = useT();
  const { has, toggle } = useLikes();
  const liked = has(listing.id);

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
            <IconButton
              name={liked ? 'heart.fill' : 'heart'}
              size={22}
              color={liked ? Colors.light.coral : '#FFFFFF'}
              onPress={() => toggle(listing.id)}
            />
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.row}>
            <ThemedText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
              {t(listing.title)}
            </ThemedText>
            <View style={styles.rating}>
              <IconSymbol name="star.fill" size={13} color={Colors.light.text} />
              <ThemedText variant="callout" style={{ marginStart: 4 }}>
                {listing.rating.average.toFixed(2)}
              </ThemedText>
            </View>
          </View>

          <ThemedText variant="body" tone="muted" numberOfLines={1}>
            {t(listing.city)} · {t(listing.region)}
          </ThemedText>

          <ThemedText variant="caption" tone="muted">
            {listing.capacity.guests} {t({ ar: 'ضيف', en: 'guests' })}
          </ThemedText>

          <View style={{ marginTop: Spacing[1] }}>
            <PriceBlock halalas={listing.pricing.nightly} />
          </View>
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
    aspectRatio: 1,
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
    top: Spacing[2],
    right: Spacing[2],
  },
  meta: {
    paddingTop: Spacing[3],
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
