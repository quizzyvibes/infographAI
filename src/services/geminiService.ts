
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Topic, AspectRatio, InfographicFormat, ImageResolution, QrConfig, QrPosition } from "../types";

// Initialize Gemini Client
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASH_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview'; 
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

/**
 * Helper: Clean up common AI markdown artifacts
 */
const cleanAiText = (text: string) => {
  if (!text) return "";
  
  let clean = text;
  
  // 1. Remove ** wrapping entire lines/paragraphs (e.g. **Title**)
  // This regex matches lines that start/end with **, allowing for some whitespace
  clean = clean.replace(/^\s*\*\*(.*?)\*\*\s*$/gm, '$1');

  // 2. Remove "Sure, here is..." meta text if present at start
  clean = clean.replace(/^(Sure|Here|Certainly).*?:\n/i, '');

  return clean.trim();
};

/**
 * Helper to handle domain-related API errors
 */
const handleApiError = (error: any, action: string) => {
  console.error(`Error ${action}:`, error);
  const msg = error.message?.toLowerCase() || '';
  
  if (msg.includes('403') || msg.includes('permission denied')) {
    throw new Error(`Access Denied (403). Ensure 'infopic.app' is added to your Google Cloud API Key restrictions.`);
  }
  
  if (msg.includes('400') && msg.includes('key')) {
    throw new Error(`Invalid API Key. Check your environment variables.`);
  }

  throw error;
};

/**
 * Generates a list of categories based on Subject and Level using Gemini Flash.
 */
export const fetchCategories = async (subject: string, level: string): Promise<string[]> => {
  const ai = getAiClient();
  // Increased count from 12 to 20 to show more options
  const prompt = `Generate a list of 20 distinct and diverse sub-categories for the subject "${subject}" that are appropriate for a "${level}" audience level. Return ONLY a JSON array of strings.`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error: any) {
    // If it's a domain/key error, log it but fall back to defaults so the app doesn't crash entirely on load
    console.error("Error fetching categories:", error);
    if (error.message?.includes('403')) {
       console.warn("Domain restriction detected. Returning default categories.");
    }
    return ["General", "Overview", "Key Concepts", "Advanced Topics", "Case Studies", "Historical Context", "Future Trends", "Applications"]; 
  }
};

/**
 * Generates specific infographic topics based on user selection.
 */
export const fetchTopics = async (
  subject: string,
  level: string,
  category: string,
  count: number
): Promise<Topic[]> => {
  const ai = getAiClient();
  const prompt = `Generate ${count} engaging infographic topic ideas for the category "${category}" within the subject "${subject}", tailored for a "${level}" audience. 
  For each topic, provide a short catchy 'title' and a 1-sentence 'description' of what the infographic would visualize.`;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ["title", "description"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) return [];
    const rawData = JSON.parse(text);
    
    // Add IDs
    return rawData.map((item: any, index: number) => ({
      id: `topic-${Date.now()}-${index}`,
      title: item.title,
      description: item.description
    }));
  } catch (error) {
    handleApiError(error, "fetching topics");
    return []; // Should not reach here due to throw
  }
};

/**
 * Generates a single new topic, ensuring it's distinct from existing ones.
 */
