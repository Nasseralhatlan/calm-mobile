import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { I18nManager, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

interface City {
  id: string;
  ar: string;
  en: string;
  emoji: string;
}

const CITIES: City[] = [
  { id: 'riyadh', ar: 'الرياض', en: 'Riyadh', emoji: '🏙️' },
  { id: 'jeddah', ar: 'جدة', en: 'Jeddah', emoji: '🌆' },
  { id: 'dammam', ar: 'الدمام', en: 'Dammam', emoji: '🏖️' },
  { id: 'makkah', ar: 'مكة', en: 'Makkah', emoji: '🕋' },
  { id: 'madinah', ar: 'المدينة', en: 'Madinah', emoji: '🕌' },
  { id: 'taif', ar: 'الطائف', en: 'Taif', emoji: '⛰️' },
  { id: 'alula', ar: 'العلا', en: 'AlUla', emoji: '🏜️' },
];

interface WhereContentProps {
  value: string;
  onChange: (city: string) => void;
  onFocusChange?: (focused: boolean) => void;
  onConfirm?: () => void;
}

export function WhereContent({ value, onChange, onFocusChange, onConfirm }: WhereContentProps) {
  const { locale } = useLocale();
  const t = useT();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(
      (c) => c.ar.includes(q) || c.en.toLowerCase().includes(q),
    );
  }, [query]);

  const handlePickCity = (city: City) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(locale === 'ar' ? city.ar : city.en);
    onConfirm?.();
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t({ ar: 'ابحث عن مدينة', en: 'Search a city' })}
        placeholderTextColor="#D3D3D3"
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        style={[styles.input, { fontFamily: fontFamilyFor('regular', locale) }]}
        textAlign={locale === 'ar' ? 'right' : 'left'}
      />

      <ThemedText
        style={[styles.subtitle, { fontFamily: fontFamilyFor('regular', locale) }]}>
        {t({ ar: 'اشهر الوجهات', en: 'Popular destinations' })}
      </ThemedText>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {filtered.map((city) => {
          const cityName = locale === 'ar' ? city.ar : city.en;
          const selected = cityName === value;
          return (
            <PressableScale
              key={city.id}
              scaleTo={0.96}
              onPress={() => handlePickCity(city)}
              style={[
                styles.row,
                { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse' },
              ]}>
              <View style={styles.iconBox}>
                <ThemedText style={styles.iconEmoji}>{city.emoji}</ThemedText>
              </View>
              <ThemedText
                style={[
                  styles.cityName,
                  selected && { color: Colors.light.coral },
                  { fontFamily: fontFamilyFor('bold', locale) },
                ]}>
                {cityName}
              </ThemedText>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing[3] },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[5],
    fontSize: 15,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: Spacing[3],
  },
  list: {
    gap: Spacing[4],
    paddingBottom: Spacing[4],
    paddingTop: Spacing[2],
  },
  row: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing[3],
  },
  cityName: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
    flexShrink: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconEmoji: { fontSize: 20, lineHeight: 24 },
});
