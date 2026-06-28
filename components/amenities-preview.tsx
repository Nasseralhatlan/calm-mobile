import { StyleSheet, View } from 'react-native';

import { AmenityIcon } from '@/components/amenity-icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { AMENITIES } from '@/data/amenities';
import type { AmenityId } from '@/data/types';
import { useLocale, useRtlText, useT } from '@/lib/i18n';

interface AmenitiesPreviewProps {
  amenities: AmenityId[];
  previewCount?: number;
  onShowAll?: () => void;
}

export function AmenitiesPreview({ amenities, previewCount = 6, onShowAll }: AmenitiesPreviewProps) {
  const { locale } = useLocale();
  const rtl = useRtlText();
  const t = useT();
  const visible = amenities.slice(0, previewCount);
  const remaining = Math.max(amenities.length - previewCount, 0);

  return (
    <View>
      <View style={styles.list}>
        {visible.map((id) => (
          <View key={id} style={styles.row}>
            <AmenityIcon id={id} size={22} />
            <ThemedText
              style={[styles.label, rtl, { fontFamily: fontFamilyFor('regular', locale) }]}
              numberOfLines={1}>
              {t(AMENITIES[id].label)}
            </ThemedText>
          </View>
        ))}
      </View>
      {remaining > 0 ? (
        <PressableScale scaleTo={0.96} onPress={onShowAll} style={styles.cta}>
          <ThemedText
            style={[styles.ctaText, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {t({
              ar: `عرض جميع المرافق (${amenities.length})`,
              en: `Show all ${amenities.length} amenities`,
            })}
          </ThemedText>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing[3],
  },
  row: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    flexShrink: 1,
  },
  cta: {
    marginTop: Spacing[5],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[5],
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.light.text,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
});
