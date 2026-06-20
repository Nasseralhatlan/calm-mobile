import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

interface AnimatedSplashProps {
  appReady: boolean;
  onAnimationFinished: () => void;
}

const LOGO = require('@/assets/logo/logo-white.png');

const FADE_IN_MS = 220;
const HOLD_MS = 120;
const BOUNCE_MS = 180;
const LOGO_OUT_MS = 240;
const BG_OUT_MS = 320;

export function AnimatedSplash({ appReady, onAnimationFinished }: AnimatedSplashProps) {
  const [layoutReady, setLayoutReady] = useState(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const whiteOverlay = useSharedValue(0);

  useEffect(() => {
    if (layoutReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [layoutReady]);

  useEffect(() => {
    if (!layoutReady) return;
    opacity.value = withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.cubic) });
  }, [layoutReady, opacity]);

  useEffect(() => {
    if (!appReady || !layoutReady) return;

    scale.value = withDelay(
      HOLD_MS,
      withSequence(
        withTiming(1.12, { duration: BOUNCE_MS, easing: Easing.out(Easing.cubic) }),
        withTiming(0.6, { duration: LOGO_OUT_MS, easing: Easing.in(Easing.cubic) }),
      ),
    );

    opacity.value = withDelay(
      HOLD_MS + BOUNCE_MS,
      withTiming(0, { duration: LOGO_OUT_MS, easing: Easing.in(Easing.cubic) }),
    );

    whiteOverlay.value = withDelay(
      HOLD_MS + BOUNCE_MS + LOGO_OUT_MS,
      withTiming(
        1,
        { duration: BG_OUT_MS, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onAnimationFinished)();
        },
      ),
    );
  }, [appReady, layoutReady, opacity, scale, whiteOverlay, onAnimationFinished]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const whiteStyle = useAnimatedStyle(() => ({
    opacity: whiteOverlay.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={() => setLayoutReady(true)}
      style={styles.container}>
      <Animated.View style={[styles.logoBox, logoStyle]}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.whiteOverlay, whiteStyle]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 180,
    height: 72,
  },
  logo: {
    width: 180,
    height: 72,
  },
  whiteOverlay: {
    backgroundColor: '#FFFFFF',
  },
});
