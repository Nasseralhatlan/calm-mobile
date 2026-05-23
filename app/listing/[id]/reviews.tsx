import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import { PlainModalShell } from '@/components/plain-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { getListing } from '@/data/listings';
import { REVIEWS, getReviewsForListing } from '@/data/reviews';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#CECECE';
const DIVIDER_COLOR = '#F4F4F4';

export default function ReviewsModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  const listing = getListing(id);
  const own = listing ? getReviewsForListing(listing.id) : [];
  const reviews = own.length > 0 ? own : REVIEWS;

  const title = listing
    ? `${listing.rating.average.toFixed(1)} · ${listing.rating.count} ${t({
        ar: 'تقييم',
        en: 'reviews',
      })}`
    : t({ ar: 'التقييمات', en: 'Reviews' });

  return (
    <PlainModalShell title={title}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {reviews.map((r, idx) => (
          <View
            key={r.id}
            style={[styles.row, idx < reviews.length - 1 && styles.rowDivider]}>
            <View style={[styles.head, { flexDirection: rowDir }]}>
              <Image source={{ uri: r.authorAvatarUrl }} style={styles.avatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <ThemedText
                  numberOfLines={1}
                  style={[
                    styles.name,
                    { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left' },
                  ]}>
                  {t(r.authorName)}
                </ThemedText>
                <View style={[styles.stars, { flexDirection: rowDir }]}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} size={10} color={i < r.rating ? TEXT_PRIMARY : '#E5E5E5'} />
                  ))}
                </View>
              </View>
            </View>
            <ThemedText
              style={[
                styles.body,
                { fontFamily: fontFamilyFor('regular', locale), textAlign: isRTL ? 'right' : 'left' },
              ]}>
              {t(r.text)}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </PlainModalShell>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing[10],
  },
  row: {
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER_COLOR,
  },
  head: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  name: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_PRIMARY,
  },
  stars: {
    gap: 2,
    marginTop: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  secondary: { color: TEXT_SECONDARY },
});
