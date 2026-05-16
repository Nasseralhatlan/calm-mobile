import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { PriceBlock } from '@/components/price-block';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AMENITIES } from '@/data/amenities';
import { getHost } from '@/data/hosts';
import { useLikes } from '@/data/likes';
import { getListing } from '@/data/listings';
import { getReviewsForListing } from '@/data/reviews';
import { useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_W * 0.95;

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const router = useRouter();
  const { has, toggle } = useLikes();
  const [page, setPage] = useState(0);

  const listing = getListing(id);
  if (!listing) {
    return (
      <SafeAreaView style={styles.notFound}>
        <ThemedText variant="heading">Listing not found</ThemedText>
      </SafeAreaView>
    );
  }

  const host = getHost(listing.hostId);
  const reviews = getReviewsForListing(listing.id);
  const liked = has(listing.id);

  const onScrollPhotos = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating top controls */}
      <SafeAreaView style={styles.topControls} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <IconButton
            name="chevron.left"
            size={20}
            color="#1A1A1A"
            bg="#FFFFFF"
            onPress={() => router.back()}
          />
          <View style={{ flex: 1 }} />
          <IconButton
            name="square.and.arrow.up"
            size={18}
            color="#1A1A1A"
            bg="#FFFFFF"
            onPress={() => {}}
          />
          <View style={{ width: Spacing[2] }} />
          <IconButton
            name={liked ? 'heart.fill' : 'heart'}
            size={20}
            color={liked ? Colors.light.coral : '#1A1A1A'}
            bg="#FFFFFF"
            onPress={() => toggle(listing.id)}
          />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero gallery */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollPhotos}
            scrollEventThrottle={32}>
            {listing.photos.map((url, i) => (
              <Image
                key={i}
                source={{ uri: url }}
                style={styles.hero}
                contentFit="cover"
                transition={200}
              />
            ))}
          </ScrollView>
          <View style={styles.pageDots}>
            {listing.photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { opacity: page === i ? 1 : 0.5, width: page === i ? 6 : 5, height: page === i ? 6 : 5 },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Title + meta */}
        <View style={styles.section}>
          <ThemedText variant="title">{t(listing.title)}</ThemedText>
          <View style={styles.metaRow}>
            <IconSymbol name="star.fill" size={14} color={Colors.light.text} />
            <ThemedText variant="callout">
              {' '}
              {listing.rating.average.toFixed(2)}
            </ThemedText>
            <ThemedText variant="callout" tone="muted">
              {' '}
              · {listing.rating.count} {t({ ar: 'تقييم', en: 'reviews' })}
            </ThemedText>
            <ThemedText variant="callout" tone="muted">
              {' '}
              · {t(listing.city)}
            </ThemedText>
          </View>
          <View style={styles.capacityRow}>
            <ThemedText variant="body">
              {listing.capacity.guests} {t({ ar: 'ضيف', en: 'guests' })} · {listing.capacity.bedrooms}{' '}
              {t(STR.listing.bedrooms)} · {listing.capacity.bathrooms} {t(STR.listing.bathrooms)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Host strip */}
        {host ? (
          <>
            <View style={styles.section}>
              <View style={styles.hostRow}>
                <Image source={{ uri: host.avatarUrl }} style={styles.hostAvatar} />
                <View style={{ marginStart: Spacing[3], flex: 1 }}>
                  <ThemedText variant="bodyMedium">
                    {t(STR.listing.hostedBy)} {t(host.name)}
                  </ThemedText>
                  {host.isSuperHost ? (
                    <ThemedText variant="caption" tone="muted">
                      ★ {t(STR.listing.superhost)}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        {/* Description */}
        <View style={styles.section}>
          <ThemedText variant="heading">{t(STR.listing.description)}</ThemedText>
          <ThemedText variant="body" style={{ marginTop: Spacing[3] }}>
            {t(listing.description)}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        {/* Amenities */}
        <View style={styles.section}>
          <ThemedText variant="heading">{t(STR.listing.amenities)}</ThemedText>
          <View style={styles.amenitiesGrid}>
            {listing.amenities.map((aid) => (
              <View key={aid} style={styles.amenityRow}>
                <ThemedText variant="body">• {t(AMENITIES[aid].label)}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Reviews preview */}
        {reviews.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.metaRow}>
              <IconSymbol name="star.fill" size={16} color={Colors.light.text} />
              <ThemedText variant="heading">
                {' '}
                {listing.rating.average.toFixed(2)} · {listing.rating.count}{' '}
                {t({ ar: 'تقييم', en: 'reviews' })}
              </ThemedText>
            </View>
            {reviews.slice(0, 2).map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: r.authorAvatarUrl }} style={styles.reviewAvatar} />
                  <View style={{ marginStart: Spacing[3] }}>
                    <ThemedText variant="bodyMedium">{t(r.authorName)}</ThemedText>
                    <ThemedText variant="caption" tone="muted">
                      {'★'.repeat(r.rating)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText variant="body" style={{ marginTop: Spacing[2] }}>
                  {t(r.text)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Reserve bar */}
      <SafeAreaView style={styles.reserveBar} edges={['bottom']}>
        <View style={styles.reserveInner}>
          <View style={{ flex: 1 }}>
            <PriceBlock halalas={listing.pricing.nightly} size="lg" />
          </View>
          <Button
            label={t(STR.listing.reserve)}
            size="lg"
            onPress={() => router.push(`/listing/${listing.id}/reserve`)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
  },
  hero: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
    backgroundColor: '#F3F4F6',
  },
  pageDots: {
    position: 'absolute',
    bottom: Spacing[3],
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[6],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  capacityRow: {
    marginTop: Spacing[1],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
    marginHorizontal: Spacing[5],
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  amenitiesGrid: {
    marginTop: Spacing[3],
    gap: Spacing[2],
  },
  amenityRow: {
    paddingVertical: Spacing[1],
  },
  reviewCard: {
    marginTop: Spacing[4],
    padding: Spacing[4],
    backgroundColor: '#FAFAFA',
    borderRadius: Radius.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  reserveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  reserveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
});
