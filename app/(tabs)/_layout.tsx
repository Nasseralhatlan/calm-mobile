import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ArabicFonts, Colors, Fonts } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

export default function TabLayout() {
  const palette = Colors.light;
  const t = useT();
  const { locale } = useLocale();
  const labelFont = locale === 'ar' ? ArabicFonts.medium : Fonts.medium;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.coral,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.divider,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: labelFont, fontSize: 11 },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t(STR.tabs.explore),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: t(STR.tabs.likes),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={26} name={focused ? 'heart.fill' : 'heart'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t(STR.tabs.bookings),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t(STR.tabs.profile),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={26}
              name={focused ? 'person.crop.circle.fill' : 'person.crop.circle'}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
