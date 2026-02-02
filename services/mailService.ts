
import emailjs from '@emailjs/browser';
import { User } from '../types';

/**
 * KONFIGURASI EMAILJS
 * Kredensial telah dikonfigurasi untuk environment produksi.
 * Panduan: https://www.emailjs.com/docs/tutorial/creating-contact-form/
 */
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_h5nz1rd',
  TEMPLATE_ID: 'template_5vn5dz8',
  PUBLIC_KEY: 'mxIScUuzV_90GSWnC'
};

export const mailService = {
  /**
   * Mengirim kredensial login ke email user secara real-time via EmailJS Server.
   */
  sendCredentials: async (user: User): Promise<boolean> => {
    // Cek keamanan konfigurasi
    if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      console.warn("EmailJS belum dikonfigurasi dengan benar. Menggunakan mode simulasi.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }

    try {
      const templateParams = {
        to_name: user.name,
        to_email: user.email,
        password: user.password || 'Social123',
        login_url: window.location.origin, // URL aplikasi saat ini
        activation_date: user.activationDate,
        expiry_date: user.subscriptionExpiry
      };

      console.log(`Attempting to send email to ${user.email}...`);

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log(`Email sent successfully to ${user.email}`);
      return true;
    } catch (error) {
      console.error("EmailJS Error:", error);
      // Melempar error agar bisa ditangkap oleh UI untuk menampilkan notifikasi gagal
      throw new Error("Gagal mengirim email. Periksa kuota EmailJS atau koneksi internet.");
    }
  }
};
