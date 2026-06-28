import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

export interface MultiSelectItem {
  id: string;
  label: string;
  /** Optional leading emoji/glyph shown on the chip. */
  emoji?: string;
}

interface MultiSelectContentProps {
  items: MultiSelectItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Select-all when not all are selected, otherwise clear. */
  onToggleAll: () => void;
  subtitle?: string;
  /** Advance to the next box. Shown as a full-width button when provided. */
  onNext?: () => void;
  nextLabel?: string;
}

function Chip({
  item,
  selected,
  onPress,
  rowDir,
  locale,
}: {
  item: MultiSelectItem;
  selected: boolean;
  onPress: () => void;
  rowDir: 'row' | 'row-reverse';
  locale: 'ar' | 'en';
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 180 });
  }, [selected, progress]);

  const animStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], ['#DDDDDD', '#000000']),
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#FFFFFF', '#F7F7F7']),
  }));

  return (
    <PressableScale scaleTo={0.95} onPress={onPress}>
      <Animated.View style={[styles.chip, { flexDirection: rowDir }, animStyle]}>
        {item.emoji ? <ThemedText style={styles.emoji}>{item.emoji}</ThemedText> : null}
        <ThemedText
          numberOfLines={1}
          style={[
            styles.label,
            { fontFamily: fontFamilyFor(selected ? 'bold' : 'medium', locale) },
            selected && styles.labelSelected,
          ]}>
          {item.label}
        </ThemedText>
      </Animated.View>
    </PressableScale>
  );
}

export function MultiSelectContent({
  items,
  selectedIds,
  onToggle,
  onToggleAll,
  subtitle,
  onNext,
  nextLabel,
}: MultiSelectContentProps) {
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';
  const rowDir = 'row' as const;
  // Nothing picked = no filter on this box, i.e. "show all".
  const noneSelected = selectedIds.length === 0;

  const tap = (fn: () => void) => {
    Haptics.selectionAsync().catch(() => {});
    fn();
  };

  return (
    <View style={styles.wrap}>
      <ThemedText
        style={[
          styles.subtitle,
          { fontFamily: fontFamilyFor('regular', locale), textAlign: 'left' },
        ]}>
        {subtitle ?? t({ ar: 'اختر واحداً أو أكثر', en: 'Pick one or more' })}
      </ThemedText>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.chips, { flexDirection: rowDir }]}
        keyboardShouldPersistTaps="handled">
        {items.map((item) => (
          <Chip
            key={item.id}
            item={item}
            selected={selectedIds.includes(item.id)}
            onPress={() => tap(() => onToggle(item.id))}
            rowDir={rowDir}
            locale={locale}
          />
        ))}
      </ScrollView>

      {onNext ? (
        <View style={styles.footer}>
          <PressableScale haptic="forward" scaleTo={0.98} onPress={onNext} style={styles.nextBtn}>
            <ThemedText style={[styles.nextText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {noneSelected
                ? t({ ar: 'التالي · اعرض الكل', en: 'Next · Show all' })
                : (nextLabel ?? t({ ar: 'التالي', en: 'Next' }))}
            </ThemedText>
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing[2] },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textMuted,
    flexShrink: 1,
  },
  footer: {
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  chips: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    gap: Spacing[2] + 2,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
  },
  chip: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: 999,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  emoji: { fontSize: 17, lineHeight: 22 },
  label: {
    fontSize: 14,
    lineHeight: 19,
    color: Colors.light.text,
  },
  labelSelected: { color: '#000000' },
  nextBtn: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4],
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
});