export const fetchSingleTopic = async (
  subject: string,
  level: string,
  category: string,
  existingTitles: string[]
): Promise<Topic> => {
  const ai = getAiClient();
  const prompt = `Generate 1 engaging infographic topic idea for the category "${category}" within the subject "${subject}", tailored for a "${level}" audience.
  It MUST be different from these existing topics: ${existingTitles.join(", ")}.
  Provide a short catchy 'title' and a 1-sentence 'description' of what the infographic would visualize.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
    },
    required: ["title", "description"],
  };

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    const item = JSON.parse(text);

    return {
      id: `topic-${Date.now()}`,
      title: item.title,
      description: item.description
    };
  } catch (error) {
    handleApiError(error, "fetching single topic");
    throw error;
  }
};

/**
 * Helper: Maps user-selected aspect ratios (like A4) to API-supported ratios.
 */
const getApiAspectRatio = (ratio: AspectRatio): string => {
  switch (ratio) {
    case AspectRatio.A4_PORTRAIT:
    case AspectRatio.LETTER_PORTRAIT:
      return "3:4"; // Closest supported vertical ratio
    case AspectRatio.A4_LANDSCAPE:
    case AspectRatio.LETTER_LANDSCAPE:
      return "4:3"; // Closest supported horizontal ratio
    default:
      return ratio; // 1:1, 3:4, 4:3, 9:16, 16:9 are directly supported
  }
};

/**
 * Helper: Gets a descriptive label for the prompt to ensure the AI draws the correct layout style.
 */
const getLayoutDescription = (ratio: AspectRatio): string => {
  switch (ratio) {
    case AspectRatio.A4_PORTRAIT: return "A4 Portrait Print Layout";
    case AspectRatio.A4_LANDSCAPE: return "A4 Landscape Print Layout";
    case AspectRatio.LETTER_PORTRAIT: return "US Letter Portrait Print Layout";
    case AspectRatio.LETTER_LANDSCAPE: return "US Letter Landscape Print Layout";
    default: return ratio;
  }
};

/**
 * 1. Generates a "World Class" detailed prompt using Gemini Flash.
 * 2. Uses that prompt to generate an image using Nano Banana Pro (Gemini 3 Pro Image).
 */
export const generateInfographicImage = async (
  topic: Topic,
  subject: string,
  level: string,
  aspectRatio: AspectRatio,
  format: InfographicFormat = InfographicFormat.STANDARD,
  resolution: ImageResolution = ImageResolution.RES_1K,
  qrConfig?: QrConfig
): Promise<{ base64Image: string, refinedPrompt: string }> => {
  const ai = getAiClient();

  // Determine valid API ratio and descriptive layout text
  const apiAspectRatio = getApiAspectRatio(aspectRatio);
  const layoutDescription = getLayoutDescription(aspectRatio);

  // --- 1. DEFINE THE "GOLD STANDARD" TEMPLATE ---
  const GOLD_STANDARD_TEMPLATE = `
    TEMPLATE PROMPT STRUCTURE (Follow this density of detail):
    
    Create a one-page [ASPECT_RATIO] [STYLE] titled "[TITLE]" with a centered composition and wide safety margins on all sides (no text touching edges), clean modern classroom style, crisp outlines, minimal shading; 
    
    [CORE VISUAL BLOCK]
    Build a [MAIN VISUAL LAYOUT] shown as [DETAILED DESCRIPTION OF CENTRAL OBJECT] with numbered callouts (1–X) using thin leader lines pointing to specific parts.
    Include these callouts with short, accurate labels: 
    (1) [LABEL TEXT] ([Short explanation]), 
    (2) [LABEL TEXT] ([Short explanation]), 
    (3) [LABEL TEXT] ... [Continue for 5-8 callouts].
    
    [SECONDARY VISUAL BLOCK]
    Beneath/Beside the main visual, add a [FLOWCHART/DIAGRAM/COMPARISON] that teaches [CONCEPT]. 
    Use specific steps/branches: [Step 1] -> [Step 2] -> [Outcome A] / [Outcome B].
    
    [SIDEBAR BLOCKS]
    Include a small sidebar panel titled "[SIDEBAR TITLE]" with tiny icons and concise bullets: [List of items].
    Include a second sidebar titled "[SIDEBAR TITLE]" with checkboxes/icons: [List of items].
    
    [FOOTER]
    Ensure all text is spelled correctly, age-appropriate, and fact-checked. neat footer note: "[CATCHY FOOTER NOTE]".
  `;

  // --- 2. LAYOUT LOGIC ---
  let layoutInstruction = "";

  if (format === InfographicFormat.MINDMAP) {
    layoutInstruction = `
      LAYOUT: Central Concept Mindmap.
      - Center: Large, iconic illustration of "${topic.title}".
      - Branches: 6-8 distinct, colorful branches radiating outward.
      - Content: Each branch MUST have a specific label and a small icon.
    `;
  } else if (format === InfographicFormat.FLOWCHART) {
    layoutInstruction = `
      LAYOUT: Vertical Decision Flowchart.
      - Structure: Top-to-bottom decision tree.
      - Nodes: Clearly labeled boxes with questions (e.g., "Is X true?").
      - Branches: "Yes" and "No" arrows leading to different specific outcomes.
    `;
  } else {
    // STANDARD (The detailed style requested)
    layoutInstruction = `
      LAYOUT: Detailed Educational Poster with Callouts.
      - Central Hero: A large, detailed cross-section, diagram, or scene representing "${topic.title}".
      - Callouts: MUST include 5-8 numbered callouts pointing to specific details.
      - Bottom/Side Panels: 2 distinct mini-panels (e.g., "Quick Facts", "Checklist", or "Comparison").
    `;
  }

  // --- 3. QR CODE "FORBIDDEN ZONE" LOGIC ---
  let qrInstruction = "Ensure strictly wide safe margins on all sides. No text or icons touching the edges.";
  if (qrConfig && qrConfig.enabled) {
    const pos = qrConfig.position || QrPosition.BOTTOM_RIGHT;
    let locationText = "absolute bottom-right corner";
    if (pos === QrPosition.BOTTOM_LEFT) locationText = "absolute bottom-left corner";
    if (pos === QrPosition.TOP_RIGHT) locationText = "absolute top-right corner";
    if (pos === QrPosition.TOP_LEFT) locationText = "absolute top-left corner";
    
    qrInstruction = `
      CRITICAL LAYOUT CONSTRAINT: You MUST reserve the ${locationText} as a 'Forbidden Zone'. 
      1. Leave a 300px x 300px EMPTY white square in that specific corner.
      2. DO NOT place any text, panels, icons, or borders in this area.
    `;
  }

  // --- 4. MASTER PROMPT GENERATOR INSTRUCTION ---
  const systemInstruction = `
    You are an expert Art Director for educational infographics.
    Your task is to write a **single, extremely detailed image generation prompt** for Gemini 3 Pro Image.
    
    YOU MUST MIMIC THE DENSITY AND STRUCTURE OF THIS TEMPLATE:
    ${GOLD_STANDARD_TEMPLATE}

    RULES FOR THE PROMPT YOU WRITE:
    1.  **Style**: "Flat vector educational style", "clean rounded outlines", "simple geometric shapes", "bright classroom colors".
    2.  **Density**: Do not be vague. Invent specific text labels, specific numbered callouts, and specific sidebar content. 
    3.  **Safety**: "Wide safe margins on all sides", "No text touching edges".
    4.  **Content**: 
        - Instead of saying "add labels", say "add callout (1) Label Text...".
        - Instead of saying "add a chart", say "add a bar chart comparing X vs Y".
    5.  **QR Code**: ${qrInstruction}
    
    Target Audience: ${level}
    Aspect Ratio to describe: ${layoutDescription}
  `;

  const promptGenerationPrompt = `
    Write the image prompt for:
    Topic: ${topic.title}
    Description: ${topic.description}
    Subject: ${subject}
    Format: ${format}
    
    Apply these layout instructions:
    ${layoutInstruction}

    Output ONLY the raw prompt text.
  `;

  let refinedPrompt = "";
  try {
    const textResponse = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: promptGenerationPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Creativity balanced with adherence to structure
      }
    });
    refinedPrompt = textResponse.text || `${topic.title} educational poster, flat vector style, educational infographic`;
  } catch (e) {
    handleApiError(e, "generating prompt");
    refinedPrompt = `Create a flat vector educational infographic about ${topic.title} with wide margins, clean outlines, and a bottom quiz strip.`;
  }

  // Step 2: Generate the Image
  try {
    // Attempt generation with requested resolution and mapped aspect ratio
    let imageResponse;
    const generateConfig = {
      imageConfig: {
        aspectRatio: apiAspectRatio,
        imageSize: resolution 
      }
    };

    try {
        imageResponse = await ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: refinedPrompt,
          config: generateConfig
        });
    } catch (highResError) {
       // Fallback to 1K if 2K/4K fails (sometimes happens due to quota/model constraints)
       if (resolution !== ImageResolution.RES_1K) {
         console.warn(`Resolution ${resolution} failed, falling back to 1K.`);
         imageResponse = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: refinedPrompt,
            config: { imageConfig: { aspectRatio: apiAspectRatio, imageSize: ImageResolution.RES_1K } }
         });
       } else {
         throw highResError;
       }
    }

    let base64Image = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!base64Image) throw new Error("No image data returned");

    // Step 3: Overlay QR Code if enabled
    if (qrConfig && qrConfig.enabled) {
      base64Image = await mergeQrCodeWithImage(base64Image, qrConfig);
    }

    return {
      base64Image,
      refinedPrompt
    };
  } catch (error) {
    handleApiError(error, "generating image");
    throw error;
  }
};

/**
 * Generates an Article and Summary.
 */
export const generateArticle = async (
  topic: Topic, 
  subject: string, 
  level: string
): Promise<{ summary: string, article: string }> => {
  const ai = getAiClient();
  const prompt = `
    Write an educational summary and a comprehensive article about "${topic.title}" (${subject}), tailored for a ${level} audience.
    
    STRICT FORMATTING RULES:
    1. Use Standard Sentence Case. Do NOT use ALL CAPS.
    2. Do NOT use **bold** for entire sentences or paragraphs.
    3. ONLY use **bold** for specific key terms (1-3 words max).
    4. MUST use Markdown Headers (###) to separate sections.
    5. Provide clear, professional educational content.
    6. **DO NOT USE LaTeX FORMATTING** (e.g., $$, \\frac, \\Delta). Use standard Unicode characters (e.g., Δ, ÷, π) and plain text for equations.
    
    STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
    [SUMMARY]
    (Write a concise 200-word summary here. Normal casing.)
    [ARTICLE]
    (Write a detailed 500-word article here. Use ### Headers for sections. Normal casing.)
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
    });
    
    const text = response.text || "";
    
    const summaryMatch = text.match(/\[SUMMARY\]([\s\S]*?)\[ARTICLE\]/i);
    const articleMatch = text.match(/\[ARTICLE\]([\s\S]*)/i);

    // Apply cleaner to remove potential "Wall of Bold" or "ALL CAPS" markdown artifacts
    const summary = summaryMatch ? cleanAiText(summaryMatch[1].trim()) : "Summary generation failed.";
    const article = articleMatch ? cleanAiText(articleMatch[1].trim()) : cleanAiText(text);

    return { summary, article };
  } catch (e) {
    handleApiError(e, "generating article");
    throw e;
  }
};

