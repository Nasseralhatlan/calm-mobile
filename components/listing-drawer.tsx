import type { ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');

interface ListingDrawerProps {
  children: ReactNode;
  footer: ReactNode;
  /** 0 = fully collapsed, 1 = fully expanded. Exposed so the parent can fade other UI. */
  progress?: SharedValue<number>;
}

export function ListingDrawer({ children, footer, progress }: ListingDrawerProps) {
  const insets = useSafeAreaInsets();
  const collapsed = SCREEN_H * 0.42;
  const expanded = SCREEN_H - insets.top - 24;

  const height = useSharedValue(collapsed);
  const startHeight = useSharedValue(collapsed);

  const internalProgress = useDerivedValue(() => {
    return interpolate(
      height.value,
      [collapsed, expanded],
      [0, 1],
      Extrapolation.CLAMP,
    );
  });

  useDerivedValue(() => {
    if (progress) progress.value = internalProgress.value;
  });

  const pan = Gesture.Pan()
    .onBegin(() => {
      startHeight.value = height.value;
    })
    .onUpdate((e) => {
      const next = startHeight.value - e.translationY;
      height.value = Math.max(collapsed, Math.min(expanded, next));
    })
    .onEnd((e) => {
      const final = height.value;
      const midpoint = (collapsed + expanded) / 2;
      const target = final > midpoint || e.velocityY < -500 ? expanded : collapsed;
      height.value = withSpring(target, { damping: 22, stiffness: 220, mass: 0.9 });
    });

  const drawerStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.drawer, drawerStyle]}>
      <GestureDetector gesture={pan}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>
      </GestureDetector>

      <View style={styles.body}>{children}</View>

      <View style={styles.footerWrap}>{footer}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 16,
    overflow: 'hidden',
  },
  handleArea: {
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
    alignItems: 'center',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.light.border,
  },
  body: { flex: 1 },
  footerWrap: {},
});
