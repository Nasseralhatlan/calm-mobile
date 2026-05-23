import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale } from '@/lib/i18n';

interface SectionProps {
  title?: string;
  divider?: boolean;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export function Section({ title, divider = true, style, children }: SectionProps) {
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  return (
    <>
      {divider ? <View style={styles.divider} /> : null}
      <View style={[styles.section, style]}>
        {title ? (
          <ThemedText
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
        ) : null}
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[6],
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    color: Colors.light.text,
    marginBottom: Spacing[3],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
    marginHorizontal: Spacing[5],
  },
});
