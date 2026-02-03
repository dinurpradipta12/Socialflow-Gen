
import { User, RegistrationRequest, Workspace, ContentPlanItem } from '../types';

/**
 * DATABASE SERVICE (Supabase/PostgreSQL Bridge)
 * Menggunakan REST API standar untuk kompatibilitas maksimal tanpa npm install tambahan.
 */

export const databaseService = {
  /**
   * Mengirim data user tunggal ke Database (Tabel Users)
   */
  upsertUser: async (config: { url: string; key: string }, user: User) => {
    if (!config.url || !config.key) return;

    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/users`;

    const payload = {
      user_id: user.id,
      full_name: user.name,
      email: user.email,
      password: user.password, // Ensure password is sent
      role: user.role,
      whatsapp: user.whatsapp || null,
      status: user.status || 'active',
      subscription_expiry: user.subscriptionExpiry || null,
      performance_score: user.performanceScore || 0,
      workspace_id: user.workspaceId || null, 
      last_updated: new Date().toISOString()
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`DB Error (${response.status}): ${err.message || err.error || response.statusText || 'Unknown error'}`);
      }
      return true;
    } catch (error) {
      console.error("Database Sync Error:", error);
      throw error;
    }
  },

  /**
   * Update Password User Realtime
   */
  updatePassword: async (config: { url: string; key: string }, userId: string, newPassword: string) => {
    if (!config.url || !config.key) return;
    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/users?user_id=eq.${encodeURIComponent(userId)}`;

    const payload = {
        password: newPassword,
        last_updated: new Date().toISOString()
    };

    const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Gagal update password di database");
    return true;
  },

  /**
   * Mengambil SELURUH data user dari Database (Realtime Fetch)
   */
  getAllUsers: async (config: { url: string; key: string }): Promise<User[]> => {
    if (!config.url || !config.key) return [];

    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/users?select=*&order=last_updated.desc`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Gagal mengambil data users");
      
      const data = await response.json();
      
      return data.map((dbUser: any) => ({
        id: dbUser.user_id,
        name: dbUser.full_name,
        email: dbUser.email,
        password: dbUser.password || 'Social123',
        role: dbUser.role as any,
        whatsapp: dbUser.whatsapp,
        status: dbUser.status,
        subscriptionExpiry: dbUser.subscription_expiry,
        performanceScore: dbUser.performance_score,
        workspaceId: dbUser.workspace_id, // Map workspace_id
        permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
        isSubscribed: true,
        jobdesk: 'Member',
        kpi: [],
        activityLogs: [],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbUser.full_name}`
      }));

    } catch (error) {
      console.error("Get All Users Error:", error);
      throw error;
    }
  },

  /**
   * Mengambil data user berdasarkan email untuk Login Check
   */
  getUserByEmail: async (config: { url: string; key: string }, email: string): Promise<User | null> => {
    if (!config.url || !config.key) return null;

    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*&limit=1`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      if (data && data.length > 0) {
        const dbUser = data[0];
        return {
            id: dbUser.user_id,
            name: dbUser.full_name,
            email: dbUser.email,
            password: dbUser.password || 'Social123',
            role: dbUser.role as any,
            whatsapp: dbUser.whatsapp,
            status: dbUser.status,
            subscriptionExpiry: dbUser.subscription_expiry,
            performanceScore: dbUser.performance_score,
            workspaceId: dbUser.workspace_id,
            permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
            isSubscribed: true,
            jobdesk: 'Member',
            kpi: [],
            activityLogs: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbUser.full_name}`
        };
      }
      return null;
    } catch (error) {
      console.error("Get User Error:", error);
      return null;
    }
  },

  /**
   * WORKSPACE: Membuat Workspace Baru di Database
   */
  createWorkspace: async (config: { url: string; key: string }, ws: Workspace) => {
    if (!config.url || !config.key) throw new Error("Database Config Missing");

    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/workspaces`;

    const payload = {
        id: ws.id,
        name: ws.name,
        color: ws.color,
        invite_code: ws.inviteCode,
        owner_id: ws.ownerId,
        created_at: new Date().toISOString()
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Gagal membuat workspace (${response.status}): ${err.message || err.error || response.statusText}`);
    }
    return true;
  },

  /**
   * WORKSPACE: Mencari Workspace berdasarkan Kode Invite
   */
  getWorkspaceByCode: async (config: { url: string; key: string }, code: string): Promise<Workspace | null> => {
    if (!config.url || !config.key) return null;

    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/workspaces?invite_code=eq.${encodeURIComponent(code)}&select=*&limit=1`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'apikey': config.key,
                'Authorization': `Bearer ${config.key}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return null;
        const data = await response.json();
        
        if (data && data.length > 0) {
            const w = data[0];
            return {
                id: w.id,
                name: w.name,
                color: w.color,
                inviteCode: w.invite_code,
                ownerId: w.owner_id,
                members: [] // Members akan di-fetch terpisah/realtime via users table
            };
        }
        return null;
    } catch (e) {
        console.error("Get Workspace Error", e);
        return null;
    }
  },

  /**
   * WORKSPACE: Mengambil Workspace Detail berdasarkan ID
   */
  getWorkspaceById: async (config: { url: string; key: string }, id: string): Promise<Workspace | null> => {
    if (!config.url || !config.key) return null;
    
    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/workspaces?id=eq.${encodeURIComponent(id)}&select=*&limit=1`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'apikey': config.key,
                'Authorization': `Bearer ${config.key}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        
        if (data && data.length > 0) {
            const w = data[0];
            return {
                id: w.id,
                name: w.name,
                color: w.color,
                inviteCode: w.invite_code,
                ownerId: w.owner_id,
                members: [] 
            };
        }
        return null;
    } catch(e) { return null; }
  },

  /**
   * SHARED DATA: Mengambil Content Plans berdasarkan Workspace ID
   */
  getContentPlans: async (config: { url: string; key: string }, workspaceId: string): Promise<ContentPlanItem[]> => {
    if (!config.url || !config.key || !workspaceId) return [];
    
    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/content_plans?workspace_id=eq.${encodeURIComponent(workspaceId)}&order=created_at.desc`;
    
    try {
      const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
              'apikey': config.key,
              'Authorization': `Bearer ${config.key}`,
          }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((d: any) => ({
          ...d,
          comments: d.comments ? JSON.parse(d.comments) : []
      }));
    } catch (e) { return []; }
  },

  /**
   * SHARED DATA: Simpan Content Plan
   */
  upsertContentPlan: async (config: { url: string; key: string }, item: ContentPlanItem) => {
    if (!config.url || !config.key) throw new Error("Konfigurasi database belum diatur.");

    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/content_plans`;

    const payload = {
        id: item.id,
        workspace_id: item.workspaceId,
        creator_id: item.creatorId,
        title: item.title,
        status: item.status,
        platform: item.platform,
        value: item.value,
        pillar: item.pillar,
        type: item.type,
        description: item.description,
        post_link: item.postLink,
        approved_by: item.approvedBy,
        account_id: item.accountId,
        post_date: item.postDate,
        pic: item.pic,
        comments: JSON.stringify(item.comments || []),
        created_at: new Date().toISOString()
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`DB Error (${response.status}): ${err.message || 'Tabel content_plans mungkin belum dibuat di Supabase.'}`);
    }
  },

  /**
   * Mendaftarkan user baru ke tabel 'registrations' (Public Registration)
   */
  createRegistration: async (config: { url: string; key: string }, data: any) => {
    if (!config.url || !config.key) throw new Error("Database belum terkonfigurasi di sisi Admin.");

    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/registrations`;

    const payload = {
      name: data.name,
      email: data.email,
      password: data.password, 
      whatsapp: data.whatsapp,
      reason: data.reason,
      status: 'pending', 
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
         const err = await response.json().catch(() => ({}));
         throw new Error(`Registration Failed (${response.status}): ${err.message || err.error || response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error("Registration Error:", error);
      throw error;
    }
  },

  fetchApprovedRegistrations: async (config: { url: string; key: string }) => {
    if (!config.url || !config.key) return [];
    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/registrations?status=eq.approved&select=*`;
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Fetch Approved Error:", error);
      return [];
    }
  },

  getSchemaSQL: () => {
    return `
-- TABLE 1: USERS
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'viewer',
    whatsapp VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    subscription_expiry DATE,
    performance_score INTEGER DEFAULT 0,
    workspace_id VARCHAR(255),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MIGRATION: Ensure workspace_id exists (Safely add if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(255);

-- TABLE 2: REGISTRATIONS
CREATE TABLE IF NOT EXISTS registrations (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    whatsapp VARCHAR(50),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE 3: WORKSPACES
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50),
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    owner_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE 4: CONTENT PLANS (SHARED DATA)
-- Jalankan ini jika Anda mendapatkan error saat menyimpan plan
CREATE TABLE IF NOT EXISTS content_plans (
    id VARCHAR(255) PRIMARY KEY,
    workspace_id VARCHAR(255),
    creator_id VARCHAR(255),
    title TEXT,
    status VARCHAR(50),
    platform VARCHAR(50),
    value TEXT,
    pillar TEXT,
    type VARCHAR(50),
    description TEXT,
    post_link TEXT,
    approved_by VARCHAR(255),
    account_id VARCHAR(255),
    post_date DATE,
    pic VARCHAR(255),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_ws_code ON workspaces(invite_code);
CREATE INDEX IF NOT EXISTS idx_cp_ws ON content_plans(workspace_id);

-- SECURITY SETTINGS (DISABLE RLS FOR APP ACCESS)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans DISABLE ROW LEVEL SECURITY;
    `.trim();
  }
};
