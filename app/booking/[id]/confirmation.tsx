import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Springs } from '@/constants/theme';
import { getListing } from '@/data/listings';
import { useT } from '@/lib/i18n';

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const listing = getListing(id);

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const titleY = useSharedValue(12);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 160 });
    opacity.value = withDelay(120, withSpring(1, Springs.gentle));
    titleY.value = withDelay(160, withSpring(0, Springs.bouncy));
  }, [opacity, scale, titleY]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, imageStyle]}>
          <Image
            source={require('@/assets/logo/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.text, contentStyle]}>
          <ThemedText variant="title" style={{ textAlign: 'center' }}>
            {t({ ar: 'تم تأكيد حجزك ✨', en: 'Your reservation is confirmed ✨' })}
          </ThemedText>
          <ThemedText variant="body" tone="muted" style={{ textAlign: 'center', marginTop: Spacing[3] }}>
            {listing
              ? t({
                  ar: `سيتواصل معك المضيف قبل وصولك إلى ${t(listing.title)}.`,
                  en: `Your host will reach out before you arrive at ${t(listing.title)}.`,
                })
              : t({ ar: 'مبروك، شاهد التفاصيل في حجوزاتي.', en: 'Congrats — view details in My bookings.' })}
          </ThemedText>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Button
          label={t({ ar: 'العودة للاستكشاف', en: 'Back to Explore' })}
          size="lg"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[6],
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.light.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 90,
    height: 36,
  },
  text: {
    alignItems: 'center',
  },
  actions: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[4],
  },
});
