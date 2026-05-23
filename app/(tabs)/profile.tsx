import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useCurrentUser } from '@/data/auth';
import { useLocale, useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const DIVIDER = '#EBEBEB';
const SURFACE = '#F4F4F4';

export default function ProfileScreen() {
  const t = useT();
  const user = useCurrentUser();
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const isRTL = locale === 'ar';

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const currentYear = new Date().getFullYear();

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
          {t(STR.profile.title)}
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}>
        {/* User identity card */}
        <View
          style={[
            styles.userCard,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText
              numberOfLines={1}
              style={[
                styles.userName,
                {
                  fontFamily: fontFamilyFor('bold', locale),
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t(user.name)}
            </ThemedText>
            <ThemedText
              numberOfLines={1}
              style={[
                styles.userEmail,
                {
                  fontFamily: fontFamilyFor('regular', locale),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}>
              {user.email}
            </ThemedText>
          </View>
        </View>

        {/* Become a host CTA */}
        <Link href="/(tabs)" asChild>
          <PressableScale haptic="forward" scaleTo={0.98} style={styles.hostCard}>
            <View
              style={[
                styles.hostInner,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}>
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText
                  style={[
                    styles.hostTitle,
                    {
                      fontFamily: fontFamilyFor('bold', locale),
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                  ]}>
                  {t(STR.profile.becomeHost)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.hostHint,
                    {
                      fontFamily: fontFamilyFor('regular', locale),
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                  ]}>
                  {t(STR.profile.becomeHostHint)}
                </ThemedText>
              </View>
              <View style={styles.hostBadge}>
                <ThemedText style={styles.hostBadgeEmoji}>✨</ThemedText>
              </View>
            </View>
          </PressableScale>
        </Link>

        {/* Account group */}
        <SectionGroup title={t({ ar: 'حسابي', en: 'Account' })} isRTL={isRTL}>
          <Tile
            icon="suitcase"
            label={t(STR.profile.myBookings)}
            hint={t({ ar: 'القادمة و السابقة', en: 'Upcoming and past' })}
            onPress={() => router.push('/(tabs)/bookings')}
            isRTL={isRTL}
          />
          <Tile
            icon="heart"
            label={t({ ar: 'المفضلة', en: 'Favorites' })}
            hint={t({ ar: 'الأماكن اللي حبيتها', en: 'Places you saved' })}
            onPress={() => router.push('/(tabs)/likes')}
            isRTL={isRTL}
            isLast
          />
        </SectionGroup>

        {/* Preferences group */}
        <SectionGroup title={t({ ar: 'التفضيلات', en: 'Preferences' })} isRTL={isRTL}>
          <Tile
            icon="globe"
            label={t(STR.profile.language)}
            trailing={locale === 'ar' ? 'العربية' : 'English'}
            onPress={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            isRTL={isRTL}
          />
          <Tile
            icon="bell"
            label={t(STR.profile.notifications)}
            onPress={() => {}}
            isRTL={isRTL}
          />
          <Tile
            icon="paintpalette"
            label={t(STR.profile.appearance)}
            trailing={t({ ar: 'فاتح', en: 'Light' })}
            onPress={() => {}}
            isRTL={isRTL}
            isLast
          />
        </SectionGroup>

        {/* Support group */}
        <SectionGroup title={t({ ar: 'المساعدة', en: 'Support' })} isRTL={isRTL}>
          <Tile
            icon="message"
            label={t({ ar: 'تواصل معنا', en: 'Contact us' })}
            hint={t({ ar: 'support@calm.sa', en: 'support@calm.sa' })}
            onPress={() => Linking.openURL('mailto:support@calm.sa')}
            isRTL={isRTL}
          />
          <Tile
            icon="questionmark.circle"
            label={t({ ar: 'مركز المساعدة', en: 'Help center' })}
            onPress={() => {}}
            isRTL={isRTL}
          />
          <Tile
            icon="doc.text"
            label={t({ ar: 'الشروط و الأحكام', en: 'Terms & policies' })}
            onPress={() => {}}
            isRTL={isRTL}
            isLast
          />
        </SectionGroup>

        {/* Footer / Legal */}
        <View style={styles.footer}>
          <ThemedText
            style={[styles.footerVersion, { fontFamily: fontFamilyFor('medium', locale) }]}>
            Calm · v{appVersion}
          </ThemedText>
          <ThemedText
            style={[styles.footerCopy, { fontFamily: fontFamilyFor('regular', locale) }]}>
            © {currentYear} Calm. {t({ ar: 'جميع الحقوق محفوظة.', en: 'All rights reserved.' })}
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionGroup({
  title,
  children,
  isRTL,
}: {
  title: string;
  children: React.ReactNode;
  isRTL: boolean;
}) {
  const { locale } = useLocale();
  return (
    <View style={styles.sectionWrap}>
      <ThemedText
        style={[
          styles.sectionLabel,
          {
            fontFamily: fontFamilyFor('bold', locale),
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}>
        {title}
      </ThemedText>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Tile({
  icon,
  label,
  hint,
  trailing,
  onPress,
  isRTL,
  isLast,
}: {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  label: string;
  hint?: string;
  trailing?: string;
  onPress: () => void;
  isRTL: boolean;
  isLast?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <PressableScale
      haptic="select"
      scaleTo={0.99}
      onPress={onPress}
      style={
        isLast
          ? [styles.tile, { flexDirection: isRTL ? 'row-reverse' : 'row' }]
          : [styles.tile, styles.tileDivider, { flexDirection: isRTL ? 'row-reverse' : 'row' }]
      }>
      <View style={styles.tileIconWrap}>
        <IconSymbol name={icon} size={18} color={Colors.light.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText
          numberOfLines={1}
          style={[
            styles.tileLabel,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText
            numberOfLines={1}
            style={[
              styles.tileHint,
              {
                fontFamily: fontFamilyFor('regular', locale),
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
      {trailing ? (
        <ThemedText
          style={[styles.tileTrailing, { fontFamily: fontFamilyFor('medium', locale) }]}>
          {trailing}
        </ThemedText>
      ) : null}
      <IconSymbol
        name="chevron.left"
        size={16}
        color={TEXT_MUTED}
        style={isRTL ? undefined : { transform: [{ rotate: '180deg' }] }}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },

  scroll: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[5],
  },

  userCard: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
    gap: Spacing[4],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
  },
  userName: {
    fontSize: 20,
    lineHeight: 26,
    color: TEXT_PRIMARY,
  },
  userEmail: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
  },

  hostCard: {
    backgroundColor: Colors.light.coral,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4] + 2,
    shadowColor: Colors.light.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  hostInner: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  hostTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
  hostHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 17,
  },
  hostBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostBadgeEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },

  sectionWrap: {
    gap: Spacing[2],
  },
  sectionLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
    paddingHorizontal: 2,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    overflow: 'hidden',
  },

  tile: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3] + 2,
    alignItems: 'center',
    gap: Spacing[3],
  },
  tileDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  tileHint: {
    fontSize: 12,
    lineHeight: 16,
    color: TEXT_SECONDARY,
  },
  tileTrailing: {
    fontSize: 13,
    lineHeight: 17,
    color: TEXT_SECONDARY,
  },

  footer: {
    alignItems: 'center',
    paddingTop: Spacing[6],
    gap: 4,
  },
  footerVersion: {
    fontSize: 12,
    lineHeight: 16,
    color: TEXT_SECONDARY,
  },
  footerCopy: {
    fontSize: 11,
    lineHeight: 15,
    color: TEXT_MUTED,
  },
});
