import { StyleSheet, View } from 'react-native';

import { StarIcon } from '@/components/icons/star-icon';
import { ThemedText } from '@/components/themed-text';
import { fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

interface RatingSummaryProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md';
}

export function RatingSummary({ rating, count, size = 'md' }: RatingSummaryProps) {
  const { locale } = useLocale();
  const t = useT();
  const stars = Math.round(rating);
  const big = size === 'md';

  return (
    <View style={styles.wrap}>
      <ThemedText
        style={[
          big ? styles.ratingBig : styles.ratingSm,
          { fontFamily: fontFamilyFor('bold', locale) },
        ]}>
        {rating.toFixed(1)}
      </ThemedText>
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} size={big ? 12 : 10} color={i < stars ? '#000000' : '#E5E5E5'} />
        ))}
      </View>
      <ThemedText
        style={[styles.count, { fontFamily: fontFamilyFor('regular', locale) }]}>
        {count} {t({ ar: 'تقييم', en: 'reviews' })}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  ratingBig: {
    fontSize: 19,
    lineHeight: 24,
    color: '#000000',
  },
  ratingSm: {
    fontSize: 15,
    lineHeight: 19,
    color: '#000000',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  count: {
    fontSize: 12,
    lineHeight: 16,
    color: '#CECECE',
  },
});
