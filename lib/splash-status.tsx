import { createContext, useContext, type ReactNode } from 'react';

const SplashStatusContext = createContext<boolean>(false);

export function SplashStatusProvider({
  gone,
  children,
}: {
  gone: boolean;
  children: ReactNode;
}) {
  return <SplashStatusContext.Provider value={gone}>{children}</SplashStatusContext.Provider>;
}

export function useSplashGone(): boolean {
  return useContext(SplashStatusContext);
}
