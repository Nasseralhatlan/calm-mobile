import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { getTopInterest, type PlaceInterest } from '@/data/place-interest';
import { clearResume } from '@/data/resume';
import { useLocale, useT } from '@/lib/i18n';

export function InterestCard() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const [item, setItem] = useState<PlaceInterest | null>(null);

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Re-read on every focus so a fresh visit (or a booking that cleared it) is
  // reflected when returning home.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getTopInterest().then((it) => {
        if (active) setItem(it);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    if (item) {
      opacity.value = 1;
      scale.value = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!item) return null;

  const name = isRTL ? item.title.ar : item.title.en;
  const title = item.intent
    ? t({ ar: `أكمل حجزك في ${name}`, en: `Continue your booking of ${name}` })
    : t({ ar: `لا زلت مهتمًا بـ ${name}؟`, en: `Still interested in ${name}?` });
  // city · area · max guests
  const subParts: string[] = [];
  if (item.city) subParts.push(t(item.city));
  if (item.area && t(item.area).trim()) subParts.push(t(item.area));
  if (item.guests && item.guests > 0)
    subParts.push(`${item.guests} ${t({ ar: 'ضيوف', en: 'guests' })}`);
  const sub =
    subParts.join(' · ') ||
    t({ ar: 'تابع من حيث توقفت', en: 'Pick up where you left off' });

  const open = () => {
    router.push(`/listing/${item.placeId}`);
  };

  const finishClear = () => {
    void clearResume();
    setItem(null);
  };

  const clear = () => {
    opacity.value = withTiming(0, { duration: 220 });
    scale.value = withTiming(0.96, { duration: 220 }, (done) => {
      if (done) runOnJS(finishClear)();
    });
  };

  return (
    <Animated.View style={[styles.wrap, animStyle]}>
      <View style={styles.clearRow}>
        <Pressable onPress={clear} hitSlop={8} style={styles.clearBtn}>
          <ThemedText
            style={[styles.clearText, { fontFamily: fontFamilyFor('medium', locale) }]}>
            {t({ ar: 'مسح', en: 'Clear' })}
          </ThemedText>
        </Pressable>
      </View>

      <PressableScale
        scaleTo={0.985}
        haptic="select"
        onPress={open}
        style={[styles.card, { flexDirection: 'row' }]}>
        <View style={styles.textCol}>
          <ThemedText
            numberOfLines={2}
            style={[
              styles.title,
              {
                fontFamily: fontFamilyFor('bold', locale),
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}>
            {title}
          </ThemedText>
          <View style={[styles.subRow, { flexDirection: 'row' }]}>
            <ThemedText
              numberOfLines={1}
              style={[styles.subtitle, { fontFamily: fontFamilyFor('medium', locale) }]}>
              {sub}
            </ThemedText>
            <IconSymbol
              name="chevron.left"
              size={13}
              color={Colors.light.textMuted}
              style={isRTL ? undefined : { transform: [{ rotate: '180deg' }] }}
            />
          </View>
        </View>

        <View style={styles.frame}>
          {item.thumb ? (
            <Image source={{ uri: item.thumb }} style={styles.frameImg} contentFit="cover" />
          ) : (
            <View style={[styles.frameImg, styles.fallback]} />
          )}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const FRAME_IMG = 66;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[4],
  },
  clearRow: {
    // Clear chip at the far (trailing) end — right in LTR, left in RTL.
    alignItems: 'flex-end',
    marginBottom: Spacing[2],
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F0F0F0',
  },
  clearText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.light.textMuted,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderCurve: 'continuous',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    alignItems: 'center',
    gap: Spacing[3],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  textCol: {
    flex: 1,
    gap: Spacing[1] + 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    color: '#000000',
  },
  subRow: {
    alignItems: 'center',
    gap: Spacing[1] + 2,
  },
  subtitle: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textMuted,
  },
  frame: {
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderRadius: 20,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  frameImg: {
    width: FRAME_IMG,
    height: FRAME_IMG,
    borderRadius: 17,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
  fallback: {
    backgroundColor: '#F0EEEC',
  },
});
