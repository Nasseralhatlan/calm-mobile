import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  appReady: boolean;
  onAnimationFinished: () => void;
}

const LOGO = require('@/assets/logo/logo.png');
const FADE_MS = 260;

export function AnimatedSplash({ appReady, onAnimationFinished }: AnimatedSplashProps) {
  const [layoutReady, setLayoutReady] = useState(false);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (layoutReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [layoutReady]);

  useEffect(() => {
    if (!appReady || !layoutReady) return;
    opacity.value = withTiming(
      0,
      { duration: FADE_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onAnimationFinished)();
      },
    );
  }, [appReady, layoutReady, opacity, onAnimationFinished]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={() => setLayoutReady(true)}
      style={[styles.container, containerStyle]}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
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
  logo: {
    width: 180,
    height: 72,
  },
});
