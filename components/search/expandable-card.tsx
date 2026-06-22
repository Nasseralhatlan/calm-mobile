import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { LAYOUT_RTL, useLocale } from '@/lib/i18n';

interface ExpandableCardProps {
  label: string;
  value?: string;
  expanded: boolean;
  /** Called when the card's toggle area is tapped */
  onToggle: () => void;
  /** Negative margin to escape the parent frame's horizontal padding (search-mode edge-to-edge) */
  edgeToEdge?: boolean;
  children: ReactNode;
}

export function ExpandableCard({
  label,
  value,
  expanded,
  onToggle,
  edgeToEdge = false,
  children,
}: ExpandableCardProps) {
  const { locale } = useLocale();

  const handleToggle = () => {
    Haptics.selectionAsync().catch(() => {});
    onToggle();
  };

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[
        styles.card,
        expanded ? styles.cardExpanded : styles.cardCollapsed,
        edgeToEdge && styles.cardEdgeToEdge,
      ]}>
      <Pressable
        onPress={handleToggle}
        style={[
          styles.headerRow,
          { flexDirection: 'row' },
        ]}
        hitSlop={Spacing[1]}>
        <ThemedText
          style={[
            expanded ? styles.title : styles.label,
            { fontFamily: fontFamilyFor(expanded ? 'bold' : 'regular', locale) },
          ]}>
          {label}
        </ThemedText>
        {!expanded && value ? (
          <ThemedText
            numberOfLines={1}
            style={[styles.value, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {value}
          </ThemedText>
        ) : null}
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(100)}
          style={styles.body}>
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const CARD_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 25,
  elevation: 6,
} as const;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#F4F4F4',
    ...CARD_SHADOW,
  },
  cardCollapsed: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[5],
  },
  cardExpanded: {
    flex: 1,
    paddingTop: Spacing[5],
  },
  cardEdgeToEdge: {
    marginHorizontal: -Spacing[5],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    color: Colors.light.text,
    paddingHorizontal: Spacing[5],
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
    flexShrink: 1,
    textAlign: 'left',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
});
