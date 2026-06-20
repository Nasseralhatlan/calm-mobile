import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

interface SignInPromptProps {
  emoji?: string;
  title?: { ar: string; en: string };
  message?: { ar: string; en: string };
}

export function SignInPrompt({ emoji = '👋', title, message }: SignInPromptProps) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();

  const defaultTitle = { ar: 'سجل دخولك', en: 'Sign in' };
  const defaultMessage = {
    ar: 'سجل دخولك عشان تشوف محتوى صفحتك.',
    en: 'Sign in to see your content on this page.',
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        <ThemedText
          style={[
            styles.title,
            { fontFamily: fontFamilyFor('bold', locale), writingDirection: 'rtl' },
          ]}>
          {t(title ?? defaultTitle)}
        </ThemedText>
        <ThemedText
          style={[
            styles.message,
            { fontFamily: fontFamilyFor('regular', locale), writingDirection: 'rtl' },
          ]}>
          {t(message ?? defaultMessage)}
        </ThemedText>
        <PressableScale
          scaleTo={0.97}
          haptic="forward"
          onPress={() => router.push('/login')}
          style={styles.button}>
          <ThemedText
            style={[styles.buttonText, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {t({ ar: 'تسجيل الدخول', en: 'Login' })}
          </ThemedText>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  inner: {
    alignItems: 'center',
    gap: Spacing[3],
    width: '100%',
    maxWidth: 360,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: Colors.light.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  button: {
    alignSelf: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
});
