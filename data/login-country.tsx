import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ApiCountry } from '@/lib/api';

interface LoginCountryContext {
  country: ApiCountry | null;
  setCountry: (c: ApiCountry | null) => void;
}

const Ctx = createContext<LoginCountryContext>({ country: null, setCountry: () => {} });

export function LoginCountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<ApiCountry | null>(null);
  const value = useMemo(() => ({ country, setCountry }), [country]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLoginCountry(): LoginCountryContext {
  return useContext(Ctx);
}
