import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Dimensions, Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmenityIcon } from '@/components/amenity-icon';
import { FloatingCircleButton } from '@/components/floating-circle-button';
import { HeartIcon } from '@/components/icons/heart-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { StarIcon } from '@/components/icons/star-icon';
import { HeroCarousel } from '@/components/hero-carousel';
import { AvatarStack } from '@/components/listing/avatar-stack';
import { RatingSummary } from '@/components/listing/rating-summary';
import { MapPreview } from '@/components/map-preview';
import { PressableScale } from '@/components/pressable-scale';
import { ReserveBar } from '@/components/reserve-bar';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { AMENITIES } from '@/data/amenities';
import { HOSTS } from '@/data/hosts';
import { useLikes } from '@/data/likes';
import { getListing } from '@/data/listings';
import { REVIEWS, getReviewsForListing } from '@/data/reviews';
import { useLocale, useT } from '@/lib/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_W * 0.95;
const CARD_OVERLAP = 28;
const CARD_RADIUS = 32;
const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#CECECE';
const DIVIDER_COLOR = '#F4F4F4';
const SPACE_CARD_W = 152;
const SPACE_CARD_H = 99;
const DESC_SHOW_MORE_THRESHOLD = 220;

type SectionKey =
  | 'description'
  | 'facilities'
  | 'features'
  | 'location'
  | 'reviews'
  | 'rules';

