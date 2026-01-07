
import { GoogleGenAI, Type, Schema, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Topic, AspectRatio, InfographicFormat, ImageResolution, QrConfig, QrPosition, SystemConfig } from "../types";
import { getSystemConfig } from "./dbService";

// Initialize Gemini Client
const getAiClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY is missing. Please set it in your .env file or hosting dashboard.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const FLASH_MODEL = 'gemini-3-flash-preview';
const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview'; 
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Default Master Template (Fallback if DB is empty)
// UPDATED: Now uses the strict "Reflow" and "Reservation" logic provided by the user.
const DEFAULT_MASTER_PROMPT = `
You are an expert Art Director and Expert Instructional Designer. Create a one-page infographic about {TOPIC} for {TARGET_AUDIENCE} that is world-class, visually stunning, and professionally art-directed, while also being genuinely comprehensive, information-rich, and instructionally complete; your core goal is a balanced 50/50 outcome: premium design polish and high-density, high-accuracy knowledge, with zero fluff and zero missing essentials.
________________________________________
Canvas & layout first
Apply the user’s chosen canvas format/aspect ratio and size the layout accordingly—({ASPECT_RATIO_LABEL})—then build a centered, grid-based composition with wide safe margins and a strict no-touch boundary (nothing—text, icons, arrows, leader lines, charts, labels, panels, visuals, legends—may touch, cross, or clip outside the canvas). Treat the safe margin as a hard crop boundary: all elements must sit fully inside it with breathing room.
________________________________________
Content requirements (must be comprehensive, not surface-level)
Include the most important knowledge a learner would reasonably expect on a complete one-page reference, adapted to the audience’s level; compress smartly instead of omitting essentials. Include:
•	Title + one-sentence thesis
•	Core definition(s) with key vocabulary highlighted
•	5–9 key concepts with real explanations (not vague phrases)
•	Mechanism/how it works (diagram/flow/steps)
•	Critical details & parameters (units/conditions/categories/parts/criteria as applicable)
•	≥3 examples + ≥1 counterexample
•	≥3 misconceptions/pitfalls + corrections
•	≥3 real-world applications
•	Quick Check (2–4 Qs + answers) or a tiny worked micro-example (math/physics)
•	Brief safety/ethics note when relevant
Accuracy mandate: fact-check and proofread all labels, units, terminology, symbols, spelling, and internal consistency.
________________________________________
Design requirements (premium, professional, flat-vector)
Strictly flat vector (no photorealism, no 3D, no heavy textures, no brand logos/watermarks), with clean geometric forms, consistent stroke hierarchy, cohesive corner radii, subtle depth only when needed, and perfect grid alignment. Use a premium typography scale (4–6 levels max) and structured microcopy. Use a curated palette (primary/secondary/accent + neutrals), consistent color-coding with legend when meaningful, and cohesive icons that clarify meaning. Ensure charts/diagrams are clean, honest, and instantly readable.
Format optimization: 9:16 = larger type + vertical story flow; 16:9 = wide compare strips; print = print-safe margins, crisp linework, readable at distance.
________________________________________
QR Placeholder Reservation (Enabled: {QR_ENABLED})
If the user enables a QR placeholder (Status: TRUE), you must reserve a single blank space for later QR insertion and do not generate any QR code, QR-like pattern, or “Scan me” text.

1) Single placeholder only (no duplicates)
•	Reserve exactly ONE QR placeholder area in the entire infographic.
•	Do not add any extra placeholder frames, phone mockups, decorative QR motifs, or repeated “Scan” callouts.

2) Size + orientation rules (fix portrait/landscape conflicts)
•	The placeholder must be sized to comfortably fit a QR code without forcing portrait-only dimensions:
o	If the overall infographic layout is portrait (e.g., US Letter Portrait, A4 Portrait, 3:4, 9:16): reserve 4 cm × 5 cm (Width × Height).
o	If the overall infographic layout is landscape (e.g., US Letter Landscape, A4 Landscape, 4:3, 16:9): reserve 5 cm × 4 cm (Width × Height).
•	These sizes are layout constraints only: do NOT print dimension labels, rulers, arrows, or “cm” text anywhere.

3) Background-matched fill (never pure white unless the background is white)
•	The placeholder area must use the exact same color (or background treatment) as the immediate background behind it.
•	If the background is a solid color, the placeholder fill must be that same solid color.
•	Do not make the placeholder a white box unless the infographic background is actually white/off-white in that region.

4) “Blank space” definition (blank of content, not blank of style)
•	The placeholder must contain no foreground content: no QR code, no caption, no icons, no text, no watermark.
•	However, it must not look like an awkward pasted box; it should look like an intentionally reserved empty region that blends into the background.

5) Optional boundary (only if needed for clarity, and must be subtle)
•	Prefer no border if the reserved space can be inferred from the composition.

6) Placement options + containment
•	Place the placeholder at this specific corner: {QR_POSITION}.
•	The placeholder must be fully inside the safe margins and must never clip outside the canvas.
•	Maintain consistent gutters to adjacent panels so the corner feels designed and balanced.

7) Layout reflow mandate (to avoid collisions)
•	If the selected corner ({QR_POSITION}) is crowded, reflow surrounding modules (shift, resize, or reorganize panels) rather than letting the placeholder overlap content or violate margins.
•	Ensure the overall composition remains visually centered and premium with the placeholder present.

8) Validation pass (mandatory)
Before final output, verify:
•	Placeholder count = 1 (if enabled)
•	Placeholder interior has no QR/code/text/caption/icons
•	Placeholder fully inside safe margins (no clipping/overflow)
________________________________________
Final balance rule (non-negotiable)
If space gets tight, do not delete essential knowledge; compress intelligently (microcopy, chips, merged points, reduced decoration) while preserving legibility, spacing, and clean hierarchy. Output must read like a complete one-page reference and look like premium editorial design.
`;

