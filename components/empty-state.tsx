import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import type { ComponentProps } from 'react';

interface EmptyStateProps {
  icon?: ComponentProps<typeof IconSymbol>['name'];
  title: string;
  body?: string;
}

export function EmptyState({ icon, title, body }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={styles.iconWrap}>
          <IconSymbol name={icon} size={32} color={Colors.light.textMuted} />
        </View>
      ) : null}
      <ThemedText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </ThemedText>
      {body ? (
        <ThemedText variant="body" tone="muted" style={{ textAlign: 'center', marginTop: Spacing[2] }}>
          {body}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
});
