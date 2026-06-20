import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import { PlainModalShell } from '@/components/plain-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { useListingForId } from '@/hooks/use-listing-for-id';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#9CA3AF';
const DIVIDER_COLOR = '#D6D6D6';

// Always English.
function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default function ReviewsModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  const { listing, apiDetail } = useListingForId(id);
  // Published reviews from the API (up to 10).
  const reviews = apiDetail?.reviews_recent ?? [];
  const total = reviews.length;
  const average = listing?.rating.average ?? 0;
  const count = listing?.rating.count ?? total;
  const reviewerName = (n: string | null) => n?.trim() || t({ ar: 'ضيف', en: 'Guest' });

  const title = listing
    ? `${average.toFixed(1)} · ${count} ${t({ ar: 'تقييم', en: 'reviews' })}`
    : t({ ar: 'التقييمات', en: 'Reviews' });

  return (
    <PlainModalShell title={title}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {/* Overall section — bars on the left, big rating on the right. */}
        <View style={[styles.overall, { flexDirection: rowDir }]}>
          <View style={styles.bars}>
            {[5, 4, 3, 2, 1].map((star) => {
              const c = reviews.filter((r) => Math.round(r.rate) === star).length;
              const ratio = total > 0 ? c / total : 0;
              return (
                <View key={star} style={[styles.barRow, { flexDirection: rowDir }]}>
                  <ThemedText
                    style={[styles.barStar, { fontFamily: fontFamilyFor('medium', 'en') }]}>
                    {star}
                  </ThemedText>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.summary}>
            <ThemedText style={[styles.summaryNum, { fontFamily: fontFamilyFor('bold', 'en') }]}>
              {average.toFixed(1)}
            </ThemedText>
            <View style={[styles.summaryStars, { flexDirection: rowDir }]}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} size={13} color={i < Math.round(average) ? TEXT_PRIMARY : '#E5E5E5'} />
              ))}
            </View>
            <ThemedText style={[styles.summaryCount, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {count} {t({ ar: 'تقييم', en: 'reviews' })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {reviews.map((r, idx) => (
          <View key={r.id}>
            <View style={styles.row}>
              <View style={[styles.head, { flexDirection: rowDir }]}>
                <View style={styles.avatarTile}>
                  {r.reviewer_avatar_url ? (
                    <Image
                      source={{ uri: r.reviewer_avatar_url }}
                      style={styles.avatarImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.avatarInner}>
                      <ThemedText
                        style={[styles.avatarInitial, { fontFamily: fontFamilyFor('bold', locale) }]}>
                        {r.reviewer_name?.trim()?.charAt(0) || '-'}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText
                    numberOfLines={1}
                    style={[
                      styles.name,
                      { fontFamily: fontFamilyFor('bold', locale), textAlign: isRTL ? 'right' : 'left' },
                    ]}>
                    {reviewerName(r.reviewer_name)}
                  </ThemedText>
                  <ThemedText
                    numberOfLines={1}
                    style={[
                      styles.date,
                      { fontFamily: fontFamilyFor('regular', locale), textAlign: isRTL ? 'right' : 'left' },
                    ]}>
                    {formatReviewDate(r.created_at)}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.stars, { flexDirection: rowDir }]}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} size={11} color={i < r.rate ? TEXT_PRIMARY : '#E5E5E5'} />
                ))}
              </View>
              {r.comment ? (
                <ThemedText
                  style={[
                    styles.body,
                    { fontFamily: fontFamilyFor('regular', locale), textAlign: isRTL ? 'right' : 'left' },
                  ]}>
                  {r.comment}
                </ThemedText>
              ) : null}
            </View>
            {idx < reviews.length - 1 ? <View style={styles.rowDivider} /> : null}
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
  overall: {
    alignItems: 'center',
    gap: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[5],
  },
  bars: {
    flex: 1,
    gap: Spacing[3],
  },
  barRow: {
    alignItems: 'center',
    gap: Spacing[3],
    height: 16,
  },
  barStar: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_PRIMARY,
    width: 12,
    textAlign: 'center',
  },
  barTrack: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EDEDED',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 5,
  },
  summary: {
    alignItems: 'center',
    gap: Spacing[2],
    minWidth: 110,
  },
  summaryNum: {
    fontSize: 44,
    lineHeight: 50,
    color: TEXT_PRIMARY,
  },
  summaryStars: {
    gap: 3,
  },
  summaryCount: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER_COLOR,
    marginBottom: Spacing[2],
  },
  row: {
    paddingVertical: Spacing[5],
    gap: Spacing[3],
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER_COLOR,
  },
  head: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatarTile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    padding: 2.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
  name: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  stars: {
    gap: 2,
  },
  body: {
    fontSize: 14,
    lineHeight: 26,
    color: TEXT_PRIMARY,
  },
});
