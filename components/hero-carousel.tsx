import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_W * 0.95;

interface HeroCarouselProps {
  photos: string[];
  scrollY?: SharedValue<number>;
}

export function HeroCarousel({ photos, scrollY }: HeroCarouselProps) {
  const [page, setPage] = useState(0);
  const scrollX = useSharedValue(0);
  const pageIndex = useDerivedValue(() => Math.round(scrollX.value / SCREEN_W));

  const onScrollH = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
    onMomentumEnd: (e) => {
      const next = Math.round(e.contentOffset.x / SCREEN_W);
      runOnJS(setPage)(next);
    },
  });

  const heroParallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = scrollY.value;
    const scale = interpolate(y, [-200, 0], [1.25, 1], Extrapolation.CLAMP);
    const translateY = interpolate(
      y,
      [0, HERO_HEIGHT],
      [0, HERO_HEIGHT * 0.35],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }, { scale }] };
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.heroFrame, heroParallaxStyle]}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScrollH}
          scrollEventThrottle={16}
          bounces>
          {photos.map((url) => (
            <Image
              key={url}
              source={{ uri: url }}
              style={styles.hero}
              contentFit="cover"
              transition={200}
            />
          ))}
        </Animated.ScrollView>

        <View style={styles.dotsWrap} pointerEvents="none">
          {photos.map((_, i) => (
            <Dot key={i} index={i} pageIndex={pageIndex} />
          ))}
        </View>

        <View style={styles.counter} pointerEvents="none">
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.counterTint} />
          <ThemedText variant="caption" style={styles.counterText}>
            {page + 1} / {photos.length}
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

function Dot({ index, pageIndex }: { index: number; pageIndex: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const active = pageIndex.value === index;
    return {
      width: active ? 18 : 6,
      opacity: active ? 1 : 0.55,
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  wrap: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  heroFrame: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
  },
  hero: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
    backgroundColor: '#F3F4F6',
  },
  dotsWrap: {
    position: 'absolute',
    bottom: Spacing[4],
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  counter: {
    position: 'absolute',
    bottom: Spacing[4],
    insetInlineEnd: Spacing[4],
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    minWidth: 48,
    alignItems: 'center',
  },
  counterTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
