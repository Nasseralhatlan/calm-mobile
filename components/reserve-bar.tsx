import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { formatPriceSR } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

interface ReserveBarProps {
  halalas: number;
  onReserve: () => void;
}

export function ReserveBar({ halalas, onReserve }: ReserveBarProps) {
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const t = useT();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + Spacing[2] }]}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={styles.tint} pointerEvents="none" />
      <View style={styles.row}>
        <View style={styles.priceCol}>
          <ThemedText
            style={[styles.price, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {formatPriceSR(halalas)}
          </ThemedText>
          <ThemedText
            style={[styles.unit, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {t({ ar: 'لليلة', en: 'per night' })}
          </ThemedText>
        </View>
        <PressableScale onPress={onReserve} scaleTo={0.96} haptic="forward" style={styles.cta}>
          <ThemedText
            style={[styles.ctaText, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {t({ ar: 'احجز الآن', en: 'Reserve' })}
          </ThemedText>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 6,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  priceCol: {
    flex: 1,
  },
  price: {
    fontSize: 17,
    lineHeight: 22,
    color: Colors.light.text,
  },
  unit: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  cta: {
    backgroundColor: Colors.light.coral,
    paddingHorizontal: Spacing[6] * 2,
    paddingVertical: Spacing[3] * 1.2,
    borderRadius: 15,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
});
