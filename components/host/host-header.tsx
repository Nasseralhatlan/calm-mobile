import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale } from '@/lib/i18n';

// Content height below the safe-area inset — screens pad their lists by
// `insets.top + HOST_HEADER_HEIGHT`.
export const HOST_HEADER_HEIGHT = 66;

export function HostHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const align = 'left' as const;
  const wd = isRTL ? ('rtl' as const) : ('ltr' as const);

  return (
    <View style={styles.wrap}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={styles.tint} pointerEvents="none" />
      <SafeAreaView edges={['top']}>
        <View style={styles.bar}>
          <ThemedText
            style={[styles.title, { fontFamily: fontFamilyFor('bold', locale), textAlign: align, writingDirection: wd }]}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText
              style={[styles.subtitle, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: Spacing[2],
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  bar: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: 14,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: '#000000',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
});
