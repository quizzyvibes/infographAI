
import { GoogleGenAI, Type, Schema, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Topic, AspectRatio, InfographicFormat, ImageResolution, QrConfig, QrPosition } from "../types";

// Initialize Gemini Client
const getAiClient = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY is missing. Please set it in your .env file or hosting dashboard.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const FLASH_MODEL = 'gemini-3-flash-preview';
// We use Gemini 3 Pro Image for ALL resolutions to ensure high fidelity text rendering
const IMAGE_MODEL = 'gemini-3-pro-image-preview'; 
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Safety settings to reduce false positives for educational content (e.g. anatomy, history)
const SAFETY_SETTINGS = [
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

  // --- 0. RESOLVE ASPECT RATIO & API CONFIG ---
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

  // Get readable label for the Prompt Template
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
  
  // Format Override
  let formatInstruction = "";
  if (format === InfographicFormat.MINDMAP) {
    formatInstruction = `
      LAYOUT OVERRIDE: Central Concept Mindmap.
      - Center: Large, iconic illustration of "${topic.title}".
      - Branches: 6-8 distinct, colorful branches radiating outward.
      - Content: Each branch MUST have a specific label and a small icon.
    `;
  } else if (format === InfographicFormat.FLOWCHART) {
    formatInstruction = `
      LAYOUT OVERRIDE: Vertical Decision Flowchart.
      - Structure: Top-to-bottom decision tree or process flow.
      - Nodes: Clearly labeled boxes with steps/questions.
      - Branches: Arrows leading to different specific outcomes.
    `;
  }

  // QR State Context (Explicitly tell AI about the user's choice)
  let qrStateInfo = "QR Code Status: DISABLED by user. Do not reserve corner space.";
  if (qrConfig && qrConfig.enabled) {
     qrStateInfo = `QR Code Status: ENABLED by user.
     - Position: ${qrConfig.position || 'Bottom Right'}
     - Caption: "${qrConfig.footnote || 'Scan Me'}"
     - TASK: Please design the 'Integrated Corner Card' background in this specific corner as requested in the master template.`;
  }

  // --- 2. MASTER TEMPLATE INJECTION ---
  const MASTER_PROMPT_TEMPLATE = `
You are an expert Art Director and Expert Instructional Designer. Create a one-page infographic about {TOPIC} for {TARGET_AUDIENCE} that is world-class, visually stunning, and professionally art-directed, while also being genuinely comprehensive, information-rich, and instructionally complete; your core goal is a balanced 50/50 outcome: premium design polish and high-density, high-accuracy knowledge, with zero fluff and zero missing essentials; first apply the user’s chosen canvas format/aspect ratio and size the layout accordingly—Square (1:1), US Letter Portrait (Print), US Letter Landscape (Print), A4 Portrait (Print), A4 Landscape (Print), Portrait (3:4), Landscape (4:3), Mobile / Story (9:16), Presentation (16:9)—then build a centered, grid-based composition with wide safe margins and a strict no-touch boundary (nothing—text, icons, arrows, leader lines, charts, labels, panels, visuals, legends—may touch or crowd the edges); Content requirements (must be comprehensive and detailed, not surface-level): include the most important knowledge a learner would reasonably expect on a “complete” one-page reference, adapted to the audience’s level; do not under-explain—compress information smartly instead of omitting it; include Title + one-sentence thesis, core definition(s), 5–9 key concepts with real explanations, mechanism/how it works (diagram/flow/steps), critical details & parameters (units/conditions/categories/parts/criteria), ≥3 examples + ≥1 counterexample, ≥3 misconceptions/pitfalls with corrections, ≥3 real-world applications, and a compact Quick Check (2–4 Qs + answers) or a tiny worked micro-example where relevant; add a brief safety/ethics note when needed; Accuracy mandate: explicitly fact-check every label, term, unit, spelling, and internal consistency (terminology, capitalization, symbols) and never trade correctness for style; Design requirements (must look premium and professional): enforce a premium “editorial + classroom clarity” look using strictly flat vector artwork (no photorealism, no 3D, no heavy textures, no messy sketching, no brand logos/watermarks), with clean geometric forms, consistent stroke system (single stroke-weight family with deliberate hierarchy: primary outline, secondary dividers, tertiary details), cohesive corner radius scale, subtle depth only when needed (very light soft shadow or offset card, never dramatic), and perfect alignment (baseline grid, consistent padding, equal gutters, optical centering, no awkward tangents); choose an intentional layout architecture that matches the topic and ratio (header + hero diagram + balanced supporting modules such as labeled callouts, step flow, comparisons, cause→effect chain, legend grid, map-with-legend, checklist, timeline, myth-vs-fact, formula + micro-example), always prioritizing scannability without sacrificing essential content; apply a premium typography system (high-legibility sans-serif such as Inter / Source Sans / Nunito; 4–6 levels max; comfortable line-height; controlled line length; consistent capitalization; aligned units and number styling; consistent bullets/numbering) and use structured microcopy (chips, short blocks, mini headers) to increase information density without clutter; craft a modern color system (curated palette: 1 primary, 1–2 secondary, 1 accent + neutrals; consistent color-coding with legend when meaningful; strong contrast; color-blind-friendly separation; tasteful tints; no random rainbow noise); use a cohesive icon/illustration language (single family, consistent style) where icons clarify meaning, not decoration; for diagrams/callouts use thin elegant leader lines with dot endpoints, rounded label pills, perfect spacing, and no line crossings; for charts/data use clean axes, labeled units, honest scales, clear legends, minimal ink, and make the takeaway obvious fast; optimize per format (9:16 = larger type + vertical story flow; 16:9 = wide compare strips + left-to-right narrative; print = print-safe margins + crisp linework + readable at viewing distance); QR Code Handling (optional, must be precision-perfect): if the user enables a QR code, integrate it as a designed QR module card placed at the chosen corner (Bottom Right, Bottom Left, Top Right, Top Left) inside the safe margins, sized exactly 3 cm × 4 cm overall (this rectangle includes the QR code and its caption); treat this module as a first-class layout component—do not “paste” a QR image on top of a pre-framed box—instead generate/layout the QR card and the QR code together so alignment is flawless; within the 3×4 cm card, reserve a square QR area with a guaranteed quiet zone (clear margin around the code) and enforce exact internal padding and center alignment so the QR code never touches the border, never clips, and never overlaps rounded corners (use a clean inner content rectangle inset from the card border; snap all edges to the grid/pixels); place the user-provided footnote text (e.g., {QR_CAPTION}) as a caption band aligned to the card’s internal grid (caption centered or left-aligned consistently across styles, baseline-aligned, no collision with the QR area, consistent spacing above/below); ensure the QR card visually belongs to the design (same palette, stroke weights, corner radius, subtle depth as other cards) and avoid an obvious blank “hole” by letting nearby panels/background patterns flow naturally up to the QR card with consistent gutters; guarantee professional placement by enforcing no-overlap rules (QR code must sit fully inside the QR content area; border stroke must remain fully visible; shadow must not distort the code; no rotation or skew; no anti-aliased resizing that softens modules—prefer crisp vector-like rendering or nearest-neighbor scaling to keep edges sharp); if the QR graphic is provided externally, compute its bounding box and fit-to-frame with exact scaling and centering, then clip/mask strictly within the inner QR area while preserving the quiet zone; finally validate scannability by ensuring high contrast, a quiet background inside the QR area (no patterns behind the code), and a clean separation between code area and caption; Final balance rule (non-negotiable): if space becomes tight, do not remove essential knowledge—compress intelligently (tighten copy, convert prose to structured microcopy, merge related points, reduce decorative elements) while preserving legibility, spacing, and clean hierarchy; run a final quality checklist before output: margin compliance, alignment, spacing consistency, type hierarchy, color consistency, icon consistency, diagram correctness, legend completeness, QR module exact sizing and corner placement, QR/code-to-card alignment (no overlap/clipping), caption alignment, QR scannability, readability at intended size, and overall “one-glance comprehension + premium polish.”
`;

  const qrCaption = (qrConfig && qrConfig.enabled && qrConfig.footnote) ? qrConfig.footnote : "Scan Me";

  // Apply substitutions to the master template
  const systemInstruction = MASTER_PROMPT_TEMPLATE
      .replace('{TOPIC}', topic.title)
      .replace('{TARGET_AUDIENCE}', level)
      .replace('{QR_CAPTION}', qrCaption)
      + `\n\nTASK CONFIG:\nSelected Aspect Ratio: ${selectedRatioText}\n${qrStateInfo}\n${formatInstruction}`;

  // --- 3. PROMPT GENERATOR EXECUTION ---
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
        temperature: 0.7,
      }
    });
    refinedPrompt = textResponse.text || `${topic.title} educational poster, flat vector style, educational infographic`;
  } catch (e) {
    checkApiError(e);
    console.error("Error generating prompt:", e);
    refinedPrompt = `Create a flat vector educational infographic about ${topic.title} with wide margins, clean outlines, and a bottom quiz strip.`;
  }

  // Step 2: Generate the Image
  try {
    // We use the Pro model for ALL resolutions (1K, 2K, 4K) to guarantee the text is legible.
    const generateConfig = {
      imageConfig: {
        aspectRatio: apiAspectRatio,
        imageSize: resolution // '1K', '2K', or '4K'
      },
      safetySettings: SAFETY_SETTINGS // Pass permissive safety settings
    };

    let imageResponse;
    try {
        imageResponse = await ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: refinedPrompt,
          config: generateConfig
        });
    } catch (apiError: any) {
       // If 4K/2K fails (e.g. quota or region lock), try falling back to 1K (still on Pro model)
       checkApiError(apiError); // Throw if it's a critical auth error
       
       if (resolution !== ImageResolution.RES_1K) {
         console.warn(`Resolution ${resolution} failed, falling back to 1K on Pro model.`);
         imageResponse = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: refinedPrompt,
            config: { 
              imageConfig: { aspectRatio: apiAspectRatio, imageSize: ImageResolution.RES_1K },
              safetySettings: SAFETY_SETTINGS
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

    // Step 3: Overlay QR Code if enabled
    if (qrConfig && qrConfig.enabled) {
      base64Image = await mergeQrCodeWithImage(base64Image, qrConfig);
    }

    return {
      base64Image,
      refinedPrompt
    };
  } catch (error: any) {
    checkApiError(error);
    
    // Explicitly handle Model Not Found to help user debug
    const msg = (error.message || '').toLowerCase();
    if (msg.includes("404") || msg.includes("not found")) {
      throw new Error(`Model 'gemini-3-pro-image-preview' not found. Your API Key might not have access to Pro features yet.`);
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
          
          // Margin: Increase to 4% to match "Wide Safe Margins" and avoid overlap with AI's tight margin placeholder
          const margin = Math.round(img.width * 0.04); 
          
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

          // Padding inside the white box
          const padding = Math.round(qrContainerSize * 0.08);
          // Calculated Font Size
          const fontSize = qrConfig.footnote ? Math.round(qrContainerSize * 0.1) : 0;
          
          // Calculate available height for QR to prevent overlap
          let qrDrawSize = qrContainerSize - (padding * 2);
          if (qrConfig.footnote) {
             // Reserve space for text
             qrDrawSize = qrDrawSize - fontSize - (padding * 0.5); 
          }

          // Draw OPAQUE White Background with Rounded Corners to cover any AI hallucinated QR
          ctx.fillStyle = "#ffffff";
          const radius = Math.round(qrContainerSize * 0.1);
          
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + qrContainerSize - radius, y);
          ctx.quadraticCurveTo(x + qrContainerSize, y, x + qrContainerSize, y + radius);
          ctx.lineTo(x + qrContainerSize, y + qrContainerSize - radius);
          ctx.quadraticCurveTo(x + qrContainerSize, y + qrContainerSize, x + qrContainerSize - radius, y + qrContainerSize);
          ctx.lineTo(x + radius, y + qrContainerSize);
          ctx.quadraticCurveTo(x, y + qrContainerSize, x, y + qrContainerSize - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
          
          // Draw QR centered horizontally in the box
          const qrX = x + (qrContainerSize - qrDrawSize) / 2;
          ctx.drawImage(qrImg, qrX, y + padding, qrDrawSize, qrDrawSize);

          // Draw Text
          if (qrConfig.footnote) {
             ctx.fillStyle = "#000000";
             // Use sans-serif, bold
             ctx.font = `bold ${fontSize}px sans-serif`; 
             ctx.textAlign = "center";
             ctx.textBaseline = "bottom";
             ctx.fillText(qrConfig.footnote, x + (qrContainerSize/2), y + qrContainerSize - padding);
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





