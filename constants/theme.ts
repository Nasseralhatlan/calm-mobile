import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A1A',
    textMuted: '#6B7280',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E5E7EB',
    divider: '#F3F4F6',
    tint: '#F88379',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#1A1A1A',
    coral: '#F88379',
    coralPressed: '#E66E64',
    coralDisabled: '#FAB5AF',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    info: '#2563EB',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#ECEDEE',
    textMuted: '#9CA3AF',
    background: '#0A0A0A',
    surface: '#0F0F0F',
    surfaceElevated: '#1A1A1A',
    border: '#262626',
    divider: '#1F1F1F',
    tint: '#F88379',
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#ECEDEE',
    coral: '#F88379',
    coralPressed: '#E66E64',
    coralDisabled: '#5C3A37',
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#EF4444',
    info: '#3B82F6',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export const Fonts = {
  light: 'Satoshi-Light',
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  bold: 'Satoshi-Bold',
  black: 'Satoshi-Black',
} as const;

export const ArabicFonts = {
  light: 'thmanyahsans-Light',
  regular: 'thmanyahsans-Regular',
  medium: 'thmanyahsans-Medium',
  bold: 'thmanyahsans-Bold',
  black: 'thmanyahsans-Black',
} as const;

export type FontWeightKey = keyof typeof Fonts;

export function fontFamilyFor(weight: FontWeightKey, locale: 'ar' | 'en'): string {
  return locale === 'ar' ? ArabicFonts[weight] : Fonts[weight];
}

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

const ios = (style: ViewStyle): ViewStyle => (Platform.OS === 'ios' ? style : {});
const android = (style: ViewStyle): ViewStyle => (Platform.OS === 'android' ? style : {});

export const Shadows = {
  card: {
    ...ios({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    }),
    ...android({ elevation: 2 }),
  } satisfies ViewStyle,
  sheet: {
    ...ios({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    }),
    ...android({ elevation: 8 }),
  } satisfies ViewStyle,
  modal: {
    ...ios({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    }),
    ...android({ elevation: 16 }),
  } satisfies ViewStyle,
} as const;

export const Springs = {
  default: { damping: 14, stiffness: 180, mass: 1 },
  bouncy: { damping: 10, stiffness: 200, mass: 1 },
  gentle: { damping: 22, stiffness: 200, mass: 1 },
  snappy: { damping: 30, stiffness: 400, mass: 1 },
} as const;

type TextVariant = {
  fontFamily: (typeof Fonts)[keyof typeof Fonts];
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

export const Type = {
  display: { fontFamily: Fonts.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: Fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  heading: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 28 },
  subheading: { fontFamily: Fonts.medium, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: Fonts.medium, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: Fonts.medium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: Fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
} as const satisfies Record<string, TextVariant & TextStyle>;

const VARIANT_WEIGHT: Record<keyof typeof Type, FontWeightKey> = {
  display: 'bold',
  title: 'bold',
  heading: 'bold',
  subheading: 'medium',
  body: 'regular',
  bodyMedium: 'medium',
  callout: 'medium',
  caption: 'regular',
  micro: 'medium',
};

export function typeFor(variant: keyof typeof Type, locale: 'ar' | 'en'): TextStyle {
  return { ...Type[variant], fontFamily: fontFamilyFor(VARIANT_WEIGHT[variant], locale) };
}

export type ColorName = keyof (typeof Colors)['light'] & keyof (typeof Colors)['dark'];
export type RadiusName = keyof typeof Radius;
export type SpacingName = keyof typeof Spacing;
export type TypeName = keyof typeof Type;
