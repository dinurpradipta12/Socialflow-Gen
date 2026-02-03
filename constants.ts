
import { Workspace, ContentItem, User, Permissions, RegistrationRequest, ContentPlanItem, Message } from './types';

export const APP_VERSION = '4.0.0-Arunika'; 
export const APP_NAME = 'Arunika Social Pulse';

// KONFIGURASI DATABASE GLOBAL (AUTO CONNECT)
export const SUPABASE_CONFIG = {
  url: "https://cphxdkiyoiupcicqehqw.supabase.co",
  key: "sb_publishable_dEOcOz4erkIA9MiZeXzDPg_v92cLWcA"
};

export const THEME_COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-500', border: 'border-blue-200', light: 'bg-blue-50', hover: 'hover:bg-blue-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-500', border: 'border-purple-200', light: 'bg-purple-50', hover: 'hover:bg-purple-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-500', border: 'border-emerald-200', light: 'bg-emerald-50', hover: 'hover:bg-emerald-200' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-500', border: 'border-rose-200', light: 'bg-rose-50', hover: 'hover:bg-rose-200' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', light: 'bg-slate-50', hover: 'hover:bg-emerald-200' },
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
  email: 'cs.arunika@gmail.com',
  password: 'Dinur@12345'
};

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'Owner Arunika', 
    email: 'admin@arunika.id', 
    password: 'admin', // Default password for mock
    role: 'superuser', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    permissions: { ...FULL_PERMISSIONS, devPortal: false },
    isSubscribed: true,
    subscriptionExpiry: '2025-12-31',
    jobdesk: 'CEO & Strategist',
    kpi: ['Grow Monthly Users by 20%', 'Maintain System Stability'],
    activityLogs: [{ id: 'l1', type: 'checkin', timestamp: '2023-10-25T08:00:00Z' }],
    performanceScore: 92,
    socialMedia: '@arunika_pulse',
    birthDate: '1995-05-20'
  },
  { 
    id: 'dev-1', 
    name: 'Arunika Dev', 
    email: DEV_CREDENTIALS.email, 
    password: DEV_CREDENTIALS.password,
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

export const MOCK_REGISTRATIONS: RegistrationRequest[] = [
  { 
    id: 'r1', 
    name: 'Andi Pratama', 
    email: 'andi@gmail.com', 
    timestamp: '2023-10-24 10:00', 
    status: 'pending',
    handle: '@andipratama',
    niche: 'Tech & Lifestyle',
    nodeId: 'sf-node-mock-001'
  },
];

export const MOCK_WORKSPACES: Workspace[] = [
  { 
    id: 'ws1', 
    name: 'Arunika Creative Studio', 
    color: 'blue', 
    members: MOCK_USERS,
    inviteCode: 'arunika-2025-join',
    ownerId: '1'
  },
];

export const MOCK_CONTENT: ContentItem[] = [
  { 
    id: 'c1', 
    title: 'Brand Anniversary Post', 
    platform: 'instagram', 
    status: 'published', 
    scheduledDate: '2023-10-25', 
    description: 'Celebrating our milestones.' 
  },
  { 
    id: 'c2', 
    title: 'AI Tools Roundup', 
    platform: 'youtube', 
    status: 'scheduled', 
    scheduledDate: '2023-10-28', 
    description: 'Video about latest AI advancements.' 
  }
];

export const MOCK_CONTENT_PLANS: ContentPlanItem[] = [
  { 
    id: 'cp1', 
    title: 'Strategi Q4 Arunika', 
    status: 'Drafting',
    platform: 'Instagram', 
    value: 'Educational', 
    pillar: 'Marketing', 
    type: 'Reels', 
    pic: 'Owner Arunika',
    description: 'Strategi konten untuk akhir tahun.', 
    postLink: 'https://instagram.com/arunika', 
    approvedBy: 'Owner Arunika',
    accountId: 'account-1', // Default account
    comments: [],
    postDate: '2023-10-25'
  },
  { 
    id: 'cp2', 
    title: 'Testimoni User', 
    status: 'Diposting', 
    platform: 'TikTok',
    value: 'Engagement', 
    pillar: 'Community', 
    type: 'Carousel', 
    pic: 'Arunika Dev',
    description: 'Sharing apa kata mereka.', 
    postLink: 'https://instagram.com/p/mock123', 
    approvedBy: '',
    accountId: 'account-1',
    comments: [
      { id: 'cm1', userId: '1', userName: 'Owner Arunika', text: 'Tolong revisi slide ke-3 ya, font terlalu kecil.', timestamp: '2023-10-26T10:00:00Z' }
    ],
    postDate: '2023-10-26'
  }
];

export const MOCK_MESSAGES: Message[] = [
  { 
    id: 'msg1', 
    senderId: '1', 
    text: 'Halo tim, selamat datang di Arunika Social Pulse!', 
    timestamp: new Date().toISOString() 
  }
];
