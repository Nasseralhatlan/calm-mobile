import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

export interface GuestCounts {
  total: number;
}

interface WhoContentProps {
  value: GuestCounts;
  onChange: (next: GuestCounts) => void;
}

const MIN = 1;
const MAX = 50;

const QUICK_RANGES: { ar: string; en: string; total: number }[] = [
  { ar: 'زوجين', en: 'Couple', total: 2 },
  { ar: 'مجموعة صغيرة', en: 'Small group', total: 5 },
  { ar: 'مجموعة متوسطة', en: 'Medium group', total: 10 },
  { ar: 'مناسبة كبيرة', en: 'Large event', total: 20 },
  { ar: 'تجمع كبير', en: 'Big gathering', total: 30 },
];

export function WhoContent({ value, onChange }: WhoContentProps) {
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';

  const bump = (delta: number) => {
    const next = Math.max(MIN, Math.min(MAX, value.total + delta));
    if (next === value.total) return;
    Haptics.selectionAsync().catch(() => {});
    onChange({ total: next });
  };

  const pickRange = (total: number) => {
    if (total === value.total) return;
    Haptics.selectionAsync().catch(() => {});
    onChange({ total });
  };

  return (
    <View style={styles.wrap}>
      {/* Main counter */}
      <View
        style={[
          styles.counterRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}>
        <View style={{ flex: 1 }}>
          <ThemedText
            style={[
              styles.label,
              {
                fontFamily: fontFamilyFor('bold', locale),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}>
            {t({ ar: 'عدد الضيوف', en: 'Guests' })}
          </ThemedText>
          <ThemedText
            style={[
              styles.sub,
              {
                fontFamily: fontFamilyFor('regular', locale),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}>
            {t({ ar: 'الإجمالي شامل الكبار و الأطفال', en: 'Total adults and children' })}
          </ThemedText>
        </View>
        <View style={styles.controls}>
          <CircleButton sign="−" onPress={() => bump(-1)} disabled={value.total <= MIN} />
          <ThemedText
            style={[
              styles.count,
              { fontFamily: fontFamilyFor('bold', locale) },
            ]}>
            {value.total}
          </ThemedText>
          <CircleButton sign="+" onPress={() => bump(1)} disabled={value.total >= MAX} />
        </View>
      </View>

      {/* Quick range chips */}
      <View style={styles.chipsWrap}>
        <ThemedText
          style={[
            styles.chipsTitle,
            {
              fontFamily: fontFamilyFor('medium', locale),
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}>
          {t({ ar: 'اختيار سريع', en: 'Quick pick' })}
        </ThemedText>
        <View style={styles.chipsRow}>
          {QUICK_RANGES.map((r) => {
            const active = r.total === value.total;
            return (
              <PressableScale
                key={r.en}
                scaleTo={0.94}
                haptic="select"
                onPress={() => pickRange(r.total)}
                style={active ? [styles.chip, styles.chipActive] : styles.chip}>
                <ThemedText
                  style={[
                    styles.chipLabel,
                    active && styles.chipLabelActive,
                    { fontFamily: fontFamilyFor(active ? 'bold' : 'medium', locale) },
                  ]}>
                  {t({ ar: r.ar, en: r.en })}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.chipNumber,
                    active && styles.chipNumberActive,
                    { fontFamily: fontFamilyFor('bold', locale) },
                  ]}>
                  {r.total}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function CircleButton({
  sign,
  onPress,
  disabled,
}: {
  sign: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={disabled ? [styles.btn, styles.btnDisabled] : styles.btn}>
      <ThemedText
        style={disabled ? [styles.btnText, styles.btnTextDisabled] : styles.btnText}>
        {sign}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing[5] },

  counterRow: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
    gap: Spacing[3],
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  sub: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  count: {
    fontSize: 18,
    lineHeight: 22,
    color: Colors.light.text,
    minWidth: 28,
    textAlign: 'center',
  },

  chipsWrap: {
    gap: Spacing[3],
  },
  chipsTitle: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    backgroundColor: '#F4F4F4',
  },
  chipActive: {
    backgroundColor: '#000000',
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 17,
    color: Colors.light.text,
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  chipNumber: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minWidth: 22,
    textAlign: 'center',
  },
  chipNumberActive: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    borderColor: Colors.light.divider,
  },
  btnText: {
    fontSize: 18,
    lineHeight: 22,
    color: Colors.light.text,
  },
  btnTextDisabled: {
    color: Colors.light.textMuted,
  },
});
