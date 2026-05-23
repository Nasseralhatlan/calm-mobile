import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AmenityIcon } from '@/components/amenity-icon';
import { PlainModalShell } from '@/components/plain-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { AMENITIES } from '@/data/amenities';
import { getListing } from '@/data/listings';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const DIVIDER_COLOR = '#F4F4F4';

export default function AmenitiesModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const t = useT();
  const listing = getListing(id);
  const isRTL = locale === 'ar';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  return (
    <PlainModalShell title={t({ ar: 'كل المميزات', en: 'All features' })}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {listing?.amenities.map((aid) => (
          <View key={aid} style={[styles.row, { flexDirection: rowDir }]}>
            <AmenityIcon id={aid} size={20} />
            <ThemedText
              style={[
                styles.label,
                {
                  fontFamily: fontFamilyFor('regular', locale),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}>
              {t(AMENITIES[aid].label)}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </PlainModalShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing[10] },
  row: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER_COLOR,
  },
  label: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    flex: 1,
  },
});
