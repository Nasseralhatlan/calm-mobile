import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntranceItem } from '@/components/entrance-item';
import { SearchPlusIcon } from '@/components/icons/search-plus-icon';
import { ListingCardCompact } from '@/components/listing-card-compact';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Shadows, Spacing, fontFamilyFor } from '@/constants/theme';
import { currentUser } from '@/data/auth';
import { LISTINGS } from '@/data/listings';
import { useLocale, useT } from '@/lib/i18n';

type Category = {
  id: string;
  label: { ar: string; en: string };
  emoji: string;
};

const CATEGORIES: Category[] = [
  { id: 'chalet', label: { ar: 'شاليهات', en: 'Chalets' }, emoji: '🏖️' },
  { id: 'rest_house', label: { ar: 'استراحات', en: 'Rest houses' }, emoji: '🏡' },
  // { id: 'apartment', label: { ar: 'شقق', en: 'Apartments' }, emoji: '🏢' },
  // { id: 'studio', label: { ar: 'اســتوديو', en: 'Studios' }, emoji: '🛏️' },
  { id: 'camp_farm', label: { ar: 'مخيمات و مزارع', en: 'Camps & farms' }, emoji: '⛺' },
  // { id: 'villa', label: { ar: 'فلل', en: 'Villas' }, emoji: '🏠' },
];

export default function ExploreScreen() {
  const palette = Colors.light;
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 72;
  // Custom tab bar is position:absolute → useBottomTabBarHeight returns 0. Compute manually.
  const tabBarHeight = insets.bottom * 0.75 + 64;

  const openSearch = () => {
    router.push('/search');
  };

  const popular = useMemo(() => [...LISTINGS].sort((a, b) => b.rating.average - a.rating.average).slice(0, 6), []);
  const nearby = useMemo(() => LISTINGS.filter((l) => l.city.en === 'Riyadh').slice(0, 6), []);
  const recentlyViewed = useMemo(
    () => ['l_chalet_02', 'l_rest_02', 'l_chalet_05', 'l_rest_04', 'l_chalet_01']
      .map((id) => LISTINGS.find((l) => l.id === id))
      .filter((l): l is (typeof LISTINGS)[number] => Boolean(l)),
    [],
  );

  const firstName = useMemo(() => t(currentUser.name).split(' ')[0], [t]);
  const cityLabel = t({ ar: 'الريــاض', en: 'Riyadh' });

  const popularRef = useRef<ScrollView>(null);
  const nearbyRef = useRef<ScrollView>(null);
  const recentRef = useRef<ScrollView>(null);
  const handleRtlScroll = (ref: React.RefObject<ScrollView | null>) => () => {
    if (isRTL) ref.current?.scrollToEnd({ animated: false });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <EntranceItem delay={0} style={styles.headerWrap}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerTint} pointerEvents="none" />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <Image
              source={require('@/assets/logo/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <PressableScale
              scaleTo={0.96}
              haptic="select"
              onPress={() => router.push('/cities')}
              style={styles.cityPill}>
              <ThemedText variant="bodyMedium" style={styles.cityPillText}>{cityLabel}</ThemedText>
              <IconSymbol name="chevron.left" size={14} color={palette.text} style={{ transform: [{ rotate: '-90deg' }] }} />
            </PressableScale>
          </View>
        </SafeAreaView>
      </EntranceItem>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight, paddingBottom: tabBarHeight + Spacing[6] },
        ]}>
        <EntranceItem delay={60}>
          <View style={styles.greetingWrap}>
            <ThemedText
              variant="title"
              style={[
                styles.greeting,
                {
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t({ ar: `اهــــلا ${firstName}`, en: `Hello, ${firstName}` })}
            </ThemedText>
          </View>
        </EntranceItem>

        <View style={[styles.grid, isRTL && styles.gridRTL]}>
          {CATEGORIES.map((cat, i) => (
            <EntranceItem key={cat.id} delay={140 + i * 50}>
              <PressableScale scaleTo={0.95} style={styles.gridTile}>
                <ThemedText style={styles.gridEmoji}>{cat.emoji}</ThemedText>
                <ThemedText variant="caption" style={styles.gridLabel} numberOfLines={1}>
                  {t(cat.label)}
                </ThemedText>
              </PressableScale>
            </EntranceItem>
          ))}
        </View>

        <Section
          title={t({ ar: 'النـــاس اعجبها', en: 'People liked' })}
          headerDelay={440}
          onMore={() => {}}>
          <ScrollView
            ref={popularRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.carousel, isRTL && styles.carouselRTL]}
            onContentSizeChange={handleRtlScroll(popularRef)}>
            {popular.map((l, i) => (
              <EntranceItem key={l.id} delay={480 + i * 60}>
                <ListingCardCompact listing={l} />
              </EntranceItem>
            ))}
          </ScrollView>
        </Section>

        <Section
          title={t({ ar: 'قريب منك', en: 'Near you' })}
          headerDelay={780}
          onMore={() => {}}>
          <ScrollView
            ref={nearbyRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.carousel, isRTL && styles.carouselRTL]}
            onContentSizeChange={handleRtlScroll(nearbyRef)}>
            {nearby.map((l, i) => (
              <EntranceItem key={l.id} delay={820 + i * 60}>
                <ListingCardCompact listing={l} />
              </EntranceItem>
            ))}
          </ScrollView>
        </Section>

        <Section
          title={t({ ar: 'شاهدتها مؤخراً', en: 'Previously viewed' })}
          headerDelay={1080}
          onMore={() => {}}>
          <ScrollView
            ref={recentRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.carousel, isRTL && styles.carouselRTL]}
            onContentSizeChange={handleRtlScroll(recentRef)}>
            {recentlyViewed.map((l, i) => (
              <EntranceItem key={l.id} delay={1120 + i * 60}>
                <ListingCardCompact listing={l} />
              </EntranceItem>
            ))}
          </ScrollView>
        </Section>

      </ScrollView>

      <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: tabBarHeight + Spacing[5] }]}>
        <EntranceItem delay={950} from={16}>
          <PressableScale scaleTo={0.95} onPress={openSearch} haptic="forward" style={styles.fab}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
            <View style={styles.fabTint} />
            <SearchPlusIcon size={16} color="#FFFFFF" />
            <ThemedText
              style={[styles.fabText, { fontFamily: fontFamilyFor('medium', locale) }]}>
              {t({ ar: 'ابدء بحث جديد', en: 'Start a new search' })}
            </ThemedText>
          </PressableScale>
        </EntranceItem>
      </View>
    </View>
  );
}

