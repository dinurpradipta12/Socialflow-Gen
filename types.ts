
export type UserRole = 'admin' | 'editor' | 'viewer' | 'superuser' | 'developer';

export interface Permissions {
  dashboard: boolean;
  calendar: boolean;
  ads: boolean;
  analytics: boolean;
  tracker: boolean;
  team: boolean;
  settings: boolean;
  contentPlan: boolean;
  devPortal?: boolean;
  messages?: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'checkin' | 'checkout';
  timestamp: string;
  report?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  permissions: Permissions;
  isSubscribed: boolean;
  subscriptionExpiry?: string;
  jobdesk: string;
  kpi: string[];
  activityLogs: ActivityLog[];
  performanceScore: number;
  socialMedia?: string;
  birthDate?: string;
  settings?: UserSettings;
  workspaceId?: string;
}

export interface UserSettings {
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  darkMode: boolean;
  appLogo?: string;
  dbSourceUrl?: string; // URL Google Sheets atau External DB
}

export interface SystemNotification {
  id: string;
  type: 'invite' | 'system' | 'mention';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  password?: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface ContentPlanItem {
  id: string;
  status: 'Drafting' | 'Dijadwalkan' | 'Diposting' | 'Revisi' | 'Reschedule' | 'Dibatalkan';
  value: string;
  pillar: string;
  type: string;
  title: string;
  scriptUrl?: string;
  visualUrl?: string;
  postLink: string;
  description: string;
  approvedBy?: string;
}

export interface PostInsight {
  id?: string;
  url: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  analysis: string;
  timestamp?: string;
  sourceType?: 'plan' | 'manual';
}

export type ThemeColor = 'blue' | 'purple' | 'emerald' | 'rose' | 'slate' | 'custom';

export interface Workspace {
  id: string;
  name: string;
  color: ThemeColor;
  members: User[];
  inviteCode: string;
  ownerId: string;
}

export interface ContentItem {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduledDate: string;
  description: string;
}