/**
 * Generates a Podcast Audio (Blob URL) and its Script.
 */
export const generatePodcast = async (topic: Topic, subject: string, level: string): Promise<{ audioUrl: string, script: string }> => {
  const ai = getAiClient();
  
  let lengthInstruction = "Keep it under 1 minute spoken (approx 150 words).";
  let complexityInstruction = "Simple, clear language.";
  
  if (level.includes("High School") || level.includes("Undergraduate") || level.includes("Adult")) {
    lengthInstruction = "Make it a detailed 2-minute discussion (approx 300 words).";
    complexityInstruction = "Moderate complexity, explanatory.";
  } else if (level.includes("Graduate") || level.includes("Professional")) {
    lengthInstruction = "Make it a deep-dive 3-minute discussion (approx 450 words).";
    complexityInstruction = "High complexity, using technical terminology appropriate for experts.";
  }

  const scriptPrompt = `
    Write an engaging conversational podcast script between two hosts (Host and Expert) discussing "${topic.title}" for a ${level} audience.
    ${lengthInstruction}
    ${complexityInstruction}
    
    Format the output EXACTLY like this example:
    Host: Welcome back to the show.
    Expert: Thanks for having me.
    Host: Today we are talking about...
  `;
  
  const scriptResponse = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: scriptPrompt
  });
  const scriptText = scriptResponse.text || "";

  // CLEANUP: The LLM often adds **Host:**. The TTS model needs 'Host:' to match the config.
  // We strip markdown bolds (**) so proper labels like "Host:" remain without decoration.
  const ttsText = scriptText.replace(/\*\*/g, '');

  // Gemini 2.5 TTS with distinct voices
  try {
    const ttsResponse = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: ttsText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Host',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } 
              },
              {
                speaker: 'Expert',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
              }
            ]
          }
        }
      }
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const audioUrl = base64PcmToWavBlobUrl(base64Audio, 24000);
    
    return { audioUrl, script: scriptText };
  } catch (error) {
    handleApiError(error, "generating podcast");
    throw error;
  }
};

