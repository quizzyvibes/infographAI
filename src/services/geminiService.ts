
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Topic, AspectRatio, InfographicFormat, ImageResolution, QrConfig, QrPosition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASH_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview'; 
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// --- API FUNCTIONS ---

export const fetchCategories = async (subject: string, level: string): Promise<string[]> => {
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `List 12 sub-categories for "${subject}" (${level} level).`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(res.text || "[]");
  } catch (e) { return ["General", "History", "Concepts"]; }
};

export const fetchTopics = async (subject: string, level: string, category: string, count: number = 6): Promise<Topic[]> => {
  try {
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Generate ${count} infographic topics for "${category}" in "${subject}" (${level}).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { title: {type: Type.STRING}, description: {type: Type.STRING} },
            required: ["title", "description"]
          }
        }
      }
    });
    const data = JSON.parse(res.text || "[]");
    return data.map((t: any, i: number) => ({ id: `${Date.now()}-${i}`, ...t }));
  } catch (e) { throw new Error("Failed to get topics."); }
};

export const fetchSingleTopic = async (subject: string, level: string, category: string, existingTitles: string[]): Promise<Topic> => {
  try {
     const prompt = `Generate 1 infographic topic for "${category}" in "${subject}" (${level}). Must be different from: ${existingTitles.join(", ")}.`;
     const res = await ai.models.generateContent({
       model: FLASH_MODEL,
       contents: prompt,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
            type: Type.OBJECT,
            properties: { title: {type: Type.STRING}, description: {type: Type.STRING} },
            required: ["title", "description"]
         }
       }
     });
     const t = JSON.parse(res.text || "{}");
     return { id: `${Date.now()}`, ...t };
  } catch(e) { throw new Error("Failed to fetch topic"); }
};

export const generateInfographicImage = async (
  topic: Topic, subject: string, level: string, aspectRatio: AspectRatio, format: InfographicFormat, resolution: ImageResolution, qrConfig?: QrConfig
): Promise<{ base64Image: string, refinedPrompt: string }> => {
  
  // 1. Generate Prompt
  let ratioLabel = "Square";
  if (aspectRatio === AspectRatio.PORTRAIT) ratioLabel = "Portrait";
  else if (aspectRatio === AspectRatio.WIDE) ratioLabel = "Wide";

  const systemInstruction = `
    You are an expert Art Director. Create a prompt for Gemini Image Model.
    Topic: ${topic.title}
    Audience: ${level}
    Format: ${format}
    Constraint: If QR Code is enabled (${qrConfig?.enabled}), explicitly reserve a whitespace box in the ${qrConfig?.position || 'bottom-right'} corner.
    Constraint: Wide safety margins. High contrast. Educational style.
  `;

  const promptRes = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Write a detailed image generation prompt for a ${ratioLabel} infographic about ${topic.title}.`,
    config: { systemInstruction }
  });
  const refinedPrompt = promptRes.text || topic.title;

  // 2. Generate Image
  let apiRatio = "1:1";
  if (aspectRatio === AspectRatio.PORTRAIT) apiRatio = "3:4";
  if (aspectRatio === AspectRatio.LANDSCAPE) apiRatio = "4:3";
  if (aspectRatio === AspectRatio.TALL) apiRatio = "9:16";
  if (aspectRatio === AspectRatio.WIDE) apiRatio = "16:9";

  const imgRes = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: refinedPrompt,
    config: { imageConfig: { aspectRatio: apiRatio, imageSize: resolution } }
  });

  let base64Image = "";
  for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!base64Image) throw new Error("No image generated.");

  // 3. QR Merge
  if (qrConfig && qrConfig.enabled) {
    base64Image = await mergeQrCode(base64Image, qrConfig);
  }

  return { base64Image, refinedPrompt };
};

export const generateArticle = async (topic: Topic, subject: string, level: string) => {
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Write a 200-word summary and 500-word article about ${topic.title} for ${level}. Return strictly valid JSON: { "summary": "...", "article": "..." }.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(res.text || "{}");
};

export const generatePodcast = async (topic: Topic, subject: string, level: string) => {
  // 1. Script
  const scriptRes = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Write a short 2-person dialogue about ${topic.title} for ${level} students. Format: "Host: ... Expert: ..."`
  });
  const script = scriptRes.text || "";

  // 2. Audio
  const ttsRes = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Host', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            { speaker: 'Expert', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } }
          ]
        }
      }
    }
  });

  const base64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("Audio generation failed");
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], {type: 'audio/pcm'}); 
  const url = URL.createObjectURL(blob); 

  return { audioUrl: url, script };
};

// --- CLIENT SIDE QR (Uses Public API to avoid build issues) ---
async function mergeQrCode(base64Img: string, config: QrConfig): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Generate QR via API
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(config.url)}&bgcolor=ffffff`;
        const qrResponse = await fetch(qrUrl);
        const qrBlob = await qrResponse.blob();
        const qrBase64 = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(qrBlob);
        });

        const qrImg = new Image();
        qrImg.crossOrigin = "Anonymous";
        
        await new Promise((r) => { 
            qrImg.onload = r;
            qrImg.onerror = () => { console.error("QR API failed"); r(null); }; 
            qrImg.src = qrBase64;
        });

        // Draw Logic
        const size = Math.round(img.width * 0.15);
        const margin = Math.round(img.width * 0.03);
        let x = img.width - size - margin;
        let y = img.height - size - margin;
        
        if (config.position.includes("Left")) x = margin;
        if (config.position.includes("Top")) y = margin;

        ctx.fillStyle = "white";
        ctx.fillRect(x, y, size, size);
        
        // Only draw if loaded successfully
        if (qrImg.complete && qrImg.naturalHeight !== 0) {
            ctx.drawImage(qrImg, x + 5, y + 5, size - 10, size - 10);
        }

        // Footnote
        if (config.footnote) {
             ctx.fillStyle = "black";
             ctx.font = `bold ${Math.round(size/10)}px Arial`; 
             ctx.textAlign = "center";
             ctx.fillText(config.footnote, x + size/2, y + size - 5);
        }

      } catch (e) { console.error("QR Merge Error", e); }

      resolve(canvas.toDataURL());
    };
    img.src = base64Img;
  });
}





















