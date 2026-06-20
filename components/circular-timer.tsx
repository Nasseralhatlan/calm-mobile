import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';

interface CircularTimerProps {
  /** Remaining fraction, 0..1. */
  progress: number;
  /** Big text in the middle (e.g. "12:34"). */
  label: string;
  /** Small caption below the time. */
  caption?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  fontFamily?: string;
  captionFontFamily?: string;
}

export function CircularTimer({
  progress,
  label,
  caption,
  size = 132,
  strokeWidth = 9,
  color = '#F59E0B',
  fontFamily,
  captionFontFamily,
}: CircularTimerProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - p);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#ECECEC"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <ThemedText style={[styles.time, fontFamily ? { fontFamily } : null]}>
          {label}
        </ThemedText>
        {caption ? (
          <ThemedText
            style={[styles.caption, captionFontFamily ? { fontFamily: captionFontFamily } : null]}>
            {caption}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  time: {
    fontSize: 26,
    lineHeight: 32,
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
});
