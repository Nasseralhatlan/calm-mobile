import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale } from '@/lib/i18n';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

/**
 * Half-screen confirmation sheet: a dimmed backdrop + a rounded card that
 * slides up from the bottom. Rendered in-place over the current screen
 * (no route), so it works as an "are you sure?" gate before leaving.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive,
}: ConfirmSheetProps) {
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(150)}
        style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.springify().damping(20).mass(0.7)}
        exiting={SlideOutDown.duration(180)}
        style={[styles.sheet, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <View style={styles.grabber} />

        <ThemedText
          style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {title}
        </ThemedText>
        {message ? (
          <ThemedText
            style={[styles.message, { fontFamily: fontFamilyFor('regular', locale) }]}>
            {message}
          </ThemedText>
        ) : null}

        <PressableScale
          scaleTo={0.97}
          haptic="forward"
          onPress={onConfirm}
          style={destructive ? [styles.confirmBtn, styles.confirmBtnDestructive] : styles.confirmBtn}>
          <ThemedText
            style={[styles.confirmText, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {confirmLabel}
          </ThemedText>
        </PressableScale>

        <PressableScale
          scaleTo={0.97}
          haptic="back"
          onPress={onCancel}
          style={styles.cancelBtn}>
          <ThemedText
            style={[styles.cancelText, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {cancelLabel}
          </ThemedText>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[3],
    gap: Spacing[3],
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E5E5E5',
    marginBottom: Spacing[3],
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: Colors.light.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: Spacing[2],
  },
  confirmBtn: {
    paddingVertical: Spacing[4],
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  confirmBtnDestructive: {
    backgroundColor: '#C53030',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
  cancelBtn: {
    paddingVertical: Spacing[4],
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4',
  },
  cancelText: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 21,
  },
});
