import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import type { Capacity } from '@/data/types';
import { useLocale, useT } from '@/lib/i18n';

interface CapacityPillsProps {
  capacity: Capacity;
}

export function CapacityPills({ capacity }: CapacityPillsProps) {
  const { locale } = useLocale();
  const t = useT();
  const num = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US');

  const items: { emoji: string; value: number; label: string }[] = [
    {
      emoji: '👥',
      value: capacity.guests,
      label: t({ ar: 'ضيف', en: 'guests' }),
    },
    {
      emoji: '🛏️',
      value: capacity.bedrooms,
      label: t({ ar: 'غرف نوم', en: 'bedrooms' }),
    },
    {
      emoji: '🚿',
      value: capacity.bathrooms,
      label: t({ ar: 'حمام', en: 'bathrooms' }),
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((it) => (
        <View key={it.label} style={styles.pill}>
          <ThemedText style={styles.emoji}>{it.emoji}</ThemedText>
          <View style={styles.col}>
            <ThemedText
              style={[styles.value, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {num.format(it.value)}
            </ThemedText>
            <ThemedText
              style={[styles.label, { fontFamily: fontFamilyFor('regular', locale) }]}
              numberOfLines={1}>
              {it.label}
            </ThemedText>
          </View>
        </View>
      ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
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
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  col: {
    flex: 1,
    gap: 0,
  },
  value: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.text,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.textMuted,
  },
});
