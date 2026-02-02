
import { GoogleGenAI, Type } from "@google/genai";
import { PostInsight } from "../types";

function getAIClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY tidak ditemukan.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function scrapePostInsights(url: string): Promise<PostInsight> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analisis URL media sosial berikut secara mendalam: ${url}. Berikan data performa dalam JSON Indonesia profesional.`,
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
          analysis: { type: Type.STRING },
        },
        required: ["url", "platform", "likes", "comments", "shares", "engagementRate", "sentiment", "analysis"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function scrapeMonthlyContent(username: string, platform: string, month: string): Promise<PostInsight[]> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulasikan pengambilan 5-10 postingan terbaik untuk akun @${username} di ${platform} selama bulan ${month}. Berikan dalam format array JSON PostInsight.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING },
            platform: { type: Type.STRING },
            likes: { type: Type.NUMBER },
            comments: { type: Type.NUMBER },
            shares: { type: Type.NUMBER },
            engagementRate: { type: Type.NUMBER },
            sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
            analysis: { type: Type.STRING },
            postDate: { type: Type.STRING }
          },
          required: ["url", "platform", "likes", "comments", "shares", "engagementRate", "sentiment", "analysis", "postDate"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}
