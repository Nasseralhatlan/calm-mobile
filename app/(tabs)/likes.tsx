import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ListingCardCompact } from '@/components/listing-card-compact';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import { LISTINGS } from '@/data/listings';
import { useLocale, useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';

// Placeholder until real "viewed" tracking is wired up.
const RECENT_IDS = ['l_chalet_02', 'l_rest_02', 'l_chalet_05', 'l_rest_04', 'l_chalet_01'];

export default function LikesScreen() {
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const { likes } = useLikes();

  const liked = useMemo(() => LISTINGS.filter((l) => likes.has(l.id)), [likes]);
  const recentlyViewed = useMemo(
    () =>
      RECENT_IDS.map((id) => LISTINGS.find((l) => l.id === id))
        .filter((l): l is (typeof LISTINGS)[number] => Boolean(l))
        .filter((l) => !likes.has(l.id)),
    [likes],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <ThemedText
          style={[
            styles.title,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {t(STR.likes.title)}
        </ThemedText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {/* Recently viewed strip */}
        {recentlyViewed.length > 0 ? (
          <View style={styles.recentBlock}>
            <View style={styles.recentHeader}>
              <ThemedText
                style={[
                  styles.recentTitle,
                  {
                    fontFamily: fontFamilyFor('bold', locale),
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                ]}>
                {t({ ar: 'شاهدتها مؤخراً', en: 'Recently viewed' })}
              </ThemedText>
              <ThemedText
                style={[
                  styles.recentHint,
                  {
                    fontFamily: fontFamilyFor('regular', locale),
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}>
                {t({
                  ar: 'أماكن زرتها بدون ما تضيفها للمفضلة',
                  en: 'Places you viewed but did not favorite yet',
                })}
              </ThemedText>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={isRTL ? styles.mirrorX : undefined}
              contentContainerStyle={styles.recentRow}>
              {recentlyViewed.map((l) => (
                <View key={l.id} style={isRTL ? styles.mirrorX : undefined}>
                  <ListingCardCompact listing={l} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Liked listings */}
        {liked.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="heart"
              title={t(STR.likes.emptyTitle)}
              body={t(STR.likes.emptyBody)}
            />
          </View>
        ) : (
          <View style={styles.likedBlock}>
            <ThemedText
              style={[
                styles.sectionTitle,
                {
                  fontFamily: fontFamilyFor('bold', locale),
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t({ ar: 'المفضلة', en: 'Favorites' })}
            </ThemedText>
            {liked.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  mirrorX: { transform: [{ scaleX: -1 }] },

  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },

  scroll: {
    paddingBottom: Spacing[12],
    gap: Spacing[6],
  },

  recentBlock: {
    gap: Spacing[3],
  },
  recentHeader: {
    paddingHorizontal: Spacing[5],
    gap: 4,
  },
  recentTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  recentHint: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_SECONDARY,
  },
  recentRow: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
  },

  likedBlock: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    marginBottom: Spacing[2],
  },
  emptyWrap: {
    paddingHorizontal: Spacing[5],
  },
});
