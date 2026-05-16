import type { Host } from './types';

export const HOSTS: Host[] = [
  {
    id: 'h_001',
    name: { ar: 'فهد العتيبي', en: 'Fahad Al-Otaibi' },
    avatarUrl: 'https://i.pravatar.cc/300?img=33',
    joinedAt: '2024-03-10T00:00:00Z',
    languages: ['ar', 'en'],
    responseRate: 98,
    isSuperHost: true,
  },
  {
    id: 'h_002',
    name: { ar: 'سارة الحربي', en: 'Sarah Al-Harbi' },
    avatarUrl: 'https://i.pravatar.cc/300?img=45',
    joinedAt: '2024-07-22T00:00:00Z',
    languages: ['ar', 'en'],
    responseRate: 100,
    isSuperHost: true,
  },
  {
    id: 'h_003',
    name: { ar: 'عبدالعزيز الزهراني', en: 'Abdulaziz Al-Zahrani' },
    avatarUrl: 'https://i.pravatar.cc/300?img=51',
    joinedAt: '2025-01-08T00:00:00Z',
    languages: ['ar'],
    responseRate: 92,
    isSuperHost: false,
  },
  {
    id: 'h_004',
    name: { ar: 'منيرة القرني', en: 'Munirah Al-Qarni' },
    avatarUrl: 'https://i.pravatar.cc/300?img=47',
    joinedAt: '2023-11-02T00:00:00Z',
    languages: ['ar', 'en'],
    responseRate: 95,
    isSuperHost: true,
  },
  {
    id: 'h_005',
    name: { ar: 'خالد الدوسري', en: 'Khalid Al-Dosari' },
    avatarUrl: 'https://i.pravatar.cc/300?img=68',
    joinedAt: '2025-04-18T00:00:00Z',
    languages: ['ar', 'en'],
    responseRate: 89,
    isSuperHost: false,
  },
];

export function getHost(id: string): Host | undefined {
  return HOSTS.find((h) => h.id === id);
}
