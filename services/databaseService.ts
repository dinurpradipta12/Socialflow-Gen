
import { User } from '../types';

/**
 * DATABASE SERVICE (Supabase/PostgreSQL Bridge)
 * Menggunakan REST API standar untuk kompatibilitas maksimal tanpa npm install tambahan.
 */

export const databaseService = {
  /**
   * Mengirim data user tunggal ke Database
   */
  upsertUser: async (config: { url: string; key: string }, user: User) => {
    if (!config.url || !config.key) return;

    // Format URL Supabase standar: https://xyz.supabase.co/rest/v1/users
    // Membersihkan URL jika user hanya memasukkan base URL
    const baseUrl = config.url.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/users`;

    // Mapping data aplikasi ke format Database (snake_case standard)
    const payload = {
      user_id: user.id,
      full_name: user.name,
      email: user.email,
      role: user.role,
      whatsapp: user.whatsapp || null,
      status: user.status || 'active',
      subscription_expiry: user.subscriptionExpiry || null,
      performance_score: user.performanceScore || 0,
      last_updated: new Date().toISOString()
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Prefer': 'resolution=merge-duplicates' // Upsert logic
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`DB Error: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error("Database Sync Error:", error);
      throw error;
    }
  },

  /**
   * Mendapatkan SQL Schema untuk setup awal
   */
  getSchemaSQL: () => {
    return `
-- JALANKAN QUERY INI DI DATABASE POSTGRESQL ANDA (SUPABASE SQL EDITOR) --

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'viewer',
    whatsapp VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    subscription_expiry DATE,
    performance_score INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opsional: Index untuk performa query monitoring --
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    `.trim();
  }
};
