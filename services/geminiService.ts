
import { GoogleGenAI, Modality } from '@google/genai';

export const speak = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API_KEY is missing. Check your environment configuration.");
    throw new Error("API ключ не настроен. Голосовой помощник временно недоступен.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Говори четко и энергично: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("Не удалось получить аудиоданные от API.");
    }
    
    return base64Audio;
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    const message = error.message || "Ошибка голосового синтеза";
    throw new Error(`Голосовой помощник: ${message}`);
  }
};
