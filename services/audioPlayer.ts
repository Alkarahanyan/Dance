
// This module encapsulates audio playback logic for raw PCM data.

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    // @ts-ignore
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        throw new Error("Browser does not support AudioContext");
    }
    audioContext = new AudioContext({ sampleRate: 24000 }); // Gemini TTS uses 24kHz sample rate
  }
  return audioContext;
};

// Decodes a base64 string into a Uint8Array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  // FIX: Corrected typo from dataInt116 to dataInt16.
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const play = async (base64Audio: string): Promise<void> => {
  try {
    const ctx = getAudioContext();
    // Resume context if it's suspended (e.g., due to browser autoplay policies)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const decodedBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

    return new Promise((resolve) => {
        source.onended = () => resolve();
    });

  } catch (error) {
    console.error("Error playing audio:", error);
    throw new Error("Could not play audio.");
  }
};