function Section({
  title,
  onMore,
  headerDelay = 0,
  children,
}: {
  title: string;
  onMore: () => void;
  headerDelay?: number;
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  return (
    <View style={styles.section}>
      <EntranceItem delay={headerDelay}>
        <View
          style={[
            styles.sectionHeader,
            // JSX order is [chip, title]. To place title at the start
            // (right in RTL, left in LTR), use row in RTL (chip at left,
            // title at right) and row-reverse in LTR (title at left, chip
            // at right).
            { flexDirection: isRTL ? 'row' : 'row-reverse' },
          ]}>
          <PressableScale scaleTo={0.92} onPress={onMore} style={styles.moreChip}>
            <IconSymbol
              name="chevron.left"
              size={16}
              color={Colors.light.text}
              style={isRTL ? undefined : { transform: [{ rotate: '180deg' }] }}
            />
          </PressableScale>
          <ThemedText
            variant="heading"
            style={[
              styles.sectionTitle,
              {
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}>
            {title}
          </ThemedText>
        </View>
      </EntranceItem>
      {children}
    </View>
  );
}

const TILE_GAP = Spacing[3];
const SCREEN_W = Dimensions.get('window').width;
const TILE_SIZE = (SCREEN_W - Spacing[5] * 2 - TILE_GAP * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing[20] },

  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 6,
    zIndex: 10,
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[5],
  },
  logo: { width: 100, height: 40 },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  cityPillText: {
    fontSize: 12,
    lineHeight: 16,
  },

  greetingWrap: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[5],
    marginTop: Spacing[5],
  },
  greeting: { fontSize: 16, lineHeight: 22 },

  grid: {
    paddingHorizontal: Spacing[5],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  gridRTL: {
    flexDirection: 'row-reverse',
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 0.75,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 6,
  },
  gridEmoji: { fontSize: 36, lineHeight: 40 },
  gridLabel: { textAlign: 'center' },

  section: {
    paddingTop: Spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
  },
  sectionTitle: { fontSize: 16, lineHeight: 22 },
  moreChip: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
  },
  carouselRTL: {
    flexDirection: 'row-reverse',
  },

  fabWrap: {
    position: 'absolute',
    bottom: Spacing[3],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.pill,
    overflow: 'hidden',
    ...Shadows.modal,
  },
  fabTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
});
