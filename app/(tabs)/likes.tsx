import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import { LISTINGS } from '@/data/listings';
import { useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

export default function LikesScreen() {
  const palette = Colors.light;
  const t = useT();
  const { likes } = useLikes();

  const liked = LISTINGS.filter((l) => likes.has(l.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText variant="display">{t(STR.likes.title)}</ThemedText>
      </View>

      {liked.length === 0 ? (
        <EmptyState
          icon="heart"
          title={t(STR.likes.emptyTitle)}
          body={t(STR.likes.emptyBody)}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {liked.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </ScrollView>
      )}
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
  listContent: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[12],
  },
});
