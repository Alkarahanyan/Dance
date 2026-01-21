
import { GoogleGenAI, Modality } from '@google/genai';

// Безопасное получение ключа
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const speak = async (text: string): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. TTS will not work.");
    throw new Error("API Key missing");
  }

  try {
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
      throw new Error("No audio data received from API.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate speech from Gemini API.");
  }
};
