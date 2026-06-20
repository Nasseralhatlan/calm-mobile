import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { ApiCity } from '@/lib/api';

import { useHomeData } from './home';

interface SelectedCityContext {
  city: ApiCity | null;
  setCity: (c: ApiCity) => void;
}

const Ctx = createContext<SelectedCityContext>({ city: null, setCity: () => {} });

export function SelectedCityProvider({ children }: { children: ReactNode }) {
  const home = useHomeData();
  const [city, setCity] = useState<ApiCity | null>(null);

  useEffect(() => {
    if (city || !home?.cities?.length) return;
    const riyadh = home.cities.find((c) => c.name_en.toLowerCase() === 'riyadh');
    setCity(riyadh ?? home.cities[0]);
  }, [home?.cities, city]);

  return <Ctx.Provider value={{ city, setCity }}>{children}</Ctx.Provider>;
}

export function useSelectedCity(): SelectedCityContext {
  return useContext(Ctx);
}
