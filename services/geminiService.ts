
import { GoogleGenAI, Type } from "@google/genai";
import { PostInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function scrapePostInsights(url: string): Promise<PostInsight> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analisis URL media sosial berikut dan simulasikan pengambilan data wawasannya. 
    PENTING: Berikan analisis dalam bahasa Indonesia yang profesional.
    URL: ${url}. 
    Berikan data performa yang realistis namun simulasi.`,
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

  return JSON.parse(response.text);
}

export async function generateKPIReport(data: any): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Berdasarkan data ini: ${JSON.stringify(data)}, buatkan laporan ringkasan eksekutif profesional untuk KPI media sosial dalam Bahasa Indonesia. Sertakan kekuatan, kelemahan, dan 3 rekomendasi yang dapat ditindaklanjuti.`,
  });

  return response.text;
}
