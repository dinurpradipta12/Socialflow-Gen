
import { RegistrationRequest } from '../types';

/**
 * SOCIALFLOW CLOUD BRIDGE (Simulator)
 * Di lingkungan produksi nyata, fungsi-fungsi ini akan memanggil endpoint API backend
 * seperti Supabase, Firebase, atau REST API kustom.
 */

const CLOUD_STORAGE_KEY = 'sf_global_cloud_registry';

export const cloudService = {
  // Mengirim data pendaftaran ke "Cloud Hub"
  pushRegistration: async (reg: RegistrationRequest): Promise<boolean> => {
    try {
      // Simulasi Latensi Jaringan
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentCloudData = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
      const updatedData = [reg, ...currentCloudData];
      
      // Menggunakan localStorage sebagai simulasi DB Global yang bisa diakses perangkat lain 
      // (Dalam demo ini kita gunakan storage yang sama, di real app ini akan ke server)
      localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(updatedData));
      
      // Trigger Broadcast ke tab lain di browser yang sama (Real-time update)
      const channel = new BroadcastChannel('sf_cloud_sync');
      channel.postMessage({ type: 'NEW_REGISTRATION', payload: reg });
      
      return true;
    } catch (e) {
      console.error("Cloud Push Failed", e);
      return false;
    }
  },

  // Menarik semua data pendaftaran dari "Cloud Hub"
  pullRegistrations: async (): Promise<RegistrationRequest[]> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const data = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
      return data;
    } catch (e) {
      return [];
    }
  },

  // Menghapus atau mengupdate status di Cloud
  updateRegistrationStatus: async (id: string, status: 'approved' | 'rejected'): Promise<void> => {
    const data = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
    const updated = data.map((r: any) => r.id === id ? { ...r, status } : r);
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(updated));
    
    const channel = new BroadcastChannel('sf_cloud_sync');
    channel.postMessage({ type: 'STATUS_UPDATE', payload: { id, status } });
  }
};
