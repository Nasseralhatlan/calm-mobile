import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
}

interface WhoContentProps {
  value: GuestCounts;
  onChange: (next: GuestCounts) => void;
}

export function WhoContent({ value, onChange }: WhoContentProps) {
  const { locale } = useLocale();
  const t = useT();

  const change = (key: keyof GuestCounts, delta: number, min: number, max: number) => {
    const next = Math.max(min, Math.min(max, value[key] + delta));
    if (next === value[key]) return;
    Haptics.selectionAsync().catch(() => {});
    onChange({ ...value, [key]: next });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.rows}>
        <CounterRow
          label={t({ ar: 'بالغين', en: 'Adults' })}
          subLabel={t({ ar: '13 سنة فما فوق', en: 'Ages 13 and up' })}
          count={value.adults}
          onDec={() => change('adults', -1, 1, 16)}
          onInc={() => change('adults', 1, 1, 16)}
          decDisabled={value.adults <= 1}
        />
        <CounterRow
          label={t({ ar: 'أطفال', en: 'Children' })}
          subLabel={t({ ar: '2-12 سنة', en: 'Ages 2-12' })}
          count={value.children}
          onDec={() => change('children', -1, 0, 10)}
          onInc={() => change('children', 1, 0, 10)}
          decDisabled={value.children <= 0}
        />
        <CounterRow
          label={t({ ar: 'رضّع', en: 'Infants' })}
          subLabel={t({ ar: 'أقل من سنتين', en: 'Under 2' })}
          count={value.infants}
          onDec={() => change('infants', -1, 0, 5)}
          onInc={() => change('infants', 1, 0, 5)}
          decDisabled={value.infants <= 0}
        />
      </View>
    </View>
  );
}

function CounterRow({
  label,
  subLabel,
  count,
  onDec,
  onInc,
  decDisabled,
}: {
  label: string;
  subLabel: string;
  count: number;
  onDec: () => void;
  onInc: () => void;
  decDisabled?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.controls}>
        <CircleButton sign="−" onPress={onDec} disabled={decDisabled} />
        <ThemedText
          style={[
            rowStyles.count,
            { fontFamily: fontFamilyFor('bold', locale) },
          ]}>
          {count}
        </ThemedText>
        <CircleButton sign="+" onPress={onInc} />
      </View>
      <View style={rowStyles.labelCol}>
        <ThemedText
          style={[rowStyles.label, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {label}
        </ThemedText>
        <ThemedText
          style={[rowStyles.sub, { fontFamily: fontFamilyFor('regular', locale) }]}>
          {subLabel}
        </ThemedText>
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
      style={[btnStyles.btn, disabled && btnStyles.btnDisabled]}>
      <ThemedText
        style={[
          btnStyles.text,
          disabled && btnStyles.textDisabled,
        ]}>
        {sign}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  rows: {
    marginTop: Spacing[1],
    gap: Spacing[4],
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  labelCol: {
    flexShrink: 1,
    alignItems: 'flex-end',
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
  },
  count: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
    minWidth: 20,
    textAlign: 'center',
  },
});

const btnStyles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    borderColor: Colors.light.divider,
  },
  text: {
    fontSize: 18,
    lineHeight: 22,
    color: Colors.light.text,
  },
  textDisabled: {
    color: Colors.light.textMuted,
  },
});