// Safety settings to reduce false positives for educational content (e.g. anatomy, history)
const DEFAULT_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// Helper to strip Markdown code blocks if present
const cleanJson = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
     const lastBracket = cleaned.lastIndexOf(']');
     if (lastBracket !== -1) cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1) {
     const lastBrace = cleaned.lastIndexOf('}');
     if (lastBrace !== -1) cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
};

// Helper to detect critical API errors
const checkApiError = (error: any) => {
  const msg = (error.message || error.toString()).toLowerCase();
  
  if (msg.includes("expired") || msg.includes("invalid argument") || msg.includes("key")) {
    throw new Error("API Key Invalid/Expired. Check Vercel Environment Variables.");
  }
  if (msg.includes("not found") || msg.includes("404")) {
     // Model not found usually means the key doesn't have access to Pro or the region is blocked
     return; 
  }
  if (msg.includes("429") || msg.includes("quota")) {
    throw new Error("API Quota exceeded. Please try again later.");
  }
  if (msg.includes("candidate") || msg.includes("safety")) {
     throw new Error("Safety filters blocked the generation. Try a different topic.");
  }
};

/**
 * Generates a list of categories based on Subject and Level using Gemini Flash.
 */
export const fetchCategories = async (subject: string, level: string): Promise<string[]> => {
  const ai = getAiClient();
  const prompt = `Generate a list of 12 distinct and diverse sub-categories for the subject "${subject}" that are appropriate for a "${level}" audience level. Return ONLY a raw JSON array of strings (e.g., ["Category 1", "Category 2"]). Do not include markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    
    try {
      const parsed = JSON.parse(cleanJson(text));
      if (Array.isArray(parsed)) return parsed;
      if (parsed.categories && Array.isArray(parsed.categories)) return parsed.categories;
      return [];
    } catch (parseError) {
      console.warn("JSON parse failed for categories, raw text:", text);
      return text.split('\n').filter(line => line.includes('"')).map(line => line.replace(/[^a-zA-Z0-9 ]/g, '')).slice(0, 10);
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    checkApiError(error);
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
    checkApiError(error);
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
    checkApiError(error);
    console.error("Error fetching single topic:", error);
    throw new Error("Failed to generate topic.");
  }
};

/**
 * 1. Generates a "World Class" detailed prompt using Gemini Flash using the Master Template.
 * 2. Uses that prompt to generate an image using Gemini Image Models.
 * 3. MERGES a real, functional QR code onto the image using Client-Side canvas.
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

  // --- FETCH DYNAMIC CONFIG ---
  let dbConfig: SystemConfig | null = null;
  try {
    dbConfig = await getSystemConfig();
  } catch(e) { console.warn("Could not fetch DB config, using defaults"); }

  if (dbConfig?.maintenanceMode) {
    throw new Error("System is currently in maintenance mode. Please try again later.");
  }

  const activeMasterPrompt = dbConfig?.systemPrompt || DEFAULT_MASTER_PROMPT;
  const activeTemperature = dbConfig?.temperature ?? 0.7;
  const activeImageModel = dbConfig?.imageModel || DEFAULT_IMAGE_MODEL;
  
  let activeSafetySettings = DEFAULT_SAFETY_SETTINGS;
  if (dbConfig?.safetyThreshold) {
      const t = dbConfig.safetyThreshold as any; 
      activeSafetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: t },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: t },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: t },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: t },
      ];
  }

  // --- 0. RESOLVE ASPECT RATIO ---
  let apiAspectRatio = "1:1";
  switch (aspectRatio) {
    case AspectRatio.SQUARE: apiAspectRatio = "1:1"; break;
    case AspectRatio.PORTRAIT: apiAspectRatio = "3:4"; break;
    case AspectRatio.LANDSCAPE: apiAspectRatio = "4:3"; break;
    case AspectRatio.TALL: apiAspectRatio = "9:16"; break;
    case AspectRatio.WIDE: apiAspectRatio = "16:9"; break;
    // Print Mappings
    case AspectRatio.US_LETTER_PORTRAIT: apiAspectRatio = "3:4"; break;
    case AspectRatio.US_LETTER_LANDSCAPE: apiAspectRatio = "4:3"; break;
    case AspectRatio.A4_PORTRAIT: apiAspectRatio = "3:4"; break;
    case AspectRatio.A4_LANDSCAPE: apiAspectRatio = "4:3"; break;
    default: apiAspectRatio = "1:1";
  }

  const aspectRatioMap: Record<AspectRatio, string> = {
    [AspectRatio.SQUARE]: "Square (1:1)",
    [AspectRatio.US_LETTER_PORTRAIT]: "US Letter Portrait (Print)",
    [AspectRatio.US_LETTER_LANDSCAPE]: "US Letter Landscape (Print)",
    [AspectRatio.A4_PORTRAIT]: "A4 Portrait (Print)",
    [AspectRatio.A4_LANDSCAPE]: "A4 Landscape (Print)",
    [AspectRatio.PORTRAIT]: "Portrait (3:4)",
    [AspectRatio.LANDSCAPE]: "Landscape (4:3)",
    [AspectRatio.TALL]: "Mobile / Story (9:16)",
    [AspectRatio.WIDE]: "Presentation (16:9)"
  };
  const selectedRatioText = aspectRatioMap[aspectRatio] || "Square (1:1)";

  // --- 1. CONFIGURATION OVERRIDES ---
  
  let formatInstruction = "";
  if (format === InfographicFormat.MINDMAP) {
    formatInstruction = `LAYOUT OVERRIDE: Central Concept Mindmap. Center large icon of "${topic.title}", 6-8 distinct branches.`;
  } else if (format === InfographicFormat.FLOWCHART) {
    formatInstruction = `LAYOUT OVERRIDE: Vertical Decision Flowchart. Top-to-bottom decision tree with labeled boxes.`;
  }

  // PREPARE PLACEHOLDERS FOR MASTER TEMPLATE
  // IMPORTANT: We do NOT send the URL to the AI. We only tell it WHERE to leave space.
  const qrEnabled = (qrConfig && qrConfig.enabled) ? "TRUE" : "FALSE";
  const qrPosition = (qrConfig && qrConfig.enabled && qrConfig.position) ? qrConfig.position : "Bottom Right";

  // INJECT PLACEHOLDERS INTO MASTER TEMPLATE
  // We handle {QR_URL} by intentionally not giving it to the AI to "draw", avoiding hallucination.
  let systemInstruction = activeMasterPrompt
      .replace('{TOPIC}', topic.title)
      .replace('{TARGET_AUDIENCE}', level)
      .replace('{QR_ENABLED}', qrEnabled)
      .replace('{QR_POSITION}', qrPosition)
      .replace('{ASPECT_RATIO_LABEL}', selectedRatioText);
      
  // Append Task Config
  systemInstruction += `\n\nTASK CONFIG:\nSelected Aspect Ratio: ${selectedRatioText}\n${formatInstruction}`;

  // --- 2. PROMPT GENERATOR EXECUTION ---
  const promptGenerationPrompt = `
    TASK: Write the final image generation prompt based on the System Instructions.
    
    Topic: ${topic.title}
    Description: ${topic.description}
    Subject: ${subject}
    Format: ${format}
    
    Output ONLY the raw prompt text.
  `;

  let refinedPrompt = "";
  try {
    const textResponse = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: promptGenerationPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: activeTemperature,
      }
    });
    refinedPrompt = textResponse.text || `${topic.title} educational poster, flat vector style`;
  } catch (e) {
    checkApiError(e);
    console.error("Error generating prompt:", e);
    refinedPrompt = `Create a flat vector educational infographic about ${topic.title}.`;
  }

  // Step 3: Generate the Image
  try {
    const generateConfig = {
      imageConfig: {
        aspectRatio: apiAspectRatio,
        imageSize: resolution 
      },
      safetySettings: activeSafetySettings
    };

    let imageResponse;
    try {
        imageResponse = await ai.models.generateContent({
          model: activeImageModel,
          contents: refinedPrompt,
          config: generateConfig
        });
    } catch (apiError: any) {
       checkApiError(apiError);
       
       if (resolution !== ImageResolution.RES_1K) {
         console.warn(`Resolution ${resolution} failed, falling back to 1K on Pro model.`);
         imageResponse = await ai.models.generateContent({
            model: activeImageModel,
            contents: refinedPrompt,
            config: { 
              imageConfig: { aspectRatio: apiAspectRatio, imageSize: ImageResolution.RES_1K },
              safetySettings: activeSafetySettings
            }
         });
       } else {
         throw apiError;
       }
    }

    let base64Image = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!base64Image) {
       if (imageResponse.candidates?.[0]?.finishReason) {
         throw new Error(`Generation blocked by safety filters (${imageResponse.candidates[0].finishReason}). Try a different topic.`);
       }
       throw new Error("No image data returned from API.");
    }

    // --- STEP 4: FUNCTIONAL QR CODE OVERLAY (CLIENT SIDE) ---
    // The AI reserved the space. Now we generate the REAL code and stamp it.
    if (qrConfig && qrConfig.enabled) {
      base64Image = await mergeQrCodeWithImage(base64Image, qrConfig);
    }

    return {
      base64Image,
      refinedPrompt
    };
  } catch (error: any) {
    checkApiError(error);
    
    const msg = (error.message || '').toLowerCase();
    if (msg.includes("404") || msg.includes("not found")) {
      throw new Error(`Model '${activeImageModel}' not found.`);
    }

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
    checkApiError(e);
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
  
  let scriptText = "";
  try {
    const scriptResponse = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: scriptPrompt
    });
    scriptText = scriptResponse.text || "";
  } catch(e) {
    checkApiError(e);
    throw e;
  }

  // Gemini 2.5 TTS with distinct voices
  try {
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
  } catch (e) {
    checkApiError(e);
    throw e;
  }
};

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
      const isPortrait = finalHeight > finalWidth;

      // 1. Setup Canvas
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      // 2. Draw Main Image
      ctx.drawImage(img, 0, 0);

      // 3. Draw QR Code
       try {
          // Use QR Server API for functional code generation
          // Note: In production, consider a local QR library to avoid external dependencies, but this is fine for now.
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrConfig.url)}`;
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

          // Sizing Logic: Exactly 3cm x 4cm (3:4 ratio card container)
          // We map this to a percentage of the canvas.
          
          let qrContainerWidth, qrContainerHeight;

          if (isPortrait) {
              qrContainerWidth = Math.round(finalWidth * 0.15); 
          } else {
              qrContainerWidth = Math.round(finalWidth * 0.11); 
          }
          
          // Force 3:4 aspect ratio (3cm width, 4cm height) for the container card
          qrContainerHeight = Math.round(qrContainerWidth / 0.75); 
          
          // Margin: 4% to match "Wide Safe Margins"
          const margin = Math.round(Math.min(finalWidth, finalHeight) * 0.04); 
          
          let x, y;
          const pos = qrConfig.position || QrPosition.BOTTOM_RIGHT;

          if (pos === QrPosition.BOTTOM_LEFT || pos === QrPosition.TOP_LEFT) {
             x = margin;
          } else {
             x = finalWidth - qrContainerWidth - margin;
          }

          if (pos === QrPosition.TOP_LEFT || pos === QrPosition.TOP_RIGHT) {
             y = margin;
          } else {
             y = finalHeight - qrContainerHeight - margin;
          }

          // Draw OPAQUE White Background Card with Rounded Corners
          // This ensures the QR is scannable even if the AI put something dark there.
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          
          const radius = Math.round(qrContainerWidth * 0.08);
          
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + qrContainerWidth - radius, y);
          ctx.quadraticCurveTo(x + qrContainerWidth, y, x + qrContainerWidth, y + radius);
          ctx.lineTo(x + qrContainerWidth, y + qrContainerHeight - radius);
          ctx.quadraticCurveTo(x + qrContainerWidth, y + qrContainerHeight, x + qrContainerWidth - radius, y + qrContainerHeight);
          ctx.lineTo(x + radius, y + qrContainerHeight);
          ctx.quadraticCurveTo(x, y + qrContainerHeight, x, y + qrContainerHeight - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
          
          // Reset shadow for inner elements
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
          
          // Padding inside the card
          const padding = Math.round(qrContainerWidth * 0.08);

          // Calculate space for text and QR
          // Text size proportional to container width
          const fontSize = qrConfig.footnote ? Math.round(qrContainerWidth * 0.12) : 0;
          const textHeight = qrConfig.footnote ? (fontSize + padding) : 0;
          
          // Available height for QR code
          const availableHeightForQr = qrContainerHeight - (padding * 2) - textHeight;
          const availableWidthForQr = qrContainerWidth - (padding * 2);
          
          // Use the smaller dimension to keep QR square
          const qrDrawSize = Math.min(availableWidthForQr, availableHeightForQr);
          
          // Center QR in the available space above text
          const qrX = x + (qrContainerWidth - qrDrawSize) / 2;
          const qrY = y + padding;

          ctx.drawImage(qrImg, qrX, qrY, qrDrawSize, qrDrawSize);

          // Draw Text
          if (qrConfig.footnote) {
             ctx.fillStyle = "#000000";
             // Use sans-serif, bold
             ctx.font = `bold ${fontSize}px sans-serif`; 
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             const textY = y + qrContainerHeight - padding - (fontSize / 2);
             ctx.fillText(qrConfig.footnote, x + (qrContainerWidth/2), textY);
          }

       } catch (e) {
          console.error("QR load failed", e);
       }

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = base64Image;
  });
}



















