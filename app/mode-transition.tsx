import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useAppMode, type AppMode } from '@/data/app-mode';

export default function ModeTransition() {
  const router = useRouter();
  const params = useLocalSearchParams<{ to?: string }>();
  const { setMode } = useAppMode();

  const target: AppMode = params.to === 'host' ? 'host' : 'guest';

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });

    let cancelled = false;
    (async () => {
      try {
        await setMode(target);
        // Placeholder for any host/guest data preload.
        // Replace with real prefetches when those endpoints exist.
        await new Promise((r) => setTimeout(r, 700));
      } finally {
        if (cancelled) return;
        // Fade the splash out, then hand off — destination also fades in.
        opacity.value = withTiming(
          0,
          { duration: 200, easing: Easing.in(Easing.cubic) },
        );
        setTimeout(() => {
          if (cancelled) return;
          if (target === 'host') router.replace('/(host)');
          else router.replace('/(tabs)');
        }, 180);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [target, setMode, router, opacity, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.logoBox, logoStyle]}>
        <Image
          source={require('@/assets/logo/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
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
    tintColor: Colors.light.coral,
  },
});
