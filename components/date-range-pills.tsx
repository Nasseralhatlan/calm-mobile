import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

interface DateRangePillsProps {
  checkIn: string;
  checkOut: string;
  onPress: () => void;
}

export function DateRangePills({ checkIn, checkOut, onPress }: DateRangePillsProps) {
  const { locale } = useLocale();
  const t = useT();

  return (
    <View style={styles.row}>
      <PressableScale scaleTo={0.97} onPress={onPress} style={styles.pill}>
        <ThemedText
          style={[styles.label, { fontFamily: fontFamilyFor('regular', locale) }]}>
          {t({ ar: 'تاريخ الوصول', en: 'Check-in' })}
        </ThemedText>
        <ThemedText
          style={[styles.value, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {checkIn}
        </ThemedText>
      </PressableScale>
      <PressableScale scaleTo={0.97} onPress={onPress} style={styles.pill}>
        <ThemedText
          style={[styles.label, { fontFamily: fontFamilyFor('regular', locale) }]}>
          {t({ ar: 'تاريخ المغادرة', en: 'Check-out' })}
        </ThemedText>
        <ThemedText
          style={[styles.value, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {checkOut}
        </ThemedText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  pill: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 4,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.textMuted,
  },
  value: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.text,
  },
});
