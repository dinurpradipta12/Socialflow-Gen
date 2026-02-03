
import { Workspace, ContentItem, User, Permissions, RegistrationRequest, ContentPlanItem, Message } from './types';

export const APP_VERSION = '3.0.9'; 

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
  email: 'cs.socialflow@gmail.com',
  password: 'Dinur@12345'
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
    name: 'Socialflow Dev', 
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

export const MOCK_REGISTRATIONS: RegistrationRequest[] = [
  { 
    id: 'r1', 
    name: 'Andi Pratama', 
    email: 'andi@gmail.com', 
    timestamp: '2023-10-24 10:00', 
    status: 'pending',
    handle: '@andipratama',
    niche: 'Tech & Lifestyle',
    // Added missing required property nodeId
    nodeId: 'sf-node-mock-001'
  },
];

export const MOCK_WORKSPACES: Workspace[] = [
  { 
    id: 'ws1', 
    name: 'Snaillabs Creative', 
    color: 'blue', 
    members: MOCK_USERS,
    inviteCode: 'sf-snaillabs-2025',
    ownerId: '1'
  },
];

/**
 * Added missing MOCK_CONTENT to fix compilation error in Calendar.tsx
 */
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

/**
 * Added missing MOCK_CONTENT_PLANS to fix compilation error in ContentPlan.tsx
 */
export const MOCK_CONTENT_PLANS: ContentPlanItem[] = [
  { 
    id: 'cp1', 
    title: 'Snaillabs Q4 Strategy', 
    status: 'Drafting', 
    value: 'Educational', 
    pillar: 'Marketing', 
    type: 'Reels', 
    description: 'Our core strategy for the last quarter.', 
    postLink: 'https://instagram.com/snaillabs', 
    approvedBy: 'Super Admin' 
  },
  { 
    id: 'cp2', 
    title: 'User Feedback Highlight', 
    status: 'Diposting', 
    value: 'Engagement', 
    pillar: 'Community', 
    type: 'Carousel', 
    description: 'Sharing what our users say about us.', 
    postLink: 'https://instagram.com/p/mock123', 
    approvedBy: 'Super Admin' 
  }
];

/**
 * Added missing MOCK_MESSAGES to fix compilation error in Messages.tsx
 */
export const MOCK_MESSAGES: Message[] = [
  { 
    id: 'msg1', 
    senderId: '1', 
    text: 'Halo tim, bagaimana progress dashboard?', 
    timestamp: new Date().toISOString() 
  },
  { 
    id: 'msg2', 
    senderId: 'dev-1', 
    text: 'Sedang optimasi cloud sync engine v3.0.8.', 
    timestamp: new Date().toISOString() 
  }
];
