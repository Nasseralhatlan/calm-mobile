import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { BOOKINGS } from '@/data/bookings';
import { getListing } from '@/data/listings';
import { formatDateRange, formatMoney } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

export default function BookingsScreen() {
  const palette = Colors.light;
  const { locale } = useLocale();
  const t = useT();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText variant="display">{t(STR.bookings.title)}</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing[12], gap: Spacing[3] }}
        showsVerticalScrollIndicator={false}>
        {BOOKINGS.length === 0 ? (
          <EmptyState
            title={t(STR.bookings.emptyUpcomingTitle)}
            body={t(STR.bookings.emptyUpcomingBody)}
          />
        ) : (
          BOOKINGS.map((b) => {
            const listing = getListing(b.listingId);
            if (!listing) return null;
            return (
              <Link key={b.id} href={`/booking/${b.id}/confirmation`} asChild>
                <PressableScale scaleTo={0.98} style={styles.card}>
                  <Image source={{ uri: listing.photos[0] }} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="bodyMedium" numberOfLines={1}>
                      {t(listing.title)}
                    </ThemedText>
                    <ThemedText variant="caption" tone="muted">
                      {formatDateRange(b.checkIn, b.checkOut, locale)}
                    </ThemedText>
                    <ThemedText variant="caption" tone="muted">
                      {b.guests} {t({ ar: 'ضيف', en: 'guests' })}
                    </ThemedText>
                    <ThemedText variant="bodyMedium" style={{ marginTop: 2 }}>
                      {formatMoney(b.pricing.total, locale)}
                    </ThemedText>
                  </View>
                </PressableScale>
              </Link>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: Spacing[5],
    padding: Spacing[3],
    borderRadius: Radius.xl,
    backgroundColor: '#FFFFFF',
    gap: Spacing[3],
    ...Shadows.card,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: Radius.lg,
    backgroundColor: '#F3F4F6',
  },
});
