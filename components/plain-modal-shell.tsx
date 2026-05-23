import { Stack, useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale } from '@/lib/i18n';

interface PlainModalShellProps {
  title: string;
  children: ReactNode;
}

export function PlainModalShell({ title, children }: PlainModalShellProps) {
  const router = useRouter();
  const { locale } = useLocale();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <PressableScale
            onPress={() => router.back()}
            scaleTo={0.88}
            haptic="back"
            style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.titleCenter} pointerEvents="none">
            <ThemedText
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}
              numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
        </View>
        <View style={styles.body}>{children}</View>
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
    left: Spacing[16],
    right: Spacing[16],
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, lineHeight: 22, color: Colors.light.text },
  body: { flex: 1, paddingHorizontal: Spacing[5] },
});
