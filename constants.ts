
import { Workspace, ContentItem, User, Permissions, RegistrationRequest, ContentPlanItem, Message } from './types';

export const THEME_COLORS = {
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', light: 'bg-blue-50', hover: 'hover:bg-blue-700' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', light: 'bg-purple-50', hover: 'hover:bg-purple-700' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', light: 'bg-emerald-50', hover: 'hover:bg-emerald-700' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', light: 'bg-rose-50', hover: 'hover:bg-rose-700' },
  slate: { bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-800', light: 'bg-slate-50', hover: 'hover:bg-slate-900' },
};

const FULL_PERMISSIONS: Permissions = {
  dashboard: true,
  calendar: true,
  ads: true,
  analytics: true,
  tracker: true,
  team: true,
  settings: true,
  contentPlan: true,
  devPortal: true,
  messages: true,
};

export const DEV_CREDENTIALS = {
  email: 'dev@snaillabs.id',
  password: 'dev_snaillabs_2025'
};

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'Super Admin', 
    email: 'admin@snaillabs.id', 
    role: 'superuser', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    permissions: { ...FULL_PERMISSIONS, devPortal: false },
    isSubscribed: true,
    subscriptionExpiry: '2025-12-31',
    jobdesk: 'Operations Manager & Strategic Content Planner',
    kpi: ['Increase engagement by 20%', 'Maintain 95% publishing consistency'],
    activityLogs: [{ id: 'l1', type: 'checkin', timestamp: '2023-10-25T08:00:00Z' }],
    performanceScore: 92,
    socialMedia: '@snaillabs_admin',
    birthDate: '1995-05-20'
  },
  { 
    id: 'dev-1', 
    name: 'Snaillabs Dev', 
    email: DEV_CREDENTIALS.email, 
    role: 'developer', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
    permissions: FULL_PERMISSIONS,
    isSubscribed: true,
    subscriptionExpiry: '2030-01-01',
    jobdesk: 'System Architecture',
    kpi: ['100% Uptime'],
    activityLogs: [],
    performanceScore: 100
  }
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', senderId: '1', text: 'Halo tim, bagaimana progress konten hari ini?', timestamp: '2023-10-25T09:00:00Z' },
  { id: 'm2', senderId: 'dev-1', text: 'Sudah beres admin, tinggal di review saja.', timestamp: '2023-10-25T09:15:00Z' }
];

export const MOCK_REGISTRATIONS: RegistrationRequest[] = [
  { id: 'r1', name: 'Andi Pratama', email: 'andi@gmail.com', timestamp: '2023-10-24 10:00', status: 'pending' },
];

export const MOCK_CONTENT_PLANS: ContentPlanItem[] = [
  {
    id: 'cp1',
    // Fixed: 'Scheduled' is not valid for ContentPlanItem status, using 'Dijadwalkan'
    status: 'Dijadwalkan',
    value: 'Educational',
    pillar: 'Tech Tips',
    type: 'Carousel',
    title: 'Top 5 Tools for Social Media',
    scriptUrl: '#',
    visualUrl: 'https://picsum.photos/seed/content1/400/600',
    postLink: 'https://instagram.com/p/123',
    description: 'Detailed carousel showing apps like Socialflow.'
  }
];

export const MOCK_WORKSPACES: Workspace[] = [
  { id: 'ws1', name: 'Snaillabs Creative', color: 'blue', members: MOCK_USERS },
];

export const MOCK_CONTENT: ContentItem[] = [
  { id: '1', title: 'Product Launch Video', platform: 'instagram', status: 'scheduled', scheduledDate: '2023-10-25', description: 'Video promosi.' },
];
