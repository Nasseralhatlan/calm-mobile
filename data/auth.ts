import type { User } from './types';

export const currentUser: User = {
  id: 'u_nasser',
  name: { ar: 'ناصر القحطاني', en: 'Nasser Alkahtani' },
  email: 'nasser@calm.app',
  phone: '+966500000000',
  avatarUrl: 'https://i.pravatar.cc/300?img=12',
  preferredLocale: 'ar',
  createdAt: '2026-01-01T00:00:00Z',
};

export function useCurrentUser(): User {
  return currentUser;
}
