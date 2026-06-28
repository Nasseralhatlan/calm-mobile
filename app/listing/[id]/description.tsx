import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { PlainModalShell } from '@/components/plain-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { useListingForId } from '@/hooks/use-listing-for-id';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_MUTED = '#9CA3AF';

export default function DescriptionModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const { listing } = useListingForId(id);

  return (
    <PlainModalShell title={t({ ar: 'الوصف', en: 'Description' })}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {listing ? (
          <ThemedText
            style={[
              styles.body,
              {
                fontFamily: fontFamilyFor('regular', locale),
                textAlign: 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}>
            {t(listing.description)}
          </ThemedText>
        ) : (
          <ThemedText
            style={[
              styles.empty,
              { fontFamily: fontFamilyFor('regular', locale), textAlign: 'left' },
            ]}>
            {t({ ar: 'جاري التحميل…', en: 'Loading…' })}
          </ThemedText>
        )}
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
  empty: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_MUTED,
    paddingVertical: Spacing[6],
  },
});
