
import { RegistrationRequest } from '../types';

/**
 * SOCIALFLOW CLOUD BRIDGE (Simulator)
 * Dioptimalkan untuk persistensi data pendaftaran yang lebih kuat.
 */

const CLOUD_STORAGE_KEY = 'sf_global_cloud_registry';

export const cloudService = {
  // Mengirim data pendaftaran ke "Cloud Hub"
  pushRegistration: async (reg: RegistrationRequest): Promise<boolean> => {
    try {
      // Simulasi Latensi Jaringan
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentCloudData = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
      
      // Cek apakah email sudah terdaftar di antrian
      if (currentCloudData.some((r: RegistrationRequest) => r.email === reg.email)) {
        throw new Error("Email ini sudah dalam antrian pendaftaran.");
      }

      const updatedData = [reg, ...currentCloudData];
      localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(updatedData));
      
      // Trigger Broadcast ke tab lain
      const channel = new BroadcastChannel('sf_cloud_sync');
      channel.postMessage({ type: 'NEW_REGISTRATION', payload: reg });
      
      return true;
    } catch (e: any) {
      console.error("Cloud Push Failed", e);
      alert(e.message || "Gagal mengirim data.");
      return false;
    }
  },

  // Menarik semua data pendaftaran
  pullRegistrations: async (): Promise<RegistrationRequest[]> => {
    try {
      const data = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
      return data;
    } catch (e) {
      return [];
    }
  },

  // Mengubah status dan memicu pembuatan akun
  updateRegistrationStatus: async (id: string, status: 'approved' | 'rejected'): Promise<void> => {
    const data = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
    const updated = data.map((r: RegistrationRequest) => r.id === id ? { ...r, status } : r);
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(updated));
    
    const channel = new BroadcastChannel('sf_cloud_sync');
    channel.postMessage({ type: 'STATUS_UPDATE', payload: { id, status } });
  }
};
