import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
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

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.counterRow,
          { flexDirection: 'row' },
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
  wrap: { flex: 1 },
  counterRow: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
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
