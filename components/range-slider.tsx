import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const THUMB = 26;
const TRACK_H = 4;

interface RangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}

export function RangeSlider({ min, max, valueMin, valueMax, onChange }: RangeSliderProps) {
  const [w, setW] = useState(0);
  const range = Math.max(1, max - min);

  const leftX = useSharedValue(0);
  const rightX = useSharedValue(0);
  const startLeft = useSharedValue(0);
  const startRight = useSharedValue(0);

  // Sync thumb positions from props whenever the track width or values change.
  useEffect(() => {
    if (w <= 0) return;
    leftX.value = ((valueMin - min) / range) * w;
    rightX.value = ((valueMax - min) / range) * w;
  }, [w, valueMin, valueMax, min, range, leftX, rightX]);

  const emit = (lx: number, rx: number) => {
    if (w <= 0) return;
    const a = Math.round(min + (lx / w) * range);
    const b = Math.round(min + (rx / w) * range);
    onChange(Math.min(a, b), Math.max(a, b));
  };

  const leftPan = Gesture.Pan()
    .onStart(() => {
      startLeft.value = leftX.value;
    })
    .onUpdate((e) => {
      let x = startLeft.value + e.translationX;
      if (x < 0) x = 0;
      if (x > rightX.value) x = rightX.value;
      leftX.value = x;
      runOnJS(emit)(x, rightX.value);
    });

  const rightPan = Gesture.Pan()
    .onStart(() => {
      startRight.value = rightX.value;
    })
    .onUpdate((e) => {
      let x = startRight.value + e.translationX;
      if (x > w) x = w;
      if (x < leftX.value) x = leftX.value;
      rightX.value = x;
      runOnJS(emit)(leftX.value, x);
    });

  const leftStyle = useAnimatedStyle(() => ({ transform: [{ translateX: leftX.value - THUMB / 2 }] }));
  const rightStyle = useAnimatedStyle(() => ({ transform: [{ translateX: rightX.value - THUMB / 2 }] }));
  const fillStyle = useAnimatedStyle(() => ({
    left: leftX.value,
    width: Math.max(0, rightX.value - leftX.value),
  }));

  return (
    <View style={styles.wrap}>
      <View
        style={styles.track}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <GestureDetector gesture={leftPan}>
          <Animated.View style={[styles.thumb, leftStyle]} hitSlop={12} />
        </GestureDetector>
        <GestureDetector gesture={rightPan}>
          <Animated.View style={[styles.thumb, rightStyle]} hitSlop={12} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: THUMB,
    justifyContent: 'center',
    // Inset by half a thumb so thumbs at the extremes stay inside the row.
    paddingHorizontal: THUMB / 2,
  },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: TRACK_H,
    backgroundColor: '#000000',
  },
  thumb: {
    position: 'absolute',
    top: TRACK_H / 2 - THUMB / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
});
