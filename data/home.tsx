import { createContext, useContext, type ReactNode } from 'react';

import type { HomeData } from '@/hooks/use-bootstrap';

const HomeDataContext = createContext<HomeData | null>(null);
const HomeRefreshContext = createContext<() => Promise<void>>(async () => {});

export function HomeDataProvider({
  value,
  refresh,
  children,
}: {
  value: HomeData | null;
  refresh?: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <HomeRefreshContext.Provider value={refresh ?? (async () => {})}>
      <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>
    </HomeRefreshContext.Provider>
  );
}

export function useHomeData(): HomeData | null {
  return useContext(HomeDataContext);
}

export function useHomeRefresh(): () => Promise<void> {
  return useContext(HomeRefreshContext);
}
