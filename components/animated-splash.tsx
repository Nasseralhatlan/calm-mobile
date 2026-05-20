import { BlurView } from 'expo-blur';
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  appReady: boolean;
  onAnimationFinished: () => void;
}

const LOGO = require('@/assets/logo/logo.png');

const FADE_IN_MS = 320;
const UNBLUR_MS = 720;
const BOUNCE_MS = 180;
const EXIT_MS = 240;

export function AnimatedSplash({ appReady, onAnimationFinished }: AnimatedSplashProps) {
  const [layoutReady, setLayoutReady] = useState(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);
  const blurOpacity = useSharedValue(1);

  useEffect(() => {
    if (layoutReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [layoutReady]);

  useEffect(() => {
    if (!layoutReady) return;
    opacity.value = withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 16, stiffness: 220, mass: 0.8 });
    blurOpacity.value = withTiming(0, { duration: UNBLUR_MS, easing: Easing.out(Easing.cubic) });
  }, [layoutReady, opacity, scale, blurOpacity]);

  useEffect(() => {
    if (!appReady || !layoutReady) return;

    scale.value = withSequence(
      withTiming(1.12, { duration: BOUNCE_MS, easing: Easing.out(Easing.cubic) }),
      withTiming(0.6, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) }),
    );

    opacity.value = withDelay(
      BOUNCE_MS,
      withTiming(
        0,
        { duration: EXIT_MS, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onAnimationFinished)();
        },
      ),
    );
  }, [appReady, layoutReady, opacity, scale, onAnimationFinished]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const blurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={() => setLayoutReady(true)}
      style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.logoBox, logoStyle]}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Animated.View style={[StyleSheet.absoluteFillObject, blurStyle]} pointerEvents="none">
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
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
});
