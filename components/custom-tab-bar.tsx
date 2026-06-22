import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale } from '@/lib/i18n';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const labelFont = fontFamilyFor('medium', locale);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom * 0.75 }]}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={styles.tint} pointerEvents="none" />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isFirst = index === 0;
          const isLast = index === state.routes.length - 1;
          const color = isFocused
            ? Colors.light.coral
            : Colors.light.tabIconDefault;

          const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
          const label = typeof rawLabel === 'string' ? rawLabel : route.name;

          const icon = options.tabBarIcon?.({
            color,
            focused: isFocused,
            size: 22,
          });

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              navigation.navigate(route.name, route.params);
            }
          };

          const edgeSlop = Spacing[3];

          return (
            <TabItem
              key={route.key}
              onPress={handlePress}
              icon={icon}
              label={label}
              color={color}
              labelFont={labelFont}
              hitSlop={{
                // The row reverses natively under RTL, so the first tab sits on
                // the physical right — give edge slop to the correct side.
                left: (isRTL ? isLast : isFirst) ? edgeSlop : 0,
                right: (isRTL ? isFirst : isLast) ? edgeSlop : 0,
                top: 0,
                bottom: 0,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  onPress,
  icon,
  label,
  color,
  labelFont,
  hitSlop,
}: {
  onPress: (e: GestureResponderEvent) => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  labelFont: string;
  hitSlop?: { left: number; right: number; top: number; bottom: number };
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 380, mass: 0.5 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 380, mass: 0.5 });
      }}
      style={styles.tab}>
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {icon}
        <ThemedText
          style={[styles.label, { color, fontFamily: labelFont }]}
          numberOfLines={1}>
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 6,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  row: {
    flexDirection: 'row',
    paddingTop: Spacing[2],
    paddingBottom: 0,
    paddingHorizontal: Spacing[3],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
