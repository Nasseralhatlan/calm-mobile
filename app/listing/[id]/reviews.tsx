import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BlurredModalShell } from '@/components/blurred-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { getListing } from '@/data/listings';
import { getReviewsForListing } from '@/data/reviews';
import { useLocale, useT } from '@/lib/i18n';

export default function ReviewsModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const t = useT();
  const listing = getListing(id);
  const reviews = listing ? getReviewsForListing(listing.id) : [];

  return (
    <BlurredModalShell
      title={
        listing
          ? `★ ${listing.rating.average.toFixed(2)} · ${listing.rating.count} ${t({
              ar: 'تقييم',
              en: 'reviews',
            })}`
          : t({ ar: 'التقييمات', en: 'Reviews' })
      }>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {reviews.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.head}>
              <Image source={{ uri: r.authorAvatarUrl }} style={styles.avatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[styles.name, { fontFamily: fontFamilyFor('bold', locale) }]}
                  numberOfLines={1}>
                  {t(r.authorName)}
                </ThemedText>
                <ThemedText style={styles.stars}>{'★'.repeat(r.rating)}</ThemedText>
              </View>
            </View>
            <ThemedText
              style={[styles.body, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {t(r.text)}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </BlurredModalShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing[4], paddingBottom: Spacing[6] },
  card: {
    padding: Spacing[4],
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    gap: Spacing[3],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },
  stars: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.coral,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
});
