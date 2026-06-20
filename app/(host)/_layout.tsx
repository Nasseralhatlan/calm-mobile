import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { AccountIcon } from '@/components/icons/account-icon';
import { CalendarIcon } from '@/components/icons/calendar-icon';
import { FinanceIcon } from '@/components/icons/finance-icon';
import { HomeIcon } from '@/components/icons/home-icon';
import { ListingsIcon } from '@/components/icons/listings-icon';
import { useT } from '@/lib/i18n';

export default function HostTabLayout() {
  const t = useT();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t({ ar: 'الرئيسية', en: 'Home' }),
          tabBarIcon: ({ color }) => <HomeIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t({ ar: 'الحجوزات', en: 'Bookings' }),
          tabBarIcon: ({ color }) => <CalendarIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: t({ ar: 'عقاراتي', en: 'Listings' }),
          tabBarIcon: ({ color }) => <ListingsIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: t({ ar: 'الماليات', en: 'Finance' }),
          tabBarIcon: ({ color }) => <FinanceIcon size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t({ ar: 'حسابي', en: 'Account' }),
          tabBarIcon: ({ color }) => <AccountIcon size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
