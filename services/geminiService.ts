
import { GoogleGenAI, Modality } from '@google/genai';

// Initialize the GoogleGenAI client with the API key from environment variables.
// Use process.env.API_KEY directly as per the coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const speak = async (text: string): Promise<string> => {
  try {
    // Generate audio content using the Gemini TTS model.
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
