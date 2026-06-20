import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Springs, fontFamilyFor } from '@/constants/theme';
import { useListingForId } from '@/hooks/use-listing-for-id';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DIVIDER = '#EBEBEB';

function nowReferenceId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  return `CLM-${t}`;
}

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const { listing } = useListingForId(id);

  const ringScale = useSharedValue(0.4);
  const ringOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const contentY = useSharedValue(16);
  const contentOpacity = useSharedValue(0);
  const cardY = useSharedValue(28);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    ringOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    ringScale.value = withSpring(1, { damping: 11, stiffness: 160 });
    checkScale.value = withDelay(180, withSpring(1, { damping: 8, stiffness: 220 }));
    contentOpacity.value = withDelay(260, withTiming(1, { duration: 320 }));
    contentY.value = withDelay(260, withSpring(0, Springs.gentle));
    cardOpacity.value = withDelay(420, withTiming(1, { duration: 360 }));
    cardY.value = withDelay(420, withSpring(0, Springs.gentle));
  }, [ringScale, ringOpacity, checkScale, contentY, contentOpacity, cardY, cardOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const reference = nowReferenceId();
  const dateLabel = '20 – 22 Jun, 2026';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Celebratory ring + check */}
          <View style={styles.successWrap}>
            <Animated.View style={[styles.ring, ringStyle]} />
            <Animated.View style={[styles.ringInner, ringStyle]}>
              <Animated.View style={checkStyle}>
                <IconSymbol name="checkmark" size={56} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Title / subtitle */}
          <Animated.View style={[styles.text, contentStyle]}>
            <ThemedText
              style={[
                styles.title,
                {
                  fontFamily: fontFamilyFor('bold', locale),
                  textAlign: 'center',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t({ ar: 'تم تأكيد حجزك ✨', en: 'Booking confirmed ✨' })}
            </ThemedText>
            <ThemedText
              style={[
                styles.subtitle,
                {
                  fontFamily: fontFamilyFor('regular', locale),
                  textAlign: 'center',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {listing
                ? t({
                    ar: `سيتواصل معك المضيف قبل وصولك إلى ${t(listing.title)}.`,
                    en: `Your host will reach out before you arrive at ${t(listing.title)}.`,
                  })
                : t({
                    ar: 'مبروك، شاهد تفاصيل الحجز في صفحة الحجوزات.',
                    en: 'You can review your booking from My bookings.',
                  })}
            </ThemedText>
            <ThemedText
              style={[
                styles.reference,
                { fontFamily: fontFamilyFor('medium', locale) },
              ]}>
              {t({ ar: 'رقم الحجز', en: 'Reference' })} · {reference}
            </ThemedText>
          </Animated.View>

          {/* Booking summary card */}
          {listing ? (
            <Animated.View style={[styles.card, cardStyle]}>
              <View
                style={[
                  styles.cardRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}>
                <Image
                  source={{ uri: listing.photos[0] }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={250}
                />
                <View style={{ flex: 1, gap: 6 }}>
                  <ThemedText
                    numberOfLines={2}
                    style={[
                      styles.cardTitle,
                      {
                        fontFamily: fontFamilyFor('bold', locale),
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}>
                    {t(listing.title)}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.cardSub,
                      {
                        fontFamily: fontFamilyFor('regular', locale),
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}>
                    {dateLabel}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.cardSub,
                      {
                        fontFamily: fontFamilyFor('regular', locale),
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}>
                    {t({ ar: `${listing.capacity.guests} ضيف`, en: `${listing.capacity.guests} guests` })}
                  </ThemedText>
                </View>
              </View>
            </Animated.View>
          ) : null}
        </View>

        {/* Actions */}
        <Animated.View style={[styles.actions, contentStyle]}>
          <PressableScale
            haptic="forward"
            scaleTo={0.98}
            onPress={() => router.replace('/(tabs)/bookings')}
            style={styles.primaryCta}>
            <ThemedText
              style={[styles.primaryCtaText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'عرض حجوزاتي', en: 'View my bookings' })}
            </ThemedText>
          </PressableScale>
          <PressableScale
            haptic="select"
            scaleTo={0.98}
            onPress={() => router.replace('/(tabs)')}
            style={styles.secondaryCta}>
            <ThemedText
              style={[styles.secondaryCtaText, { fontFamily: fontFamilyFor('medium', locale) }]}>
              {t({ ar: 'العودة للاستكشاف', en: 'Back to Explore' })}
            </ThemedText>
          </PressableScale>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const RING_SIZE = 132;
const RING_INNER = 100;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[10],
    gap: Spacing[6],
  },

  successWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: Colors.light.coral,
    opacity: 0.18,
  },
  ringInner: {
    width: RING_INNER,
    height: RING_INNER,
    borderRadius: RING_INNER / 2,
    backgroundColor: Colors.light.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.coral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },

  text: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    color: TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_SECONDARY,
    maxWidth: 320,
  },
  reference: {
    marginTop: Spacing[2],
    fontSize: 12,
    lineHeight: 16,
    color: TEXT_SECONDARY,
    letterSpacing: 0.4,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    padding: Spacing[3],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  cardRow: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_SECONDARY,
  },

  actions: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[5],
    gap: Spacing[3],
  },
  primaryCta: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
  secondaryCta: {
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
});
