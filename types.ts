
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

export interface SocialAccount {
  id: string;
  name: string;
  instagramUsername?: string;
  tiktokUsername?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; 
  whatsapp?: string;
  role: UserRole;
  avatar?: string;
  permissions: Permissions;
  isSubscribed: boolean;
  activationDate?: string;
  subscriptionExpiry?: string;
  status?: 'active' | 'suspended' | 'expired' | 'pending';
  jobdesk: string;
  kpi: string[];
  activityLogs: ActivityLog[];
  performanceScore: number;
  socialMedia?: string;
  birthDate?: string;
  settings?: UserSettings;
  workspaceId?: string; // ID Workspace tempat profil ini berada
  requiresPasswordChange?: boolean;
}

export interface CloudConfig {
  apiKey: string;
  endpoint: string;
  syncToken: string;
  lastSync: string;
  status: 'online' | 'offline' | 'syncing';
}

export interface UserSettings {
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  darkMode: boolean;
  appLogo?: string;
  dbSourceUrl?: string;
  cloud?: CloudConfig;
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  password?: string;
  handle?: string;
  niche?: string;
  reason?: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  nodeId: string;
  workspaceChoice?: 'join' | 'create'; 
  targetWorkspaceId?: string; // If joining
  newWorkspaceName?: string; // If creating
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  attachment?: string; // Base64 string for images/files
  attachmentType?: 'image' | 'file';
}

export interface ContentPlanItem {
  id: string;
  workspaceId?: string; // NEW: For data sharing
  creatorId?: string; 
  status: 'Menunggu Review' | 'Sedang di Review' | 'Approved' | 'Drafting' | 'Dijadwalkan' | 'Diposting' | 'Revisi' | 'Reschedule' | 'Dibatalkan';
  platform: 'Instagram' | 'TikTok' | 'YouTube'; 
  pic?: string; 
  value: string;
  pillar: string;
  type: string;
  title: string;
  scriptUrl?: string;
  visualUrl?: string;
  postLink: string;
  description: string;
  approvedBy?: string;
  accountId?: string; 
  postDate?: string; 
  comments?: Comment[];
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
  sourceType?: 'plan' | 'manual' | 'cloud_pull';
  postDate?: string;
}

export type ThemeColor = 'blue' | 'purple' | 'emerald' | 'rose' | 'slate' | 'custom';

export interface Workspace {
  id: string;
  name: string;
  color: ThemeColor;
  members: User[]; // Array of users who have profiles in this workspace
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

export interface SystemNotification {
  id: string;
  senderName: string;
  messageText: string;
  timestamp: string;
  read: boolean;
  type?: 'info' | 'warning' | 'success';
  targetContentId?: string; 
}

export interface AccountAnalytics {
  username: string;
  platform: 'Instagram' | 'TikTok';
  followerCount: number;
  avgEngagementRate: number;
  totalComments: number;
  totalLikes: number;
  growthData: { date: string; followers: number }[];
  posts: {
    id: string;
    thumbnail: string;
    caption: string;
    type: 'image' | 'video' | 'reel';
    date: string;
    metrics: {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
    };
    engagementRate: number;
  }[];
}
