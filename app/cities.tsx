import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, I18nManager, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedField } from '@/components/animated-field';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useHomeData } from '@/data/home';
import { useSelectedCity } from '@/data/selected-city';
import type { ApiCity } from '@/lib/api';
import { fireHaptic } from '@/lib/haptics';
import { useLocale, useT } from '@/lib/i18n';

export default function CitiesModal() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();

  const home = useHomeData();
  const cities = home?.cities ?? [];
  const { city: selected, setCity } = useSelectedCity();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name_en.toLowerCase().includes(q) || c.name_ar.includes(q),
    );
  }, [cities, query]);

  const pick = (c: ApiCity) => {
    fireHaptic('select');
    setCity(c);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <PressableScale
          onPress={() => {
            fireHaptic('back');
            router.back();
          }}
          scaleTo={0.88}
          haptic="none"
          style={styles.closeBtn}>
          <IconSymbol name="xmark" size={18} color={Colors.light.text} />
        </PressableScale>
        <View style={styles.titleCenter} pointerEvents="none">
          <ThemedText
            style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}
            numberOfLines={1}>
            {t({ ar: 'اختر مدينتك', en: 'Choose a city' })}
          </ThemedText>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <AnimatedField focused={searchFocused} style={styles.searchBox}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={t({ ar: 'ابحث عن المدينة', en: 'Search city' })}
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
            autoComplete="off"
            style={[
              styles.searchInput,
              {
                fontFamily: fontFamilyFor('bold', locale),
                textAlign: 'right',
                writingDirection: 'rtl',
              },
            ]}
          />
        </AnimatedField>
      </View>

      {cities.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText
            style={[styles.emptyText, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {t({ ar: 'تعذر تحميل المدن', en: 'Could not load cities' })}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={
            filtered.length % 2 === 1
              ? ([
                  ...filtered,
                  { id: '__spacer__', __spacer: true } as ApiCity & {
                    __spacer?: boolean;
                  },
                ] as ApiCity[])
              : filtered
          }
          numColumns={2}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => {
            if ('__spacer' in item && (item as { __spacer?: boolean }).__spacer) {
              return <View style={styles.cardSpacer} />;
            }
            const isSelected = selected?.id === item.id;
            return (
              <PressableScale
                scaleTo={0.97}
                haptic="none"
                onPress={() => pick(item)}
                style={isSelected ? [styles.card, styles.cardSelected] : styles.card}>
                <ThemedText style={styles.flag}>{item.avatar}</ThemedText>
                <ThemedText
                  numberOfLines={2}
                  style={[
                    styles.name,
                    { fontFamily: fontFamilyFor('bold', locale) },
                  ]}>
                  {locale === 'ar' ? item.name_ar : item.name_en}
                </ThemedText>
              </PressableScale>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[5],
    justifyContent: 'center',
    minHeight: 88,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  titleCenter: {
    position: 'absolute',
    left: Spacing[16],
    right: Spacing[16],
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, lineHeight: 22, color: Colors.light.text },

  searchWrap: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
  },
  searchBox: {
    height: 66,
    paddingHorizontal: Spacing[4],
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchInput: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    padding: 0,
  },

  gridContent: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[10],
    gap: Spacing[3],
  },
  columnWrapper: {
    gap: Spacing[3],
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
  },
  card: {
    flex: 1,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 25,
    elevation: 6,
  },
  cardSelected: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  cardSpacer: {
    flex: 1,
    height: 130,
    backgroundColor: 'transparent',
  },
  flag: { fontSize: 26, lineHeight: 30 },
  name: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
});