// --- QR CODE MERGING UTILITY ---

async function mergeQrCodeWithImage(base64Image: string, qrConfig: QrConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject("Canvas not supported");

    const img = new Image();
    img.onload = async () => {
      
      const finalWidth = img.width;
      const finalHeight = img.height;

      // 1. Setup Canvas
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      // 2. Draw Main Image
      ctx.drawImage(img, 0, 0);

      // 3. Draw QR Code
       try {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrConfig.url)}`;
          const qrResponse = await fetch(qrUrl);
          const qrBlob = await qrResponse.blob();
          const qrBase64 = await new Promise<string>((res) => {
             const reader = new FileReader();
             reader.onloadend = () => res(reader.result as string);
             reader.readAsDataURL(qrBlob);
          });
          
          const qrImg = new Image();
          qrImg.crossOrigin = "Anonymous";
          await new Promise((r) => { qrImg.onload = r; qrImg.src = qrBase64; });

          // Sizing: Match the 15% requested in the prompt
          const qrContainerSize = Math.round(img.width * 0.15); 
          // Margin: Just a touch off the edge (1%)
          const margin = Math.round(img.width * 0.01); 
          
          let x, y;
          const pos = qrConfig.position || QrPosition.BOTTOM_RIGHT;

          if (pos === QrPosition.BOTTOM_LEFT || pos === QrPosition.TOP_LEFT) {
             x = margin;
          } else {
             x = finalWidth - qrContainerSize - margin;
          }

          if (pos === QrPosition.TOP_LEFT || pos === QrPosition.TOP_RIGHT) {
             y = margin;
          } else {
             y = finalHeight - qrContainerSize - margin;
          }

          // Draw White Background to ensure readability if the AI missed a spot or for polish
          ctx.fillStyle = "#ffffff";
          // Simple squared edges to match the "hole"
          ctx.fillRect(x, y, qrContainerSize, qrContainerSize);
          
          // Draw QR centered in that box
          const padding = Math.round(qrContainerSize * 0.1);
          const qrDrawSize = qrContainerSize - (padding * 2);
          
          ctx.drawImage(qrImg, x + padding, y + padding, qrDrawSize, qrDrawSize);

          // Optional: Footnote
          if (qrConfig.footnote) {
             // Draw small text at bottom of white box
             ctx.fillStyle = "black";
             ctx.font = `bold ${Math.round(qrContainerSize/8)}px Arial`; 
             ctx.textAlign = "center";
             ctx.textBaseline = "bottom";
             ctx.fillText(qrConfig.footnote, x + (qrContainerSize/2), y + qrContainerSize - (padding/2));
          }

       } catch (e) {
          console.error("QR load failed", e);
       }

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = base64Image;
  });
}

function base64PcmToWavBlobUrl(base64: string, sampleRate: number = 24000): string {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = len;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, bytes[i]);
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}





























