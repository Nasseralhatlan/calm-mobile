import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PlainModalShell } from '@/components/plain-modal-shell';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DIVIDER = '#EBEBEB';
const SURFACE = '#F4F4F4';

interface City {
  id: string;
  ar: string;
  en: string;
  emoji: string;
  hint: { ar: string; en: string };
}

const CITIES: City[] = [
  { id: 'riyadh', ar: 'الرياض', en: 'Riyadh', emoji: '🏙️', hint: { ar: 'العاصمة', en: 'Capital' } },
  { id: 'jeddah', ar: 'جدة', en: 'Jeddah', emoji: '🌆', hint: { ar: 'الساحل', en: 'Coast' } },
  { id: 'dammam', ar: 'الدمام', en: 'Dammam', emoji: '🏖️', hint: { ar: 'الشرقية', en: 'Eastern' } },
  { id: 'makkah', ar: 'مكة', en: 'Makkah', emoji: '🕋', hint: { ar: 'الحرم', en: 'Holy city' } },
  { id: 'madinah', ar: 'المدينة', en: 'Madinah', emoji: '🕌', hint: { ar: 'المنورة', en: 'Madinah' } },
  { id: 'taif', ar: 'الطائف', en: 'Taif', emoji: '⛰️', hint: { ar: 'الجبال', en: 'Mountains' } },
  { id: 'alula', ar: 'العلا', en: 'AlUla', emoji: '🏜️', hint: { ar: 'الصحراء', en: 'Desert' } },
  { id: 'abha', ar: 'أبها', en: 'Abha', emoji: '🌲', hint: { ar: 'الجنوب', en: 'South' } },
  { id: 'tabuk', ar: 'تبوك', en: 'Tabuk', emoji: '🏔️', hint: { ar: 'الشمال', en: 'North' } },
  { id: 'khobar', ar: 'الخبر', en: 'Khobar', emoji: '🌊', hint: { ar: 'كورنيش', en: 'Corniche' } },
];

export default function CitiesModal() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';

  const pick = (city: City) => {
    router.replace({
      pathname: '/results',
      params: { city: locale === 'ar' ? city.ar : city.en },
    });
  };

  return (
    <PlainModalShell title={t({ ar: 'اختر مدينتك', en: 'Choose a city' })}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {CITIES.map((c) => (
          <PressableScale
            key={c.id}
            haptic="select"
            scaleTo={0.98}
            onPress={() => pick(c)}
            style={[
              styles.row,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}>
            <View style={styles.emojiTile}>
              <ThemedText style={styles.emoji}>{c.emoji}</ThemedText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.cityName,
                  {
                    fontFamily: fontFamilyFor('bold', locale),
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                ]}>
                {locale === 'ar' ? c.ar : c.en}
              </ThemedText>
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.cityHint,
                  {
                    fontFamily: fontFamilyFor('regular', locale),
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                ]}>
                {t(c.hint)}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.chevron, isRTL ? styles.chevronRTL : styles.chevronLTR]}>
              ›
            </ThemedText>
          </PressableScale>
        ))}
      </ScrollView>
    </PlainModalShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: Spacing[3],
    paddingBottom: Spacing[10],
    gap: Spacing[2],
  },
  row: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
  },
  emojiTile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  cityName: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  cityHint: {
    fontSize: 12,
    lineHeight: 16,
    color: TEXT_SECONDARY,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 24,
    color: '#CECECE',
    paddingHorizontal: Spacing[2],
  },
  chevronLTR: {},
  chevronRTL: { transform: [{ scaleX: -1 }] },
});
