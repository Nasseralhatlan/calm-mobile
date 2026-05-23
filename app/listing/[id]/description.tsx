import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { PlainModalShell } from '@/components/plain-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { getListing } from '@/data/listings';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';

export default function DescriptionModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const listing = getListing(id);

  if (!listing) return null;

  return (
    <PlainModalShell title={t({ ar: 'الوصف', en: 'Description' })}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <ThemedText
          style={[
            styles.body,
            {
              fontFamily: fontFamilyFor('regular', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {t(listing.description)}
        </ThemedText>
      </ScrollView>
    </PlainModalShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: Spacing[3],
    paddingBottom: Spacing[10],
  },
  body: {
    fontSize: 14,
    lineHeight: 24,
    color: TEXT_PRIMARY,
  },
});
