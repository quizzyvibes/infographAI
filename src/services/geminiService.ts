import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Topic, AspectRatio, InfographicFormat, ImageResolution, QrConfig, QrPosition } from "../types";

// Initialize Gemini Client
const getAiClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY is missing. Please set it in your .env file.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const FLASH_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview'; 
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Helper to strip Markdown code blocks if present
const cleanJson = (text: string): string => {
  if (!text) return "";
  // aggressive cleaning
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  // Ensure we just get the array or object
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');
  
  // If we are looking for an array (categories, topics)
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
     const lastBracket = cleaned.lastIndexOf(']');
     if (lastBracket !== -1) cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1) {
     const lastBrace = cleaned.lastIndexOf('}');
     if (lastBrace !== -1) cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
};

/**
 * Generates a list of categories based on Subject and Level using Gemini Flash.
 */
export const fetchCategories = async (subject: string, level: string): Promise<string[]> => {
  const ai = getAiClient();
  const prompt = `Generate a list of 12 distinct and diverse sub-categories for the subject "${subject}" that are appropriate for a "${level}" audience level. 
  Return ONLY a raw JSON array of strings (e.g., ["Category 1", "Category 2"]). Do not include markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
        // Removing strict responseSchema to avoid 400 errors with Preview models
      }
    });

    const text = response.text;
    if (!text) return [];
    
    try {
      const parsed = JSON.parse(cleanJson(text));
      if (Array.isArray(parsed)) return parsed;
      // Handle object wrapper edge case
      if (parsed.categories && Array.isArray(parsed.categories)) return parsed.categories;
      return [];
    } catch (parseError) {
      console.warn("JSON parse failed for categories, raw text:", text);
      return text.split('\n').filter(line => line.includes('"')).map(line => line.replace(/[^a-zA-Z0-9 ]/g, '')).slice(0, 10);
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return empty to let the UI know, or defaults if critical
    return ["General", "Overview", "Key Concepts", "Advanced Topics"]; 
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
  For each topic, provide a short catchy 'title' and a 1-sentence 'description'.
  
  Return ONLY a raw JSON array of objects with 'title' and 'description' keys. Example: [{"title": "T", "description": "D"}]`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    try {
      const rawData = JSON.parse(cleanJson(text));
      let items = rawData;
      if (rawData.topics) items = rawData.topics;
      
      if (!Array.isArray(items)) throw new Error("AI did not return an array");

      // Add IDs
      return items.map((item: any, index: number) => ({
        id: `topic-${Date.now()}-${index}`,
        title: item.title,
        description: item.description
      }));
    } catch (parseError) {
      console.error("Failed to parse topics JSON:", text);
      throw new Error("Invalid JSON response from AI");
    }
  } catch (error: any) {
    console.error("Error fetching topics:", error);
    throw new Error(error.message || "Failed to generate topics.");
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
  Return ONLY a raw JSON object with 'title' and 'description'.`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    
    try {
      const item = JSON.parse(cleanJson(text));
      return {
        id: `topic-${Date.now()}`,
        title: item.title,
        description: item.description
      };
    } catch (parseError) {
      console.error("Failed to parse single topic JSON:", text);
      throw new Error("Invalid JSON response");
    }
  } catch (error) {
    console.error("Error fetching single topic:", error);
    throw new Error("Failed to generate topic.");
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

  // --- 1. DEFINE THE "GOLD STANDARD" TEMPLATE (Based on user's Phishing example) ---
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
  // Adjusted to be less aggressive about "white squares" and more about "negative space" to prevent layout breaking.
  let qrInstruction = "Ensure standard safety margins on all sides. No text or icons touching the extreme edges.";
  
  if (qrConfig && qrConfig.enabled) {
    const pos = qrConfig.position || QrPosition.BOTTOM_RIGHT;
    let locationText = "bottom-right corner";
    if (pos === QrPosition.BOTTOM_LEFT) locationText = "bottom-left corner";
    if (pos === QrPosition.TOP_RIGHT) locationText = "top-right corner";
    if (pos === QrPosition.TOP_LEFT) locationText = "top-left corner";
    
    qrInstruction = `
      LAYOUT ADJUSTMENT (QR CODE):
      The ${locationText} is strictly reserved for a code overlay.
      1. Ensure this specific corner is kept clear of text, titles, footers, or complex illustrations.
      2. Do NOT draw a white box or placeholder frame; simply allow the background color to extend into this area naturally (negative space).
      3. Maintain the overall balance of the infographic, but treat the ${locationText} as a no-content zone to prevent overlapping.
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
    Aspect Ratio to describe: ${aspectRatio}
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
    console.error("Error generating prompt:", e);
    refinedPrompt = `Create a flat vector educational infographic about ${topic.title} with wide margins, clean outlines, and a bottom quiz strip.`;
  }

  // Step 2: Generate the Image
  try {
    // Attempt generation with requested resolution
    let imageResponse;
    const generateConfig = {
      imageConfig: {
        aspectRatio: aspectRatio,
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
            config: { imageConfig: { aspectRatio: aspectRatio, imageSize: ImageResolution.RES_1K } }
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
    console.error("Error generating image:", error);
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
    1. Do NOT use **bold** for entire sentences.
    2. ONLY use **bold** for specific key terms (1-3 words max).
    3. MUST use Markdown Headers (###) to separate sections.
    4. Provide clear, professional educational content.
    5. **DO NOT USE LaTeX FORMATTING** (e.g., $$, \\frac, \\Delta). Use standard Unicode characters (e.g., Δ, ÷, π) and plain text for equations.
    
    STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:
    [SUMMARY]
    (Write a concise 200-word summary here)
    [ARTICLE]
    (Write a detailed 500-word article here. Use ### Headers for sections.)
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
    });
    
    const text = response.text || "";
    
    const summaryMatch = text.match(/\[SUMMARY\]([\s\S]*?)\[ARTICLE\]/i);
    const articleMatch = text.match(/\[ARTICLE\]([\s\S]*)/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : "Summary generation failed.";
    const article = articleMatch ? articleMatch[1].trim() : text;

    return { summary, article };
  } catch (e) {
    console.error("Error generating article", e);
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

  // Gemini 2.5 TTS with distinct voices
  const ttsResponse = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: `TTS the following conversation:\n${scriptText}` }] }],
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
