import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmenitiesPreview } from '@/components/amenities-preview';
import { CapacityPills } from '@/components/capacity-pills';
import { DateRangePills } from '@/components/date-range-pills';
import { FloatingCircleButton } from '@/components/floating-circle-button';
import { HeartIcon } from '@/components/icons/heart-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { HeroCarousel } from '@/components/hero-carousel';
import { HostCard } from '@/components/host-card';
import { MapPreview } from '@/components/map-preview';
import { ReserveBar } from '@/components/reserve-bar';
import { Section } from '@/components/section';
import { SuperhostBadge } from '@/components/superhost-badge';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { getHost } from '@/data/hosts';
import { useLikes } from '@/data/likes';
import { getListing } from '@/data/listings';
import { getReviewsForListing } from '@/data/reviews';
import { useLocale, useT } from '@/lib/i18n';

const HERO_FADE_DISTANCE = 220;

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const t = useT();
  const { has, toggle } = useLikes();

  const listing = getListing(id);
  const host = listing ? getHost(listing.hostId) : undefined;
  const reviews = listing ? getReviewsForListing(listing.id) : [];

  const scrollY = useSharedValue(0);
  const [statusStyle, setStatusStyle] = useState<'light' | 'dark'>('light');

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      const next: 'light' | 'dark' =
        e.contentOffset.y > HERO_FADE_DISTANCE - 40 ? 'dark' : 'light';
      runOnJS(setStatusStyle)(next);
    },
  });

  const topBarBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HERO_FADE_DISTANCE - 80, HERO_FADE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HERO_FADE_DISTANCE - 40, HERO_FADE_DISTANCE + 10],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [HERO_FADE_DISTANCE - 40, HERO_FADE_DISTANCE + 10],
          [10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_FADE_DISTANCE * 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HERO_FADE_DISTANCE * 0.6],
          [0, -16],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const liked = listing ? has(listing.id) : false;

  const handleLike = () => {
    if (!listing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle(listing.id);
  };

  const cityRegion = useMemo(
    () => (listing ? `${t(listing.city)} · ${t(listing.region)}` : ''),
    [listing, t],
  );

  if (!listing) {
    return (
      <SafeAreaView style={styles.notFound}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText variant="heading">
          {t({ ar: 'لم يتم العثور على المكان', en: 'Listing not found' })}
        </ThemedText>
      </SafeAreaView>
    );
  }

  const isSuperhost = listing.rating.average >= 4.9;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={statusStyle} animated />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <HeroCarousel
          photos={listing.photos}
          scrollY={scrollY}
          onPhotoPress={() =>
            router.push({
              pathname: '/listing/[id]/photos',
              params: { id: listing.id },
            })
          }
        />

        <View style={styles.titleBlock}>
          <ThemedText
            style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {t(listing.title)}
          </ThemedText>
          <View style={styles.metaRow}>
            <IconSymbol name="star.fill" size={14} color={Colors.light.coral} />
            <ThemedText
              style={[styles.metaStrong, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {' '}
              {listing.rating.average.toFixed(2)}
            </ThemedText>
            <ThemedText
              style={[styles.metaMuted, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {' '}
              · {listing.rating.count} {t({ ar: 'تقييم', en: 'reviews' })} · {cityRegion}
            </ThemedText>
          </View>
        </View>

        <View style={styles.capacityWrap}>
          <CapacityPills capacity={listing.capacity} />
        </View>

        {host ? (
          <Section title={t({ ar: 'عن المضيف', en: 'About the host' })}>
            <HostCard host={host} />
          </Section>
        ) : null}

        <Section title={t({ ar: 'تاريخ الحجز', en: 'Your stay' })}>
          <DateRangePills
            checkIn={t({ ar: '20 يونيو 2026', en: '20 Jun 2026' })}
            checkOut={t({ ar: '22 يونيو 2026', en: '22 Jun 2026' })}
            onPress={() => router.push(`/listing/${listing.id}/dates`)}
          />
        </Section>

        <Section title={t({ ar: 'عن المكان', en: 'About this place' })}>
          <ThemedText
            style={[styles.body, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {t(listing.description)}
          </ThemedText>
        </Section>

        <Section title={t({ ar: 'المرافق', en: 'What this place offers' })}>
          <AmenitiesPreview
            amenities={listing.amenities}
            previewCount={6}
            onShowAll={() => router.push(`/listing/${listing.id}/amenities`)}
          />
        </Section>

        <Section title={t({ ar: 'موقع المكان', en: 'Where you’ll be' })}>
          <MapPreview
            coordinates={listing.coordinates}
            cityLabel={cityRegion}
            onPress={() => router.push(`/listing/${listing.id}/map`)}
          />
        </Section>

        {reviews.length > 0 ? (
          <Section
            title={`★ ${listing.rating.average.toFixed(2)} · ${listing.rating.count} ${t({
              ar: 'تقييم',
              en: 'reviews',
            })}`}>
            <View style={styles.reviews}>
              {reviews.slice(0, 3).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <Image
                      source={{ uri: r.authorAvatarUrl }}
                      style={styles.reviewAvatar}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={[
                          styles.reviewName,
                          { fontFamily: fontFamilyFor('bold', locale) },
                        ]}
                        numberOfLines={1}>
                        {t(r.authorName)}
                      </ThemedText>
                      <ThemedText style={styles.reviewStars}>
                        {'★'.repeat(r.rating)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    style={[
                      styles.reviewText,
                      { fontFamily: fontFamilyFor('regular', locale) },
                    ]}
                    numberOfLines={4}>
                    {t(r.text)}
                  </ThemedText>
                </View>
              ))}
            </View>
            {reviews.length > 3 ? (
              <View style={{ marginTop: Spacing[5] }}>
                <ThemedText
                  onPress={() => router.push(`/listing/${listing.id}/reviews`)}
                  style={[
                    styles.showAll,
                    { fontFamily: fontFamilyFor('medium', locale) },
                  ]}>
                  {t({
                    ar: `عرض جميع التقييمات (${reviews.length})`,
                    en: `Show all ${reviews.length} reviews`,
                  })}
                </ThemedText>
              </View>
            ) : null}
          </Section>
        ) : null}

        <Section title={t({ ar: 'أمور يجب معرفتها', en: 'House rules' })}>
          <View style={styles.rules}>
            {[
              t({ ar: 'تسجيل الدخول: بعد 3 مساءً', en: 'Check-in: after 3 PM' }),
              t({ ar: 'تسجيل المغادرة: قبل 12 ظهراً', en: 'Check-out: before 12 PM' }),
              t({ ar: 'ممنوع التدخين داخل المكان', en: 'No smoking indoors' }),
              t({ ar: 'ممنوع الحفلات أو الفعاليات', en: 'No parties or events' }),
              t({ ar: 'ممنوع الحيوانات الأليفة', en: 'No pets' }),
            ].map((rule) => (
              <ThemedText
                key={rule}
                style={[styles.rule, { fontFamily: fontFamilyFor('regular', locale) }]}>
                · {rule}
              </ThemedText>
            ))}
          </View>
        </Section>
      </Animated.ScrollView>

      {/* Floating top bar over photo */}
      <View style={[styles.topBarLayer, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View style={[styles.topBarBackdrop, topBarBackdropStyle]} pointerEvents="none">
          <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.topBarTint} />
        </Animated.View>
        <Animated.View
          style={[styles.headerTitleWrap, headerTitleStyle]}
          pointerEvents="none">
          <ThemedText
            numberOfLines={1}
            style={[styles.headerTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {t(listing.title)}
          </ThemedText>
          <View style={styles.headerRatingRow}>
            <IconSymbol name="star.fill" size={11} color={Colors.light.text} />
            <ThemedText
              style={[styles.headerRating, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {' '}
              {listing.rating.average.toFixed(2)}
            </ThemedText>
            <ThemedText
              style={[styles.headerRatingCount, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {' '}
              · {listing.rating.count} {t({ ar: 'تقييم', en: 'reviews' })}
            </ThemedText>
          </View>
        </Animated.View>
        <View style={styles.topBar}>
          <FloatingCircleButton onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={18} color={Colors.light.text} />
          </FloatingCircleButton>
          <View style={{ flex: 1 }} />
          <FloatingCircleButton onPress={() => {}}>
            <ShareIcon size={18} stroke={Colors.light.text} strokeWidth={1.6} />
          </FloatingCircleButton>
          <View style={{ width: Spacing[2] }} />
          <FloatingCircleButton onPress={handleLike}>
            <HeartIcon
              size={20}
              stroke={liked ? Colors.light.coral : Colors.light.text}
              fill={liked ? Colors.light.coral : 'none'}
              strokeWidth={1.8}
            />
          </FloatingCircleButton>
        </View>
      </View>

      {/* Superhost badge corner */}
      {isSuperhost ? (
        <Animated.View
          style={[styles.badgeLayer, { paddingTop: insets.top + 56 }, badgeStyle]}
          pointerEvents="none">
          <View style={styles.badgePos}>
            <SuperhostBadge size={36} />
          </View>
        </Animated.View>
      ) : null}

      <ReserveBar
        halalas={listing.pricing.nightly}
        onReserve={() => router.push(`/listing/${listing.id}/reserve`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBarLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topBarBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  topBarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing[2],
    paddingHorizontal: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    lineHeight: 19,
    color: Colors.light.text,
    maxWidth: '100%',
  },
  headerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  headerRating: {
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.text,
  },
  headerRatingCount: {
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.textMuted,
  },

  badgeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  badgePos: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[4],
  },

  titleBlock: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[3],
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: Colors.light.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[2],
    flexWrap: 'wrap',
  },
  metaStrong: { fontSize: 13, lineHeight: 18, color: Colors.light.text },
  metaMuted: { fontSize: 13, lineHeight: 18, color: Colors.light.textMuted },

  capacityWrap: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
  },

  body: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.text,
  },

  reviews: { gap: Spacing[3] },
  reviewCard: {
    padding: Spacing[4],
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#FAFAFA',
    gap: Spacing[3],
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  reviewName: { fontSize: 14, lineHeight: 18, color: Colors.light.text },
  reviewStars: { fontSize: 12, lineHeight: 16, color: Colors.light.coral },
  reviewText: { fontSize: 13, lineHeight: 20, color: Colors.light.text },

  showAll: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    textDecorationLine: 'underline',
  },

  rules: { gap: Spacing[2] },
  rule: { fontSize: 14, lineHeight: 22, color: Colors.light.text },
});
