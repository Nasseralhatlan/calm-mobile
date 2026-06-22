import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { memo, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

const AnimatedGHScrollView = Animated.createAnimatedComponent(GHScrollView);

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

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = SCREEN_W - Spacing[5] * 2;

interface ListingCardProps {
  listing: Listing;
  startDate?: string;
  endDate?: string;
}

function ListingCardBase({ listing, startDate, endDate }: ListingCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const { isLiked, toggle } = useLikes();
  const liked = isLiked(listing.id, listing.isLiked);
  const isSuperhost = listing.rating.average >= 4.9;

  // Area first, then the guest count — the number is always Latin digits, the
  // word stays localized ("3 guests" / "3 ضيوف").
  const areaLabel = t(listing.region).trim();
  const guestsLabel =
    listing.capacity.guests > 0
      ? `${listing.capacity.guests} ${t({ ar: 'ضيوف', en: 'guests' })}`
      : '';
  const specs = [areaLabel, guestsLabel].filter(Boolean).join(' · ');
  const price = formatPriceSR(listing.pricing.nightly);

  const textBase = {
    color: '#000000',
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    writingDirection: isRTL ? ('rtl' as const) : ('ltr' as const),
  };

  return (
    <Link
      href={{
        pathname: '/listing/[id]',
        params: {
          id: listing.id,
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      }}
      asChild>
      <PressableScale
        scaleTo={0.985}
        haptic="forward"
        unstable_pressDelay={120}
        style={styles.card}>
        <PhotoCarousel
          photos={listing.photos}
          liked={liked}
          onToggleLike={() => toggle(listing.id, liked)}
          isSuperhost={isSuperhost}
        />

        <View style={styles.meta}>
          <View style={[styles.titleRow, { flexDirection: 'row' }]}>
            <ThemedText
              numberOfLines={1}
              style={[styles.title, textBase, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t(listing.title)}
            </ThemedText>
            <View style={[styles.rating, { flexDirection: 'row' }]}>
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

          {specs ? (
            <ThemedText
              numberOfLines={1}
              style={[styles.specs, textBase, { fontFamily: fontFamilyFor('light', locale) }]}>
              {specs}
            </ThemedText>
          ) : null}

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

// Memoized so recycled FlashList rows don't re-render unless their listing changes.
export const ListingCard = memo(ListingCardBase);

function PhotoCarousel({
  photos,
  liked,
  onToggleLike,
  isSuperhost,
}: {
  photos: string[];
  liked: boolean;
  onToggleLike: () => void;
  isSuperhost: boolean;
}) {
  const [width, setWidth] = useState(DEFAULT_CARD_WIDTH);
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<GHScrollView>(null);
  // |x| so the active page is correct whether the scroll origin is LTR or RTL.
  const pageIndex = useDerivedValue(() =>
    width > 0 ? Math.round(Math.abs(scrollX.value) / width) : 0,
  );

  // FlashList recycles this cell for different listings — when the photos change
  // (a recycle), snap back to the first photo so the dots don't inherit the
  // previous card's scroll position.
  useEffect(() => {
    scrollX.value = 0;
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  return (
    <View
      style={styles.imageWrap}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && w !== width) setWidth(w);
      }}>
      <AnimatedGHScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces
        alwaysBounceHorizontal>
        {/* Render all photos — a listing has only a handful, and gating mounts on
            a scroll-derived index breaks under RTL (the offset reverses). */}
        {photos.map((url) => (
          <Image
            key={url}
            source={{ uri: url }}
            recyclingKey={url}
            style={[styles.image, { width }]}
            contentFit="cover"
            transition={200}
          />
        ))}
      </AnimatedGHScrollView>

      <View style={styles.heart}>
        <LikeButton liked={liked} onPress={onToggleLike} size={32} />
      </View>
      {isSuperhost ? (
        <View style={styles.badge}>
          <SuperhostBadge size={32} />
        </View>
      ) : null}

      {photos.length > 1 ? (
        <View style={styles.dotsWrap} pointerEvents="none">
          {photos.map((_, i) => (
            <Dot key={i} index={i} pageIndex={pageIndex} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Dot({ index, pageIndex }: { index: number; pageIndex: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const active = pageIndex.value === index;
    return {
      width: active ? 14 : 5,
      opacity: active ? 1 : 0.55,
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
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
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#F3F4F6',
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
  dotsWrap: {
    position: 'absolute',
    bottom: Spacing[3],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
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
