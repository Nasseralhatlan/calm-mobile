import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { HapticKind } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  fullWidth?: boolean;
  haptic?: HapticKind;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  leading,
  trailing,
  fullWidth = false,
  haptic = 'tap',
}: ButtonProps) {
  const palette = Colors.light;

  const colorMap: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: disabled ? palette.coralDisabled : palette.coral, fg: '#FFFFFF' },
    secondary: { bg: '#1A1A1A', fg: '#FFFFFF' },
    ghost: { bg: 'transparent', fg: palette.text, border: palette.border },
  };

  const sizeMap: Record<Size, { paddingV: number; paddingH: number; fontSize: number }> = {
    lg: { paddingV: Spacing[4], paddingH: Spacing[6], fontSize: 17 },
    md: { paddingV: Spacing[3], paddingH: Spacing[5], fontSize: 16 },
    sm: { paddingV: Spacing[2], paddingH: Spacing[4], fontSize: 14 },
  };

  const c = colorMap[variant];
  const s = sizeMap[size];

  return (
    <PressableScale
      disabled={disabled}
      haptic={haptic}
      onPress={() => {
        if (disabled) return;
        onPress?.();
      }}
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        borderWidth: c.border ? StyleSheet.hairlineWidth * 2 : 0,
        borderRadius: Radius.pill,
        paddingVertical: s.paddingV,
        paddingHorizontal: s.paddingH,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        opacity: disabled ? 0.7 : 1,
      }}>
      {leading ? <View style={{ marginEnd: Spacing[2] }}>{leading}</View> : null}
      <ThemedText variant="bodyMedium" style={{ color: c.fg, fontSize: s.fontSize }}>
        {label}
      </ThemedText>
      {trailing ? <View style={{ marginStart: Spacing[2] }}>{trailing}</View> : null}
    </PressableScale>
  );
}
