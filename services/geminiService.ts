
import { GoogleGenAI, Type } from "@google/genai";
import { PostInsight } from "../types";

/**
 * Fungsi pembantu untuk inisialisasi AI secara dinamis.
 * Ini mencegah error jika process.env.API_KEY belum tersedia saat modul pertama kali di-load.
 */
function getAIClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY tidak ditemukan di environment. Pastikan sudah diset di Cloudflare Dashboard.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function scrapePostInsights(url: string): Promise<PostInsight> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analisis URL media sosial berikut dan simulasikan pengambilan data wawasannya secara mendalam. 
    PENTING: Berikan analisis dalam bahasa Indonesia yang sangat profesional dan teknis.
    URL: ${url}. 
    Berikan data performa (likes, comments, shares) yang realistis berdasarkan jenis platform dari URL tersebut.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          url: { type: Type.STRING },
          platform: { type: Type.STRING },
          likes: { type: Type.NUMBER },
          comments: { type: Type.NUMBER },
          shares: { type: Type.NUMBER },
          engagementRate: { type: Type.NUMBER },
          sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
          analysis: { type: Type.STRING, description: 'Satu paragraf singkat analisis tren performa dalam Bahasa Indonesia.' },
        },
        required: ["url", "platform", "likes", "comments", "shares", "engagementRate", "sentiment", "analysis"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Gagal mendapatkan respon dari AI.");
  return JSON.parse(text);
}

export async function generateKPIReport(data: any): Promise<string> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Berdasarkan kumpulan data performa ini: ${JSON.stringify(data)}, buatkan laporan ringkasan eksekutif (Executive Summary) profesional untuk KPI media sosial dalam Bahasa Indonesia. 
    Laporan harus berisi:
    1. Ringkasan Performa Saat Ini.
    2. Identifikasi Kekuatan dan Kelemahan konten.
    3. 3 Rekomendasi strategis yang dapat langsung dieksekusi tim kreatif.`,
  });

  return response.text || "Gagal menghasilkan laporan.";
}