export default function ListingDetailScreen() {
  const { id, startDate, endDate } = useLocalSearchParams<{
    id: string;
    startDate?: string;
    endDate?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const t = useT();
  const { has, toggle } = useLikes();

  const listing = getListing(id);
  const ownReviews = listing ? getReviewsForListing(listing.id) : [];
  const reviews = ownReviews.length > 0 ? ownReviews : REVIEWS.slice(0, 3);

  const scrollY = useSharedValue(0);
  const [statusStyle, setStatusStyle] = useState<'light' | 'dark'>('light');

  const STICKY_FADE_END = HERO_HEIGHT - CARD_OVERLAP - 20;
  const STICKY_FADE_START = STICKY_FADE_END - 80;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      const next: 'light' | 'dark' = y > HERO_HEIGHT - 80 ? 'dark' : 'light';
      runOnJS(setStatusStyle)(next);
    },
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [STICKY_FADE_START, STICKY_FADE_END],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [STICKY_FADE_START, STICKY_FADE_END],
      [-8, 0],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ translateY }] };
  });

  const liked = listing ? has(listing.id) : false;

  const handleLike = () => {
    if (!listing) return;
    toggle(listing.id);
  };

  const subtitle = useMemo(() => {
    if (!listing) return '';
    return `${t(listing.city)} · ${t(listing.region)} · ${listing.capacity.guests} ${t({ ar: 'ضيف', en: 'guests' })}`;
  }, [listing, t]);

  const descriptionText = useMemo(() => {
    if (!listing) return '';
    const base = t(listing.description);
    const extra = t({
      ar: 'استمتع بإقامة مريحة وعصرية في موقع مميز بالقرب من أهم الوجهات والخدمات. يوفر المكان غرفة نوم مريحة، وإنترنت سريع، ومطبخًا متكاملًا، ومنطقة جلوس هادئة تناسب الإقامات القصيرة والطويلة. مثالي للأفراد أو الأزواج أو رحلات العمل، مع سهولة الوصول إلى المطاعم والمقاهي والمعالم القريبة. تجربة دخول ذاتي سهلة وكل ما تحتاجه لإقامة ممتعة ومريحة.',
      en: 'Enjoy a comfortable, modern stay in a prime location near top destinations and services. The place features a cozy bedroom, fast internet, a fully equipped kitchen, and a quiet seating area suitable for short or long stays. Ideal for individuals, couples, or business travelers, with easy access to nearby restaurants, cafes, and landmarks. Easy self check-in and everything you need for a relaxing experience.',
    });
    return `${base}\n\n${extra}`;
  }, [listing, t]);

  const showDescriptionMore = descriptionText.length > DESC_SHOW_MORE_THRESHOLD;

  const sampleAvatars = useMemo(
    () => HOSTS.slice(0, 3).map((h) => h.avatarUrl),
    [],
  );

  const spaces = useMemo(() => {
    if (!listing) return [];
    const photos = listing.photos.slice(0, 6);
    return [
      { key: 'living', label: t({ ar: 'الصالة', en: 'Living' }), subtitle: `${listing.capacity.guests} ${t({ ar: 'مقعد', en: 'seats' })}`, photo: photos[0] },
      { key: 'kitchen', label: t({ ar: 'المطبخ', en: 'Kitchen' }), subtitle: t({ ar: 'مطبخ كامل', en: 'Full kitchen' }), photo: photos[1] ?? photos[0] },
      { key: 'bedroom', label: t({ ar: 'غرفة النوم', en: 'Bedroom' }), subtitle: `${listing.capacity.bedrooms} ${t({ ar: 'سرير', en: 'beds' })}`, photo: photos[2] ?? photos[0] },
      { key: 'bath', label: t({ ar: 'الحمام', en: 'Bath' }), subtitle: `${listing.capacity.bathrooms} ${t({ ar: 'حمام', en: 'baths' })}`, photo: photos[3] ?? photos[0] },
      { key: 'outdoor', label: t({ ar: 'الخارج', en: 'Outdoor' }), subtitle: t({ ar: 'جلسة خارجية', en: 'Outdoor seating' }), photo: photos[4] ?? photos[0] },
    ];
  }, [listing, t]);

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

  const likesCount = 200 + listing.rating.count * 7;

  const goToPhotos = () =>
    router.push({
      pathname: '/listing/[id]/photos',
      params: { id: listing.id },
    });

  const rowDir = isRTL ? 'row-reverse' : 'row';

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
        {/* idx 0: hero */}
        <View style={styles.heroBox}>
          <HeroCarousel
            photos={listing.photos}
            scrollY={scrollY}
            bottomInset={CARD_OVERLAP + 4}
            onPhotoPress={goToPhotos}
          />
        </View>

        {/* idx 1: card head (title + stats) */}
        <View style={styles.cardHead}>
          <View style={styles.titleBlock}>
            <ThemedText
              numberOfLines={1}
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t(listing.title)}
            </ThemedText>
            <ThemedText
              numberOfLines={1}
              style={[styles.subtitle, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {subtitle}
            </ThemedText>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statsHalf}>
              <AvatarStack avatars={sampleAvatars} count={likesCount} size={28} />
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsHalf}>
              <RatingSummary
                rating={listing.rating.average}
                count={listing.rating.count}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t({ ar: 'وصف', en: 'Description' })}
            </ThemedText>
            <ThemedText
              numberOfLines={showDescriptionMore ? 5 : undefined}
              style={[styles.body, { fontFamily: fontFamilyFor('regular', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {descriptionText}
            </ThemedText>
            {showDescriptionMore ? (
              <PressableScale
                haptic="select"
                onPress={() =>
                  router.push({
                    pathname: '/listing/[id]/description',
                    params: { id: listing.id },
                  })
                }
                style={styles.showMorePill}>
                <ThemedText
                  style={[styles.showMoreText, { fontFamily: fontFamilyFor('medium', locale) }]}>
                  {t({ ar: 'عرض المزيد', en: 'Show more' })}
                </ThemedText>
              </PressableScale>
            ) : null}
          </View>

          {/* Facilities — rectangular pressable cards */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t({ ar: 'المرافق', en: 'Spaces' })}
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              // True RTL scroll: mirror the whole scroll view, then mirror
              // each item back so its content reads naturally.
              style={isRTL ? styles.mirrorX : undefined}
              contentContainerStyle={styles.spacesRow}>
              {spaces.map((s) => (
                <View key={s.key} style={isRTL ? styles.mirrorX : undefined}>
                  <PressableScale
                    haptic="select"
                    onPress={goToPhotos}
                    scaleTo={0.98}
                    style={styles.spaceCard}>
                    <View style={styles.spaceImageWrap}>
                      {s.photo ? (
                        <Image
                          source={{ uri: s.photo }}
                          style={styles.spaceImage}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : null}
                    </View>
                    <ThemedText
                      numberOfLines={1}
                      style={[
                        styles.spaceLabel,
                        {
                          fontFamily: fontFamilyFor('medium', locale),
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}>
                      {s.label}
                    </ThemedText>
                    <ThemedText
                      numberOfLines={1}
                      style={[
                        styles.spaceSub,
                        {
                          fontFamily: fontFamilyFor('regular', locale),
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}>
                      {s.subtitle}
                    </ThemedText>
                  </PressableScale>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Features (amenities) — RTL aware */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t({ ar: 'المميزات', en: 'Features' })}
            </ThemedText>
            <View style={styles.amenitiesList}>
              {listing.amenities.slice(0, 4).map((a) => (
                <View key={a} style={[styles.amenityRow, { flexDirection: rowDir }]}>
                  <AmenityIcon id={a} size={18} />
                  <ThemedText
                    numberOfLines={1}
                    style={[
                      styles.amenityLabel,
                      {
                        fontFamily: fontFamilyFor('regular', locale),
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}>
                    {t(AMENITIES[a].label)}
                  </ThemedText>
                </View>
              ))}
            </View>
            {listing.amenities.length > 4 ? (
              <PressableScale
                haptic="select"
                onPress={() => router.push(`/listing/${listing.id}/amenities`)}
                style={styles.showMorePill}>
                <ThemedText
                  style={[styles.showMoreText, { fontFamily: fontFamilyFor('medium', locale) }]}>
                  {t({
                    ar: `عرض جميع المميزات (${listing.amenities.length})`,
                    en: `Show all features (${listing.amenities.length})`,
                  })}
                </ThemedText>
              </PressableScale>
            ) : null}
          </View>

          {/* Location — taller clean map (fake Riyadh location for now) */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t({ ar: 'الموقع', en: 'Location' })}
            </ThemedText>
            <View style={styles.locationBox}>
              <MapPreview
                coordinates={{ lat: 24.7136, lng: 46.6753 }}
                cityLabel={`${t(listing.city)} · ${t(listing.region)}`}
                onPress={() => {
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=24.7136,46.6753`);
                }}
                showOverlay={false}
                height={460}
              />
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t({ ar: 'التقييمات', en: 'Reviews' })}
            </ThemedText>

            <View style={styles.reviewsHeader}>
              <RatingSummary
                rating={listing.rating.average}
                count={listing.rating.count}
                size="sm"
              />
              <View style={styles.barChart}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const ratio =
                    star === Math.round(listing.rating.average)
                      ? 1
                      : Math.max(0.15, 1 - Math.abs(star - listing.rating.average) * 0.3);
                  return (
                    <View key={star} style={styles.barRow}>
                      <View style={styles.barTrack}>
                        <View
                          style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.reviewList}>
              {reviews.slice(0, 3).map((r, idx) => (
                <View
                  key={r.id}
                  style={[styles.reviewRow, idx < Math.min(reviews.length, 3) - 1 && styles.reviewRowDivider]}>
                  <View style={[styles.reviewHead, { flexDirection: rowDir }]}>
                    <Image
                      source={{ uri: r.authorAvatarUrl }}
                      style={styles.reviewAvatar}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        numberOfLines={1}
                        style={[
                          styles.reviewName,
                          {
                            fontFamily: fontFamilyFor('bold', locale),
                            textAlign: isRTL ? 'right' : 'left',
                          },
                        ]}>
                        {t(r.authorName)}
                      </ThemedText>
                      <View style={[styles.reviewStars, { flexDirection: rowDir }]}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            size={10}
                            color={i < r.rating ? TEXT_PRIMARY : '#E5E5E5'}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <ThemedText
                    numberOfLines={3}
                    style={[
                      styles.reviewText,
                      {
                        fontFamily: fontFamilyFor('regular', locale),
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}>
                    {t(r.text)}
                  </ThemedText>
                </View>
              ))}
            </View>

            <PressableScale
              haptic="select"
              onPress={() => router.push(`/listing/${listing.id}/reviews`)}
              style={styles.showMorePill}>
              <ThemedText
                style={[styles.showMoreText, { fontFamily: fontFamilyFor('medium', locale) }]}>
                {t({
                  ar: `عرض جميع التقييمات (${reviews.length})`,
                  en: `Show all reviews (${reviews.length})`,
                })}
              </ThemedText>
            </PressableScale>
          </View>

          {/* Rules */}
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t({ ar: 'تعليمات هامة و القواعد', en: 'Important rules' })}
            </ThemedText>
            <ThemedText
              style={[styles.body, { fontFamily: fontFamilyFor('regular', locale), textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {t({
                ar: '• الدخول: من الساعة ٣ عصراً\n• المغادرة: قبل الساعة ١٢ ظهراً\n• مجلس الرجال ومجلس النساء بمداخل مستقلة\n• الالتزام بالاحتشام داخل المرافق المشتركة (المسبح والحديقة)\n• ممنوع التدخين داخل المجالس والغرف، ركن خارجي للشيشة\n• مراعاة وقت الصلاة وخفض الصوت أثناء الأذان\n• ممنوع رفع الموسيقى بعد منتصف الليل احتراماً للجيران\n• ممنوع الحيوانات الأليفة\n• الحفاظ على نظافة المكان قبل المغادرة، خدمة تنظيف نهائية متوفرة',
                en: '• Check-in: from 3:00 PM\n• Check-out: before 12:00 PM\n• Separate entrances for men’s and women’s majlis\n• Modest dress in shared areas (pool and garden)\n• No smoking inside majlis or rooms — outdoor shisha area available\n• Please respect prayer times and lower the volume during adhan\n• No loud music after midnight, in respect to neighbours\n• No pets allowed\n• Leave the place tidy — final cleaning service available',
              })}
            </ThemedText>
          </View>
      </Animated.ScrollView>

      {/* Compact sticky header: title + subtitle, fades in past the hero */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.stickyHeader, { paddingTop: insets.top }, stickyHeaderStyle]}>
        <View style={styles.stickyHeaderInner}>
          <ThemedText
            numberOfLines={1}
            style={[
              styles.stickyTitle,
              {
                fontFamily: fontFamilyFor('bold', locale),
                textAlign: 'center',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}>
            {t(listing.title)}
          </ThemedText>
          <ThemedText
            numberOfLines={1}
            style={[
              styles.stickySubtitle,
              {
                fontFamily: fontFamilyFor('regular', locale),
                textAlign: 'center',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}>
            {subtitle}
          </ThemedText>
        </View>
      </Animated.View>

      {/* Floating top buttons */}
      <View
        style={[styles.topBarLayer, { paddingTop: insets.top }]}
        pointerEvents="box-none">
        <View style={styles.topBar}>
          <FloatingCircleButton onPress={() => router.back()} haptic="back">
            <IconSymbol name="chevron.left" size={18} color={Colors.light.text} />
          </FloatingCircleButton>
          <View style={{ flex: 1 }} />
          <FloatingCircleButton onPress={() => {}}>
            <ShareIcon size={18} stroke={Colors.light.text} strokeWidth={2.2} />
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

      <ReserveBar
        halalas={listing.pricing.nightly}
        onReserve={() => {
          if (startDate && endDate) {
            router.push({
              pathname: '/booking/[id]/services',
              params: { id: listing.id, startDate, endDate },
            });
          } else {
            router.push({
              pathname: '/booking/[id]/dates',
              params: { id: listing.id },
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  heroBox: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
  },

  cardHead: {
    marginTop: -CARD_OVERLAP,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    borderCurve: 'continuous',
    paddingTop: Spacing[6],
  },

  titleBlock: {
    paddingHorizontal: Spacing[5],
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 19,
    lineHeight: 26,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[3],
  },
  statsHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsDivider: {
    width: 1,
    height: 44,
    backgroundColor: DIVIDER_COLOR,
    marginHorizontal: Spacing[3],
  },

  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER_COLOR,
  },
  stickyHeaderInner: {
    height: 56,
    paddingHorizontal: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  stickyTitle: {
    fontSize: 16,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
  stickySubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: TEXT_SECONDARY,
  },

  topBarLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
  },

  section: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[5],
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    color: TEXT_PRIMARY,
    marginBottom: Spacing[3],
  },

  body: {
    fontSize: 14,
    lineHeight: 24,
    color: TEXT_PRIMARY,
  },

  showMorePill: {
    marginTop: Spacing[4],
    backgroundColor: DIVIDER_COLOR,
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },

  spacesRow: {
    gap: Spacing[3],
    paddingStart: 0,
    paddingEnd: Spacing[5],
  },
  mirrorX: {
    transform: [{ scaleX: -1 }],
  },
  spaceCard: {
    width: SPACE_CARD_W,
    gap: 8,
  },
  spaceImageWrap: {
    width: SPACE_CARD_W,
    height: SPACE_CARD_H,
    borderRadius: 10,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  spaceImage: {
    width: '100%',
    height: '100%',
  },
  spaceLabel: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  spaceSub: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
  },

  amenitiesList: {
    gap: Spacing[3],
  },
  amenityRow: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: 4,
  },
  amenityLabel: {
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    flexShrink: 1,
  },

  locationBox: {
    marginTop: Spacing[2],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },

  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    paddingVertical: Spacing[3],
  },
  barChart: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    height: 6,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: DIVIDER_COLOR,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.light.coral,
    borderRadius: 3,
  },

  reviewList: {
    marginTop: Spacing[3],
  },
  reviewRow: {
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  reviewRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER_COLOR,
  },
  reviewHead: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  reviewName: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  reviewStars: {
    gap: 2,
    marginTop: 2,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
});
