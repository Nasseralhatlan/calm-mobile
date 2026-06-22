import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

const SPRING = { damping: 13, stiffness: 130 };

// Trailing carousel card: a white card with a fanned deck of the list's first
// two places (last-search style), animating in when it scrolls on screen.
export function ViewAllCard({
  photos,
  active = true,
  onPress,
}: {
  photos: string[];
  /** True when the card is on screen — drives the deck fan (replays on return). */
  active?: boolean;
  onPress: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const items = photos.slice(0, 2);

  // Two cards fan out equally and opposite when the card scrolls on screen.
  const front = useSharedValue(0);
  const back = useSharedValue(0);
  useEffect(() => {
    front.value = active ? withDelay(120, withSpring(12, SPRING)) : 0;
    back.value = active ? withDelay(120, withSpring(-12, SPRING)) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${front.value}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${back.value}deg` }],
  }));

  return (
    <PressableScale
      scaleTo={0.97}
      haptic="select"
      onPress={onPress}
      style={styles.card}>
      <View style={styles.deck}>
        {items[1] ? (
          <View style={styles.layer}>
            <Animated.View style={[styles.frame, backStyle]}>
              <Image source={{ uri: items[1] }} style={styles.frameImg} contentFit="cover" />
            </Animated.View>
          </View>
        ) : null}
        <View style={styles.layer}>
          <Animated.View style={[styles.frame, frontStyle]}>
            {items[0] ? (
              <Image source={{ uri: items[0] }} style={styles.frameImg} contentFit="cover" />
            ) : (
              <View style={[styles.frameImg, styles.fallback]} />
            )}
          </Animated.View>
        </View>
      </View>

      <View style={[styles.labelRow, { flexDirection: 'row' }]}>
        <ThemedText
          style={[styles.label, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {t({ ar: 'عرض الكل', en: 'View all' })}
        </ThemedText>
        <IconSymbol
          name="chevron.left"
          size={14}
          color={Colors.light.text}
          style={isRTL ? undefined : { transform: [{ rotate: '180deg' }] }}
        />
      </View>
    </PressableScale>
  );
}

const FRAME_IMG = 58;

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 158,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  deck: {
    width: 84,
    height: 74,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderRadius: 16,
    borderCurve: 'continuous',
    transformOrigin: '50% 100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  frameImg: {
    width: FRAME_IMG,
    height: FRAME_IMG,
    borderRadius: 13,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
  fallback: {
    backgroundColor: '#F0EEEC',
  },
  labelRow: {
    alignItems: 'center',
    gap: Spacing[1] + 2,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.text,
  },
});
