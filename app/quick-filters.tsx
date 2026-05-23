import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

export default function QuickFiltersModal() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();

  const close = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <PressableScale onPress={close} scaleTo={0.88} haptic="back" style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.titleCenter} pointerEvents="none">
            <ThemedText
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'ساعدني أجد الأفضل', en: 'Help me find the best' })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.body}>
          <ThemedText style={styles.placeholderEmoji}>✨</ThemedText>
          <ThemedText
            style={[styles.placeholderTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {t({
              ar: 'فلاتر ذكية قادمة قريباً',
              en: 'Smart filters coming soon',
            })}
          </ThemedText>
          <ThemedText
            style={[styles.placeholderBody, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {t({
              ar: 'سنقترح أماكن تناسب مناسبتك تلقائياً.',
              en: 'We’ll suggest places that fit your occasion automatically.',
            })}
          </ThemedText>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
    justifyContent: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  titleCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, lineHeight: 24, color: Colors.light.text },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[3],
  },
  placeholderEmoji: { fontSize: 48, lineHeight: 56 },
  placeholderTitle: {
    fontSize: 20,
    lineHeight: 26,
    color: Colors.light.text,
    textAlign: 'center',
  },
  placeholderBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});
