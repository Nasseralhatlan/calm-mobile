import { StyleSheet, View } from 'react-native';

import { BlurredModalShell } from '@/components/blurred-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

export default function DatesModal() {
  const { locale } = useLocale();
  const t = useT();

  return (
    <BlurredModalShell title={t({ ar: 'اختر التواريخ', en: 'Choose dates' })}>
      <View style={styles.placeholder}>
        <ThemedText
          style={[styles.emoji, { fontFamily: fontFamilyFor('regular', locale) }]}>
          📅
        </ThemedText>
        <ThemedText
          style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {t({ ar: 'التقويم قادم قريباً', en: 'Calendar coming soon' })}
        </ThemedText>
        <ThemedText
          style={[styles.body, { fontFamily: fontFamilyFor('regular', locale) }]}>
          {t({
            ar: 'سنتيح لك اختيار تواريخ الوصول والمغادرة هنا قريباً.',
            en: 'You’ll be able to pick your check-in and check-out dates here soon.',
          })}
        </ThemedText>
      </View>
    </BlurredModalShell>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[3],
  },
  emoji: { fontSize: 48, lineHeight: 56 },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: Colors.light.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});
