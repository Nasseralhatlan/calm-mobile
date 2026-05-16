import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCurrentUser } from '@/data/auth';
import { useLocale, useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

interface RowProps {
  title: string;
  hint?: string;
  trailing?: string;
  onPress?: () => void;
}

function Row({ title, hint, trailing, onPress }: RowProps) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} style={styles.row}>
      <View style={{ flex: 1 }}>
        <ThemedText variant="bodyMedium">{title}</ThemedText>
        {hint ? (
          <ThemedText variant="caption" tone="muted">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      {trailing ? (
        <ThemedText variant="body" tone="muted" style={{ marginEnd: Spacing[2] }}>
          {trailing}
        </ThemedText>
      ) : null}
      <IconSymbol name="chevron.right" size={18} color={Colors.light.textMuted} />
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const palette = Colors.light;
  const t = useT();
  const user = useCurrentUser();
  const { locale, setLocale } = useLocale();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing[12] }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText variant="display">{t(STR.profile.title)}</ThemedText>
        </View>

        <View style={styles.userCard}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={{ flex: 1, marginStart: Spacing[4] }}>
            <ThemedText variant="heading">{t(user.name)}</ThemedText>
            <ThemedText variant="caption" tone="muted">
              {user.email}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.group}>
          <Row title={t(STR.profile.myBookings)} hint={t({ ar: 'حجوزاتك القادمة والسابقة', en: 'Your upcoming and past trips' })} />
        </View>

        <View style={styles.divider} />

        <View style={styles.group}>
          <Row
            title={t(STR.profile.language)}
            trailing={locale === 'ar' ? 'العربية' : 'English'}
            onPress={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          />
          <Row title={t(STR.profile.appearance)} trailing={t({ ar: 'فاتح', en: 'Light' })} />
          <Row title={t(STR.profile.notifications)} />
        </View>

        <View style={styles.divider} />

        <PressableScale scaleTo={0.985} style={styles.hostCard}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="bodyMedium" style={{ color: '#FFFFFF' }}>
              {t(STR.profile.becomeHost)}
            </ThemedText>
            <ThemedText variant="caption" style={{ color: '#FFFFFF', opacity: 0.85, marginTop: 2 }}>
              {t(STR.profile.becomeHostHint)}
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
        </PressableScale>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
  },
  group: {
    paddingHorizontal: Spacing[5],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
    marginHorizontal: Spacing[5],
    marginVertical: Spacing[2],
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing[5],
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[5],
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.coral,
  },
});
