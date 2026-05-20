import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AmenityIcon } from '@/components/amenity-icon';
import { BlurredModalShell } from '@/components/blurred-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { AMENITIES } from '@/data/amenities';
import { getListing } from '@/data/listings';
import { useLocale, useT } from '@/lib/i18n';

export default function AmenitiesModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const t = useT();
  const listing = getListing(id);

  return (
    <BlurredModalShell title={t({ ar: 'كل المرافق', en: 'All amenities' })}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {listing?.amenities.map((aid) => (
          <View key={aid} style={styles.row}>
            <AmenityIcon id={aid} size={22} />
            <ThemedText
              style={[styles.label, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {t(AMENITIES[aid].label)}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </BlurredModalShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing[3], paddingBottom: Spacing[6] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
  },
});
