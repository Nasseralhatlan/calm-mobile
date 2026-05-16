import { Image } from 'expo-image';
import { useMemo, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntranceItem } from '@/components/entrance-item';
import { ListingCardCompact } from '@/components/listing-card-compact';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { currentUser } from '@/data/auth';
import { LISTINGS } from '@/data/listings';
import type { ListingType } from '@/data/types';
import { useLocale, useT } from '@/lib/i18n';

const CATEGORIES: { id: ListingType | 'birthday' | 'wedding'; emoji: string; label: { ar: string; en: string } }[] = [
  { id: 'chalet', emoji: '🏖️', label: { ar: 'شاليهات', en: 'Chalets' } },
  { id: 'rest_house', emoji: '🏡', label: { ar: 'استراحات', en: 'Rest houses' } },
  { id: 'camp', emoji: '⛺', label: { ar: 'مخيمات', en: 'Camps' } },
  { id: 'farm', emoji: '🌾', label: { ar: 'مزارع', en: 'Farms' } },
  { id: 'birthday', emoji: '🎂', label: { ar: 'أعياد ميلاد', en: 'Birthdays' } },
  { id: 'wedding', emoji: '💍', label: { ar: 'مناسبات', en: 'Events' } },
];

export default function ExploreScreen() {
  const palette = Colors.light;
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';

  const popular = useMemo(() => [...LISTINGS].sort((a, b) => b.rating.average - a.rating.average).slice(0, 6), []);
  const nearby = useMemo(() => LISTINGS.filter((l) => l.city.en === 'Riyadh').slice(0, 6), []);

  const firstName = useMemo(() => t(currentUser.name).split(' ')[0], [t]);
  const cityLabel = t({ ar: 'الرياض', en: 'Riyadh' });

  const popularRef = useRef<ScrollView>(null);
  const nearbyRef = useRef<ScrollView>(null);
  const handleRtlScroll = (ref: React.RefObject<ScrollView | null>) => () => {
    if (isRTL) ref.current?.scrollToEnd({ animated: false });
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <EntranceItem delay={0}>
        <SafeAreaView edges={['top']} style={styles.headerWrap}>
          <View style={styles.topBar}>
            <Image
              source={require('@/assets/logo/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <PressableScale scaleTo={0.96} style={styles.cityPill}>
              <ThemedText variant="bodyMedium" style={styles.cityPillText}>{cityLabel}</ThemedText>
              <IconSymbol name="chevron.left" size={14} color={palette.text} style={{ transform: [{ rotate: '-90deg' }] }} />
            </PressableScale>
          </View>
        </SafeAreaView>
      </EntranceItem>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <EntranceItem delay={60}>
          <View style={styles.greetingWrap}>
            <ThemedText variant="title" style={styles.greeting}>
              {t({ ar: `اهــــلا ${firstName}`, en: `Hello, ${firstName}` })}
            </ThemedText>
          </View>
        </EntranceItem>

        <View style={styles.grid}>
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
          title={t({ ar: 'الناس اعجبها', en: 'People liked' })}
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

        <View style={{ height: Spacing[24] }} />
      </ScrollView>

      <View pointerEvents="box-none" style={styles.fabWrap}>
        <EntranceItem delay={1100} from={16}>
          <PressableScale scaleTo={0.95} style={styles.fab}>
            <IconSymbol name="magnifyingglass" size={18} color="#FFFFFF" />
            <ThemedText variant="bodyMedium" style={styles.fabText}>
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
  return (
    <View style={styles.section}>
      <EntranceItem delay={headerDelay}>
        <View style={styles.sectionHeader}>
          <PressableScale scaleTo={0.92} onPress={onMore} style={styles.moreChip}>
            <IconSymbol name="chevron.left" size={16} color={Colors.light.text} />
          </PressableScale>
          <ThemedText variant="heading" style={styles.sectionTitle}>
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
  scroll: { paddingBottom: Spacing[12] },

  headerWrap: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 6,
    zIndex: 10,
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
  greeting: { textAlign: 'right', writingDirection: 'rtl', fontSize: 16, lineHeight: 22 },

  grid: {
    paddingHorizontal: Spacing[5],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
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
  gridEmoji: { fontSize: 32, lineHeight: 36 },
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
  sectionTitle: { writingDirection: 'rtl', fontSize: 16, lineHeight: 22 },
  moreChip: {
    width: 40,
    height: 40,
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
    backgroundColor: '#1A1A1A',
    ...Shadows.modal,
  },
  fabText: { color: '#FFFFFF' },
});
