import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MagnifierIcon } from '@/components/icons/magnifier-icon';
import { PressableScale } from '@/components/pressable-scale';
import { ExpandableCard } from '@/components/search/expandable-card';
import { MultiSelectContent } from '@/components/search/multi-select-content';
import { WhereContent } from '@/components/search/where-content';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useHomeData } from '@/data/home';
import { saveLastSearch } from '@/data/last-search';
import { setAppliedFilters } from '@/data/search-filters';
import { useSelectedCity } from '@/data/selected-city';
import type { ApiCity, ApiCityArea, ApiPlaceType } from '@/lib/api';
import { fireHaptic } from '@/lib/haptics';
import { useLocale, useT } from '@/lib/i18n';

type CardKey = 'where' | 'type' | 'area';

export default function SearchModal() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useT();
  const insets = useSafeAreaInsets();

  const { typeId } = useLocalSearchParams<{ typeId?: string }>();
  const home = useHomeData();
  const placeTypes = useMemo<ApiPlaceType[]>(() => home?.placeTypes ?? [], [home?.placeTypes]);
  const { city: defaultCity } = useSelectedCity();

  // City defaults to Riyadh, so open straight on the Type box (or Area when
  // arriving from a home quick-type tile).
  const [expanded, setExpanded] = useState<CardKey>(typeId ? 'area' : 'type');
  const [city, setCity] = useState<ApiCity | null>(null);
  const [types, setTypes] = useState<ApiPlaceType[]>([]);
  const [availableAreas, setAvailableAreas] = useState<ApiCityArea[]>([]);
  const [areas, setAreas] = useState<ApiCityArea[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const typesInited = useRef(false);
  // Arrived from a quick-type tile → jump to Area as soon as the city's areas
  // are available (they load a tick after the default city is set).
  const wantArea = useRef(!!typeId);

  const overlay = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    overlay.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 18, stiffness: 220, mass: 0.8 });
  }, [overlay, scale]);

  // Default the city to the globally-selected one once bootstrap data lands.
  useEffect(() => {
    if (!city && defaultCity) setCity(defaultCity);
  }, [city, defaultCity]);

  // Types start unselected — unless the user arrived from a home quick-type
  // tile, in which case just that one is pre-selected.
  useEffect(() => {
    if (typesInited.current || placeTypes.length === 0) return;
    typesInited.current = true;
    if (typeId) {
      const picked = placeTypes.find((p) => p.id === typeId);
      if (picked) setTypes([picked]);
    }
  }, [placeTypes, typeId]);

  // Areas ship inline with the selected city. Start unselected; a city with no
  // areas simply hides the Area box.
  useEffect(() => {
    setAvailableAreas(city?.areas ?? []);
    setAreas([]);
  }, [city?.id, city?.areas]);

  // Open Area once it has options (for the quick-type entry); if the city has
  // no areas, fall back to Type.
  useEffect(() => {
    if (wantArea.current && availableAreas.length > 0) {
      wantArea.current = false;
      setExpanded('area');
    }
  }, [availableAreas.length]);
  useEffect(() => {
    if (expanded === 'area' && availableAreas.length === 0) setExpanded('type');
  }, [expanded, availableAreas.length]);

  const close = () => {
    scale.value = withTiming(0.96, { duration: 220, easing: Easing.in(Easing.cubic) });
    overlay.value = withTiming(
      0,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(router.back)();
      },
    );
  };

  const reset = () => {
    fireHaptic('select');
    setCity(defaultCity ?? null);
    setTypes([]);
    setAreas([]);
    setSearchFocused(false);
    setExpanded('type');
    setResetKey((k) => k + 1);
  };

  const cityLabel = city
    ? locale === 'ar'
      ? city.name_ar
      : city.name_en
    : t({ ar: 'اختر مدينة', en: 'Pick a city' });

  const handleSearch = () => {
    // The applied-filters store is the single source of truth for the query;
    // a new search resets the advanced filters (price/guests/amenities).
    const filters = {
      cityId: city?.id ?? '',
      cityLabel,
      typeIds: types.map((p) => p.id),
      areaIds: areas.map((a) => a.id),
      amenityIds: [],
      priceMin: null,
      priceMax: null,
      guests: null,
    };
    setAppliedFilters(filters);
    // Remember it locally so the home screen can offer to resume this search.
    void saveLastSearch({
      filters,
      city: city ? { ar: city.name_ar, en: city.name_en } : null,
      areas: areas.map((a) => ({ ar: a.name_ar, en: a.name_en })),
      types: types.map((p) => ({ ar: p.name_ar, en: p.name_en })),
      // Filled in once results load (top-rated places' photos) — see results.tsx.
      thumbs: [],
    });
    router.replace('/results');
  };

  const toggle = (key: CardKey) => {
    setExpanded((prev) => (prev === key ? ('' as unknown as CardKey) : key));
  };

  const toggleType = (id: string) =>
    setTypes((prev) =>
      prev.some((p) => p.id === id)
        ? prev.filter((p) => p.id !== id)
        : placeTypes.filter((p) => p.id === id || prev.some((x) => x.id === p.id)),
    );
  const toggleAllTypes = () =>
    setTypes((prev) => (prev.length === placeTypes.length ? [] : placeTypes));

  const toggleArea = (id: string) =>
    setAreas((prev) =>
      prev.some((a) => a.id === id)
        ? prev.filter((a) => a.id !== id)
        : availableAreas.filter((a) => a.id === id || prev.some((x) => x.id === a.id)),
    );
  const toggleAllAreas = () =>
    setAreas((prev) => (prev.length === availableAreas.length ? [] : availableAreas));

  const typeItems = useMemo(
    () =>
      placeTypes.map((p) => ({
        id: p.id,
        label: locale === 'ar' ? p.name_ar : p.name_en,
        emoji: p.icon,
      })),
    [placeTypes, locale],
  );
  const areaItems = useMemo(
    () =>
      availableAreas.map((a) => ({
        id: a.id,
        label: locale === 'ar' ? a.name_ar : a.name_en,
      })),
    [availableAreas, locale],
  );

  const typeLabel = useMemo(() => {
    if (placeTypes.length && types.length === placeTypes.length) return t({ ar: 'كل الأنواع', en: 'All types' });
    if (types.length === 0) return t({ ar: 'اختر نوع', en: 'Pick a type' });
    if (types.length === 1) return locale === 'ar' ? types[0].name_ar : types[0].name_en;
    return `${types.length} ${t({ ar: 'أنواع', en: 'types' })}`;
  }, [types, placeTypes, locale, t]);

  const areaLabel = useMemo(() => {
    if (availableAreas.length && areas.length === availableAreas.length) return t({ ar: 'كل المناطق', en: 'All areas' });
    if (areas.length === 0) return t({ ar: 'اختر منطقة', en: 'Pick an area' });
    if (areas.length === 1) return locale === 'ar' ? areas[0].name_ar : areas[0].name_en;
    return `${areas.length} ${t({ ar: 'مناطق', en: 'areas' })}`;
  }, [areas, availableAreas, locale, t]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
      <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.tint} pointerEvents="none" />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          fireHaptic('back');
          close();
        }}
      />

      <Animated.View
        style={[
          styles.frame,
          { paddingTop: insets.top + Spacing[3], paddingBottom: insets.bottom + Spacing[3] },
          contentStyle,
        ]}
        pointerEvents="box-none">
        {/* Header: X (start) + calm logo (absolutely centered) */}
        <View style={styles.header} pointerEvents="box-none">
          <PressableScale onPress={close} scaleTo={0.88} haptic="back" style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.logoCenter} pointerEvents="none">
            <Image source={require('@/assets/logo/logo.png')} style={styles.logo} contentFit="contain" />
          </View>
        </View>

        {/* Stacked cards */}
        <View style={styles.cardsCol}>
          <ExpandableCard
            label={t({ ar: 'وين ؟', en: 'Where?' })}
            value={cityLabel}
            expanded={expanded === 'where'}
            edgeToEdge={expanded === 'where' && searchFocused}
            onToggle={() => toggle('where')}>
            <WhereContent
              key={resetKey}
              value={city}
              onChange={setCity}
              onFocusChange={setSearchFocused}
              onConfirm={() => {
                setSearchFocused(false);
                setExpanded('type');
              }}
            />
          </ExpandableCard>

          <ExpandableCard
            label={t({ ar: 'نوع المكان ؟', en: 'Type of place?' })}
            value={typeLabel}
            expanded={expanded === 'type'}
            onToggle={() => toggle('type')}>
            <MultiSelectContent
              items={typeItems}
              selectedIds={types.map((p) => p.id)}
              onToggle={toggleType}
              onToggleAll={toggleAllTypes}
              subtitle={t({ ar: 'اختر نوعاً أو أكثر', en: 'Pick one or more types' })}
              onNext={() => (availableAreas.length > 0 ? setExpanded('area') : handleSearch())}
              nextLabel={
                availableAreas.length > 0
                  ? t({ ar: 'التالي', en: 'Next' })
                  : t({ ar: 'ابحث', en: 'Search' })
              }
            />
          </ExpandableCard>

          {availableAreas.length > 0 ? (
            <ExpandableCard
              label={t({ ar: 'المنطقة ؟', en: 'Area?' })}
              value={areaLabel}
              expanded={expanded === 'area'}
              onToggle={() => toggle('area')}>
              <MultiSelectContent
                items={areaItems}
                selectedIds={areas.map((a) => a.id)}
                onToggle={toggleArea}
                onToggleAll={toggleAllAreas}
                subtitle={t({ ar: 'اختر منطقة أو أكثر', en: 'Pick one or more areas' })}
                onNext={handleSearch}
                nextLabel={t({ ar: 'ابحث', en: 'Search' })}
              />
            </ExpandableCard>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={reset} hitSlop={Spacing[3]}>
            <ThemedText style={[styles.resetText, { fontFamily: fontFamilyFor('medium', locale) }]}>
              {t({ ar: 'امسح الكل', en: 'Clear all' })}
            </ThemedText>
          </Pressable>
          <PressableScale onPress={handleSearch} scaleTo={0.95} haptic="forward" style={styles.searchBtn}>
            <MagnifierIcon size={16} color="#FFFFFF" />
            <ThemedText style={[styles.searchText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'ابحث', en: 'Search' })}
            </ThemedText>
          </PressableScale>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  frame: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },
  header: {
    height: 48,
    justifyContent: 'center',
    paddingBottom: Spacing[4],
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  logoCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 80, height: 32 },

  cardsCol: {
    flex: 1,
    gap: Spacing[3],
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
  },
  resetText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    textDecorationLine: 'underline',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: Colors.light.coral,
    shadowColor: Colors.light.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  searchText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
});
