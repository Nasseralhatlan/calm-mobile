import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

type Action = { type: 'toggle'; id: string };

function reducer(state: Set<string>, action: Action): Set<string> {
  const next = new Set(state);
  if (action.type === 'toggle') {
    if (next.has(action.id)) next.delete(action.id);
    else next.add(action.id);
  }
  return next;
}

interface LikesContextValue {
  likes: Set<string>;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

const LikesContext = createContext<LikesContextValue | null>(null);

export function LikesProvider({ children }: { children: ReactNode }) {
  const [likes, dispatch] = useReducer(reducer, new Set<string>(['l_chalet_01', 'l_rest_02']));

  const toggle = useCallback((id: string) => dispatch({ type: 'toggle', id }), []);
  const has = useCallback((id: string) => likes.has(id), [likes]);

  const value = useMemo(() => ({ likes, toggle, has }), [likes, toggle, has]);

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes(): LikesContextValue {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error('useLikes must be used within LikesProvider');
  return ctx;
}
