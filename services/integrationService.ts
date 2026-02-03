
import { User, RegistrationRequest } from '../types';

export const integrationService = {
  /**
   * Mengkonversi data user menjadi format CSV dan memicu download browser.
   */
  exportUsersToCSV: (users: User[]) => {
    // Header CSV
    const headers = ['ID', 'Name', 'Email', 'Role', 'WhatsApp', 'Status', 'Activation Date', 'Expiry Date'];
    
    // Baris Data
    const rows = users.map(user => [
      user.id,
      `"${user.name}"`, // Quote name to handle commas
      user.email,
      user.role,
      user.whatsapp || '-',
      user.status || 'active',
      user.activationDate || '-',
      user.subscriptionExpiry || '-'
    ]);

    // Gabungkan Header dan Baris
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Buat Blob dan Link Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `socialflow_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Mengirim payload data ke URL Webhook eksternal (Zapier/Make/Custom Backend).
   */
  triggerWebhook: async (webhookUrl: string, data: any) => {
    if (!webhookUrl) throw new Error("URL Webhook tidak boleh kosong.");

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'Socialflow App',
          data: data
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook Error: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Webhook Failed:", error);
      throw error;
    }
  }
};
