
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
You are an expert Art Director and Expert Instructional Designer. Create a one-page infographic about {TOPIC} for {TARGET_AUDIENCE} that is world-class, visually stunning, and professionally art-directed, while also being genuinely comprehensive, information-rich, and instructionally complete; your core goal is a balanced 50/50 outcome: premium design polish and high-density, high-accuracy knowledge, with zero fluff and zero missing essentials.
First, apply the user’s chosen canvas format/aspect ratio and size the layout accordingly—{SELECTED_RATIO}—then build a centered, grid-based composition with wide safe margins and a strict no-touch boundary (nothing—text, icons, arrows, leader lines, charts, labels, panels, visuals, legends—may touch or crowd the edges).
Content requirements (must be comprehensive and detailed, not surface-level)
Include the most important knowledge a learner would reasonably expect on a “complete” one-page reference, adapted to the audience’s level; do not under-explain—compress information smartly instead of omitting it. Structure content into clear modules and ensure each module contains enough substance to stand alone:
•	Title + one-sentence thesis: what this infographic teaches and why it matters.
•	Core definition(s): precise, audience-appropriate, with key vocabulary highlighted.
•	Key concepts (minimum 5–9): present as short, information-dense blocks (not vague phrases).
•	Mechanism / how it works: a concise but complete explanation, often as a labeled diagram, flow, or step sequence.
•	Critical details & parameters: include units, conditions, ranges, categories, parts, steps, or criteria that are essential for correctness (as applicable to the topic).
•	Examples (minimum 3): concrete examples plus at least 1 counterexample or “not this” when it helps avoid misconceptions.
•	Common misconceptions / pitfalls (minimum 3): clearly corrected in one line each.
•	Real-world applications: at least 3, specific and relatable to the audience.
•	Mini “Quick Check”: 2–4 questions with answers (compact, unobtrusive) OR a tiny “Try it” prompt with a worked micro-example (for math/physics).
•	Safety/ethics note when relevant (brief, calm, age-appropriate).
Accuracy mandate: explicitly fact-check every label, term, unit, spelling, and internal consistency (terminology, capitalization, symbols). Never trade correctness for style.
Design requirements (must look premium and professional)
Enforce a premium “editorial + classroom clarity” look using strictly flat vector artwork (no photorealism, no 3D, no heavy textures, no messy sketching, no brand logos/watermarks), with clean geometric forms, consistent stroke system (single stroke-weight family with deliberate hierarchy: primary outline, secondary dividers, tertiary details), rounded corners (cohesive radius scale), subtle depth only when needed (very light soft shadow or offset card, never dramatic), and perfect alignment (baseline grid, consistent padding, equal gutters, optical centering, no awkward tangents).
Choose an intentional layout architecture that matches the topic and the chosen ratio: a strong Title/Header zone, a Hero visual/diagram that communicates the core concept instantly, and supporting modules arranged as balanced cards (labeled diagram + callouts, step-by-step flow, comparison panels, cause→effect chain, legend-based map, quick reference grid, mini timeline, checklist, myth-vs-fact strip, formula + worked micro-example), always prioritizing scannability while still carrying real substance.
Apply a typography system that feels premium and readable (high-legibility sans-serif, e.g., Inter / Source Sans / Nunito; consistent type scale with 4–6 levels max; comfortable line-height; short line lengths; controlled letter spacing; consistent capitalization rules; numeric styling with aligned units; bullet and numbering styles consistent); avoid long paragraphs—use structured microcopy (chips, short blocks, mini headers) to increase information density without clutter.
Craft a color system that looks modern and polished (limited, curated palette with 1 primary, 1–2 secondary, 1 accent, plus neutrals; purposeful color-coding by category with a small legend when color conveys meaning; strong contrast and color-blind-friendly separations; tints for backgrounds and highlights; no random rainbow clutter; keep saturation balanced).
Use a cohesive icon and illustration language (single icon family, consistent stroke/filled style, consistent corner language); icons must carry meaning (signal categories, steps, warnings, examples) rather than decoration. For diagrams and callouts, use thin, elegant leader lines with dot endpoints, labels in rounded pills/cards, perfect spacing, and no line crossings. For charts/data, use clean axes, labeled units, honest scales, clear legends, minimal ink, and make the takeaway obvious fast.
Optimize per format—on 9:16 prioritize larger text and vertical story flow; on 16:9 use wide compare strips and left-to-right narrative; on print formats ensure print-safe margins, crisp linework, and comfortable reading distance; keep everything readable at 100% zoom and at normal viewing distance.
QR Code Handling (optional)
If the user enables a QR code, reserve a 3 cm × 4 cm QR module placed at the user-selected corner (Bottom Right, Bottom Left, Top Right, Top Left) inside the safe margins; design it as an integrated corner card (same palette, stroke weight, corner radius, subtle depth), include the user-entered footnote caption (e.g., “Scan Me!”) in a small readable sans-serif under/beside it, keep it high-contrast and scannable (quiet background inside the card, no busy pattern behind the code), and avoid an obvious blank/white “hole”—let surrounding panels and background texture flow naturally up to the QR card with consistent gutters, reflowing modules as needed to keep the layout centered and premium.
Final balance rule (non-negotiable)
If space becomes tight, do not remove essential knowledge; instead compress intelligently: tighten copy, convert prose to structured microcopy, use icons + short labels, merge related points, reduce decorative elements, and simplify backgrounds—while preserving legibility and clean spacing. The finished infographic must feel like a complete, authoritative one-page reference and a gallery-quality design.
Run a final quality checklist before output: margin compliance, alignment, spacing consistency, type hierarchy, color consistency, icon consistency, diagram correctness, legend completeness, QR scannability, readability at intended size, and overall “one-glance comprehension + premium polish.”
`;

  // Apply substitutions to the master template
  const systemInstruction = MASTER_PROMPT_TEMPLATE
      .replace('{TOPIC}', topic.title)
      .replace('{TARGET_AUDIENCE}', level)
      .replace('{SELECTED_RATIO}', selectedRatioText)
      + `\n\nTASK CONFIG:\n${qrStateInfo}\n${formatInstruction}`;

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




