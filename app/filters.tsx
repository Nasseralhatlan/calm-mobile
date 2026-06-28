import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { RangeSlider } from '@/components/range-slider';
import { Spinner } from '@/components/spinner';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { getAppliedFilters, patchAppliedFilters } from '@/data/search-filters';
import { getPlaceFilters, type ApiPlaceFilters } from '@/lib/api';
import { formatSar } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';

function Chip({
  label,
  count,
  selected,
  onPress,
  locale,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onPress: () => void;
  locale: 'ar' | 'en';
}) {
  return (
    <PressableScale
      scaleTo={0.95}
      haptic="select"
      onPress={onPress}
      style={selected ? [styles.chip, styles.chipOn] : styles.chip}>
      <ThemedText
        style={[
          selected ? styles.chipTextOn : styles.chipText,
          { fontFamily: fontFamilyFor(selected ? 'bold' : 'medium', locale) },
        ]}>
        {label}
        {count != null ? ` (${count})` : ''}
      </ThemedText>
    </PressableScale>
  );
}

function Stepper({ sign, onPress }: { sign: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} haptic="select" style={styles.stepBtn}>
      <ThemedText style={styles.stepText}>{sign}</ThemedText>
    </PressableScale>
  );
}

export default function FiltersModal() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const rowDir = 'row' as const;
  const align = 'left' as const;

  const applied = getAppliedFilters();

  const [filters, setFilters] = useState<ApiPlaceFilters | null>(null);
  const [loading, setLoading] = useState(true);

  const [types, setTypes] = useState<string[]>(applied.typeIds);
  const [areas, setAreas] = useState<string[]>(applied.areaIds);
  const [amenities, setAmenities] = useState<string[]>(applied.amenityIds);
  const [priceMin, setPriceMin] = useState<number | null>(applied.priceMin);
  const [priceMax, setPriceMax] = useState<number | null>(applied.priceMax);
  const [guests, setGuests] = useState<number | null>(applied.guests);

  useEffect(() => {
    if (!applied.cityId) {
      setLoading(false);
      return;
    }
    let active = true;
    getPlaceFilters(applied.cityId)
      .then((res) => {
        if (!active) return;
        setFilters(res);
        setPriceMin((p) => p ?? res.price.min);
        setPriceMax((p) => p ?? res.price.max);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applied.cityId]);

  const toggle = (id: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const clearAll = () => {
    setTypes([]);
    setAreas([]);
    setAmenities([]);
    setGuests(null);
    if (filters) {
      setPriceMin(filters.price.min);
      setPriceMax(filters.price.max);
    }
  };

  const apply = () => {
    const bounds = filters?.price;
    patchAppliedFilters({
      typeIds: types,
      areaIds: areas,
      amenityIds: amenities,
      priceMin: bounds && priceMin != null && priceMin > bounds.min ? priceMin : null,
      priceMax: bounds && priceMax != null && priceMax < bounds.max ? priceMax : null,
      guests,
    });
    router.back();
  };

  const name = (o: { name_ar: string; name_en: string }) =>
    locale === 'ar' ? o.name_ar : o.name_en;

  const SectionTitle = ({ children }: { children: string }) => (
    <ThemedText
      style={[
        styles.sectionTitle,
        { fontFamily: fontFamilyFor('bold', locale), textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' },
      ]}>
      {children}
    </ThemedText>
  );

  const guestsLabel = useMemo(
    () => (guests == null ? t({ ar: 'أي عدد', en: 'Any' }) : `${guests}+`),
    [guests, t],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} scaleTo={0.88} haptic="back" style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={TEXT_PRIMARY} />
          </PressableScale>
          <View style={styles.titleCenter} pointerEvents="none">
            <ThemedText style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'الفلاتر', en: 'Filters' })}
            </ThemedText>
          </View>
          <Pressable onPress={clearAll} hitSlop={Spacing[3]} style={styles.clearBtn}>
            <ThemedText style={[styles.clearText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'مسح', en: 'Clear' })}
            </ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <Spinner size={26} color={Colors.light.coral} trackColor="rgba(248,131,121,0.18)" />
          </View>
        ) : !filters ? (
          <View style={styles.center}>
            <ThemedText style={[styles.empty, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {t({ ar: 'تعذر تحميل الفلاتر', en: 'Could not load filters' })}
            </ThemedText>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Price */}
            {filters.price.max > filters.price.min ? (
              <View style={styles.section}>
                <View style={[styles.sectionHead, { flexDirection: rowDir }]}>
                  <SectionTitle>{t({ ar: 'السعر / ليلة', en: 'Price / night' })}</SectionTitle>
                  <ThemedText style={[styles.rangeText, { fontFamily: fontFamilyFor('medium', locale) }]}>
                    {formatSar(priceMin ?? filters.price.min)} – {formatSar(priceMax ?? filters.price.max)}
                  </ThemedText>
                </View>
                <RangeSlider
                  min={filters.price.min}
                  max={filters.price.max}
                  valueMin={priceMin ?? filters.price.min}
                  valueMax={priceMax ?? filters.price.max}
                  onChange={(a, b) => {
                    setPriceMin(a);
                    setPriceMax(b);
                  }}
                />
              </View>
            ) : null}

            {/* Guests */}
            {filters.guests.max >= filters.guests.min ? (
              <View style={styles.section}>
                <SectionTitle>{t({ ar: 'الضيوف', en: 'Guests' })}</SectionTitle>
                <View style={[styles.guestsRow, { flexDirection: rowDir }]}>
                  <ThemedText style={[styles.guestsValue, { fontFamily: fontFamilyFor('bold', locale) }]}>
                    {guestsLabel}
                  </ThemedText>
                  <View style={[styles.stepper, { flexDirection: rowDir }]}>
                    <Stepper
                      sign="−"
                      onPress={() =>
                        setGuests((g) => {
                          if (g == null) return null;
                          const n = g - 1;
                          return n < filters.guests.min ? null : n;
                        })
                      }
                    />
                    <Stepper
                      sign="+"
                      onPress={() =>
                        setGuests((g) => {
                          const n = g == null ? filters.guests.min : g + 1;
                          return Math.min(n, filters.guests.max);
                        })
                      }
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {/* Place types */}
            {filters.place_types.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle>{t({ ar: 'نوع المكان', en: 'Type of place' })}</SectionTitle>
                <View style={[styles.chips, { flexDirection: rowDir }]}>
                  {filters.place_types.map((it) => (
                    <Chip
                      key={it.id}
                      label={`${it.icon} ${name(it)}`}
                      count={it.places_count}
                      selected={types.includes(it.id)}
                      onPress={() => toggle(it.id, setTypes)}
                      locale={locale}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Areas */}
            {filters.areas.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle>{t({ ar: 'المنطقة', en: 'Area' })}</SectionTitle>
                <View style={[styles.chips, { flexDirection: rowDir }]}>
                  {filters.areas.map((it) => (
                    <Chip
                      key={it.id}
                      label={name(it)}
                      count={it.places_count}
                      selected={areas.includes(it.id)}
                      onPress={() => toggle(it.id, setAreas)}
                      locale={locale}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Amenities, grouped */}
            {filters.amenities.map((grp) => (
              <View key={grp.group.id} style={styles.section}>
                <SectionTitle>{name(grp.group)}</SectionTitle>
                <View style={[styles.chips, { flexDirection: rowDir }]}>
                  {grp.items.map((it) => (
                    <Chip
                      key={it.id}
                      label={`${it.icon ? `${it.icon} ` : ''}${name(it)}`}
                      count={it.places_count}
                      selected={amenities.includes(it.id)}
                      onPress={() => toggle(it.id, setAmenities)}
                      locale={locale}
                    />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {!loading && filters ? (
          <View style={styles.footer}>
            <PressableScale onPress={apply} scaleTo={0.98} haptic="forward" style={styles.applyBtn}>
              <ThemedText style={[styles.applyText, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {t({ ar: 'عرض النتائج', en: 'Show results' })}
              </ThemedText>
            </PressableScale>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    justifyContent: 'center',
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
    zIndex: 2,
  },
  titleCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, lineHeight: 24, color: TEXT_PRIMARY },
  clearBtn: { position: 'absolute', insetInlineEnd: Spacing[5], top: Spacing[3], height: 40, justifyContent: 'center' },
  clearText: { fontSize: 14, lineHeight: 18, color: TEXT_PRIMARY, textDecorationLine: 'underline' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  empty: { fontSize: 14, lineHeight: 20, color: TEXT_SECONDARY, textAlign: 'center' },

  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3], paddingBottom: Spacing[6], gap: Spacing[6] },
  section: { gap: Spacing[3] },
  sectionHead: { alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
  rangeText: { fontSize: 13, lineHeight: 18, color: TEXT_SECONDARY },

  chips: { flexWrap: 'wrap', alignItems: 'flex-start', gap: Spacing[2] + 2 },
  chip: {
    paddingVertical: Spacing[2] + 2,
    paddingHorizontal: Spacing[4],
    borderRadius: 999,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  chipOn: { borderColor: '#000000', backgroundColor: '#F7F7F7' },
  chipText: { fontSize: 14, lineHeight: 19, color: Colors.light.text },
  chipTextOn: { fontSize: 14, lineHeight: 19, color: '#000000' },

  guestsRow: { alignItems: 'center', justifyContent: 'space-between' },
  guestsValue: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
  stepper: { alignItems: 'center', gap: Spacing[3] },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 18, lineHeight: 22, color: TEXT_PRIMARY },

  footer: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEEEEE',
  },
  applyBtn: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4],
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21 },
});
