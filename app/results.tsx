import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/listing-card';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonCard } from '@/components/skeleton-card';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Shadows, Spacing, fontFamilyFor } from '@/constants/theme';
import { LISTINGS } from '@/data/listings';
import type { Listing } from '@/data/types';
import { useLocale, useT } from '@/lib/i18n';

const HEADER_CONTENT_HEIGHT = 80;
const MOCK_MULTIPLIER = 4;

export default function ResultsScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const { city, startDate, endDate, guests } = useLocalSearchParams<{
    city?: string;
    startDate?: string;
    endDate?: string;
    guests?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT;

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(id);
  }, []);

  const results = useMemo<Listing[]>(
    () => Array.from({ length: MOCK_MULTIPLIER }).flatMap(() => LISTINGS),
    [],
  );

  const dateLabel = useMemo(() => {
    const parse = (s?: string) => {
      if (!s) return null;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const s = parse(startDate);
    const e = parse(endDate);
    if (s && e) return `${fmt(s)} — ${fmt(e)}`;
    if (s) return fmt(s);
    return null;
  }, [startDate, endDate]);

  const guestCount = useMemo(() => {
    if (!guests) return null;
    const n = Number(guests);
    return Number.isNaN(n) ? null : n;
  }, [guests]);

  const summarySubLine = useMemo(() => {
    const parts: string[] = [];
    if (dateLabel) parts.push(dateLabel);
    if (guestCount && guestCount > 0) {
      parts.push(
        `${guestCount} ${t({
          ar: guestCount === 1 ? 'ضيف' : 'ضيوف',
          en: guestCount === 1 ? 'guest' : 'guests',
        })}`,
      );
    }
    return parts.join(' · ');
  }, [dateLabel, guestCount, t]);

  const goHome = () => {
    router.dismissAll();
  };

  const openFilters = () => {
    router.push('/filters');
  };

  const openSearch = () => {
    router.push('/search');
  };

  const openQuickFilters = () => {
    router.push('/quick-filters');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={loading ? Array.from({ length: 3 }) : results}
        keyExtractor={(item, i) => (loading ? `s${i}` : `${(item as Listing).id}-${i}`)}
        renderItem={({ item }) =>
          loading ? (
            <SkeletonCard />
          ) : (
            <ListingCard
              listing={item as Listing}
              startDate={startDate || undefined}
              endDate={endDate || undefined}
            />
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: headerHeight + Spacing[10],
            paddingBottom: insets.bottom + 120,
          },
        ]}
        removeClippedSubviews
        initialNumToRender={5}
        windowSize={5}
      />

      <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
        <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerTint} pointerEvents="none" />
        <View style={styles.headerRow}>
          <PressableScale onPress={goHome} scaleTo={0.88} haptic="back" style={styles.iconBtn}>
            <IconSymbol name="chevron.left" size={20} color={Colors.light.text} />
          </PressableScale>

          <PressableScale
            onPress={openSearch}
            scaleTo={0.97}
            haptic="select"
            style={styles.summaryPill}>
            <ThemedText
              style={[styles.summaryTitle, { fontFamily: fontFamilyFor('bold', locale) }]}
              numberOfLines={1}>
              {t({
                ar: city ? `أماكن في ${city}` : 'أماكن',
                en: city ? `Homes in ${city}` : 'Homes',
              })}
            </ThemedText>
            {summarySubLine ? (
              <ThemedText
                style={[styles.summarySub, { fontFamily: fontFamilyFor('regular', locale) }]}
                numberOfLines={1}>
                {summarySubLine}
              </ThemedText>
            ) : null}
          </PressableScale>

          <PressableScale onPress={openFilters} scaleTo={0.88} style={styles.iconBtn}>
            <IconSymbol
              name="slider.horizontal.3"
              size={20}
              color={Colors.light.text}
            />
          </PressableScale>
        </View>
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.fabWrap, { bottom: insets.bottom + Spacing[5] }]}>
        <PressableScale onPress={openQuickFilters} scaleTo={0.95} style={styles.fab}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.fabTint} />
          <ThemedText style={styles.fabEmoji}>✨</ThemedText>
          <ThemedText
            style={[styles.fabText, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {t({ ar: 'ساعدني أجد الأفضل', en: 'Help me find the best' })}
          </ThemedText>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 6,
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  summaryPill: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.text,
  },
  summarySub: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  scroll: {
    paddingHorizontal: Spacing[5],
  },

  fabWrap: {
    position: 'absolute',
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
    backgroundColor: 'rgba(45, 45, 45, 0.85)',
  },
  fabEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
});
