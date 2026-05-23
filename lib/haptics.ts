import * as Haptics from 'expo-haptics';

export type HapticKind = 'tap' | 'forward' | 'back' | 'select' | 'none';

export function fireHaptic(kind: HapticKind) {
  switch (kind) {
    case 'tap':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      return;
    case 'forward':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      return;
    case 'back':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      return;
    case 'select':
      Haptics.selectionAsync().catch(() => {});
      return;
    case 'none':
      return;
  }
}
