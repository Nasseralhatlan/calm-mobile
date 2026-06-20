import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { getConfirm } from '@/data/confirm-dialog';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DANGER = '#C53030';

export default function ConfirmScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const cfg = getConfirm();

  const confirm = () => {
    // Dismiss first so any navigation inside the action targets the screen
    // underneath (e.g. the payment screen), not this sheet.
    router.back();
    requestAnimationFrame(() => cfg?.onConfirm());
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ThemedText
        style={[styles.title, { fontFamily: fontFamilyFor('bold', locale), textAlign: 'center' }]}>
        {cfg?.title ?? ''}
      </ThemedText>
      {cfg?.message ? (
        <ThemedText
          style={[styles.subtitle, { fontFamily: fontFamilyFor('regular', locale), textAlign: 'center' }]}>
          {cfg.message}
        </ThemedText>
      ) : null}

      <PressableScale
        onPress={confirm}
        scaleTo={0.98}
        haptic="forward"
        style={[styles.btn, cfg?.destructive ? styles.btnDanger : styles.btnPrimary]}>
        <ThemedText style={[styles.btnText, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {cfg?.confirmLabel ?? t({ ar: 'تأكيد', en: 'Confirm' })}
        </ThemedText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  title: { fontSize: 20, lineHeight: 26, color: TEXT_PRIMARY },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_SECONDARY,
    marginBottom: Spacing[5],
    maxWidth: 320,
  },
  btn: {
    alignSelf: 'stretch',
    paddingVertical: Spacing[4],
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#000000' },
  btnDanger: { backgroundColor: DANGER },
  btnText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21 },
});
