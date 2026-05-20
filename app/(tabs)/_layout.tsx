import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { AccountIcon } from '@/components/icons/account-icon';
import { CalendarIcon } from '@/components/icons/calendar-icon';
import { HeartIcon } from '@/components/icons/heart-icon';
import { SearchIcon } from '@/components/icons/search-icon';
import { useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

export default function TabLayout() {
  const t = useT();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t(STR.tabs.explore),
          tabBarIcon: ({ color }) => <SearchIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: t(STR.tabs.likes),
          tabBarIcon: ({ color, focused }) => (
            <HeartIcon size={22} stroke={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t(STR.tabs.bookings),
          tabBarIcon: ({ color }) => <CalendarIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t(STR.tabs.profile),
          tabBarIcon: ({ color }) => <AccountIcon size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
