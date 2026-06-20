import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { getAspect, setAspect } from '@/lib/photo-aspect-cache';

const MAX_SCALE = 3.5;

interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  /** True for the page currently on screen — others reset their zoom. */
  active: boolean;
  /** True while actively pinching, so the pager can lock its swipe. */
  onPinchChange: (pinching: boolean) => void;
}

/**
 * Pinch-to-peek photo with focal zoom + drag: it zooms toward wherever your
 * fingers are and follows them as you move, then springs magnetically back to
 * fit the moment you release. Rendered as a rounded card sized to the image's
 * aspect ratio. The gesture worklet only does arithmetic (no JS calls) so it
 * stays crash-free.
 */
export function ZoomableImage({
  uri,
  width,
  height,
  active,
  onPinchChange,
}: ZoomableImageProps) {
  const [aspect, setAspectState] = useState<number | null>(() => getAspect(uri));

  // Fit the image inside the screen at its natural aspect (letterboxed).
  const a = aspect ?? width / height;
  let dw = width;
  let dh = width / a;
  if (dh > height) {
    dh = height;
    dw = height * a;
  }

  const scale = useSharedValue(1);
  // Zoom anchor (centre-relative) captured where the pinch begins.
  const anchorX = useSharedValue(0);
  const anchorY = useSharedValue(0);
  // Pan offset = how far the pinch midpoint has moved since it started.
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Swiping to another page snaps this one back to fit.
  useEffect(() => {
    if (!active) {
      scale.value = withTiming(1, { duration: 160 });
      panX.value = withTiming(0, { duration: 160 });
      panY.value = withTiming(0, { duration: 160 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      anchorX.value = e.focalX - dw / 2;
      anchorY.value = e.focalY - dh / 2;
      startX.value = e.focalX;
      startY.value = e.focalY;
      runOnJS(onPinchChange)(true);
    })
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, e.scale));
      // Follow the fingers so you can drag around while zoomed.
      panX.value = e.focalX - startX.value;
      panY.value = e.focalY - startY.value;
    })
    .onEnd(() => {
      // Magnetic return to original size + position.
      scale.value = withTiming(1, { duration: 220 });
      panX.value = withTiming(0, { duration: 220 });
      panY.value = withTiming(0, { duration: 220 });
      runOnJS(onPinchChange)(false);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      // Drag.
      { translateX: panX.value },
      { translateY: panY.value },
      // Scale about the captured focal point (zoom toward the fingers).
      { translateX: anchorX.value },
      { translateY: anchorY.value },
      { scale: scale.value },
      { translateX: -anchorX.value },
      { translateY: -anchorY.value },
    ],
  }));

  return (
    <View style={{ width, height }} pointerEvents="box-none">
      <View style={styles.center}>
        <GestureDetector gesture={pinch}>
          <Animated.View style={[{ width: dw, height: dh }, styles.card, animStyle]}>
            <Image
              source={{ uri }}
              recyclingKey={uri}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              onLoad={(e) => {
                const w = e.source?.width ?? 0;
                const h = e.source?.height ?? 0;
                if (w > 0 && h > 0) {
                  setAspect(uri, w / h);
                  if (aspect == null) setAspectState(w / h);
                }
              }}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
});
