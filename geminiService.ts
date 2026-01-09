
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Topic, AspectRatio, InfographicFormat, ImageResolution, QrConfig, QrPosition, QuizQuestion, PresentationSlide, ShortsScene } from "../types";

// Initialize Gemini Client
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview'; // For complex text/logic
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
 * Analyzes user provided source material (Text, Image, Idea, or URL) and returns a structured Topic object.
 * Aggregates ALL provided inputs.
 */
export const analyzeSourceMaterial = async (
  inputs: {
    text?: string;
    image?: string;
    url?: string;
    idea?: string;
  }
): Promise<Topic> => {
  const ai = getAiClient();
  let promptParts: string[] = [];
  let contentsPayload: any[] = [];
  let tools: any[] = [];

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      sourceContent: { type: Type.STRING }
    },
    required: ["title", "description", "sourceContent"]
  };

  // 1. Handle Image/PDF (Must be first part if present)
  if (inputs.image) {
     const base64Data = inputs.image.split(',')[1];
     const mimeType = inputs.image.split(';')[0].split(':')[1];
     contentsPayload.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
     });
     // Updated Prompt for Images AND PDFs
     promptParts.push("SOURCE MATERIAL: Analyze the attached image or document. If it is a PDF, summarize the key textual information. If it is an image, perform OCR and analyze visual structure.");
  }

  // 2. Handle URL (Requires Search Tool)
  if (inputs.url && inputs.url.trim().length > 0) {
     promptParts.push(`EXTERNAL SOURCE URL: "${inputs.url}". Use Google Search to find the content of this link. If it is a YouTube video, summarize the video content and key takeaways. If it is an article, summarize the main arguments.`);
     tools.push({ googleSearch: {} });
  }

  // 3. Handle Text
  if (inputs.text && inputs.text.trim().length > 0) {
     promptParts.push(`TEXT NOTES: "${inputs.text.substring(0, 15000)}"`);
  }

  // 4. Handle Specific Idea
  if (inputs.idea && inputs.idea.trim().length > 0) {
     promptParts.push(`USER INTENT/DIRECTION: "${inputs.idea}"`);
  }

  // 5. Final Instruction
  const masterPrompt = `
    You are an expert educational content analyst.
    
    TASK: Synthesize ALL the provided sources above (Visuals, Documents, URLs, Text, and User Intent) into a single, cohesive educational concept for an infographic.
    
    1. Combine facts from the text/URL/document with the visual structure of the image (if provided).
    2. Prioritize the 'User Intent' if there are conflicts.
    3. If a YouTube link is provided, extract the core educational value.
    
    RETURN JSON:
    - title: A short, catchy title covering the combined topic.
    - description: A 1-sentence summary of the synthesized concept.
    - sourceContent: A comprehensive, structured list of 5-10 key facts, steps, or data points extracted from ALL sources. This list will be used to generate the final infographic content.
  `;
  
  promptParts.push(masterPrompt);
  contentsPayload.push({ text: promptParts.join("\n\n") });

  try {
    const response = await ai.models.generateContent({
      model: tools.length > 0 ? PRO_MODEL : FLASH_MODEL, // Use Pro if we need search or deep reasoning
      contents: contentsPayload,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        tools: tools
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned");
    const item = JSON.parse(text);

    return {
      id: `topic-custom-${Date.now()}`,
      title: item.title,
      description: item.description,
      sourceContent: item.sourceContent
    };
  } catch (error) {
    handleApiError(error, "analyzing source material");
    throw error;
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
    
    Create a one-page infographic titled "[TITLE]" with a centered composition and wide safety margins on all sides (no text touching edges), clean modern classroom style, crisp outlines, minimal shading; 
    
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
  // If user provided sourceContent, we force the AI to use it instead of inventing details.
  const contentSourceInstruction = topic.sourceContent 
    ? `
      CRITICAL SOURCE MATERIAL:
      The user has provided specific data for this infographic.
      You MUST use the facts below for the callouts, sidebar lists, and diagrams. 
      DO NOT invent new facts. VISUALIZE THIS CONTENT:
      
      "${topic.sourceContent}"
      `
    : `
      **Content Generation**: Do not be vague. Invent specific text labels, specific numbered callouts, and specific sidebar content based on general knowledge of the topic.
      Instead of saying "add labels", say "add callout (1) Label Text...".
    `;

  const systemInstruction = `
    You are an expert Art Director for educational infographics.
    Your task is to write a **single, extremely detailed image generation prompt** for Gemini 3 Pro Image.
    
    YOU MUST MIMIC THE DENSITY AND STRUCTURE OF THIS TEMPLATE:
    ${GOLD_STANDARD_TEMPLATE}

    RULES FOR THE PROMPT YOU WRITE:
    1.  **Style**: "Flat vector educational style", "clean rounded outlines", "simple geometric shapes", "bright classroom colors".
    2.  **Safety**: "Wide safe margins on all sides", "No text touching edges".
    3.  **Visual Layout**: Plan for an aspect ratio of ${layoutDescription}.
    4.  **NEGATIVE CONSTRAINT**: Do NOT include the words "${layoutDescription}" or any aspect ratio numbers in the image text. The image should ONLY contain educational content about the topic.
    5.  **QR Code**: ${qrInstruction}
    6.  **Content Source**: ${contentSourceInstruction}
    
    Target Audience: ${level}
  `;

  const promptGenerationPrompt = `
    Write the image prompt for:
    Topic: ${topic.title}
    Description: ${topic.description}
    Subject: ${subject || "General Knowledge"}
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
 * NEW: Generates a specific slide image (Mini-Infographic)
 */
export const generateSlideImage = async (
  slideTitle: string,
  visualDescription: string,
  tone: string
): Promise<string> => {
  const ai = getAiClient();

  // Special Prompt optimized for Slides (Big Text, Low Density)
  const slidePrompt = `
    Create a stunning 16:9 [LANDSCAPE] presentation slide for the topic: "${slideTitle}".
    Visual Instructions: ${visualDescription}
    Style: ${tone} professional vector art, educational style.
    
    CRITICAL DESIGN RULES FOR PROJECTION:
    1.  **MASSIVE TEXT**: All text must be HUGE and legible from a distance. 
    2.  **LOW DENSITY**: Do NOT clutter. Only 3-4 key visual elements max.
    3.  **Visual Hierarchy**: One large central graphic/diagram on the left/center, with large bold labels or a single key statement on the right.
    4.  **Background**: Clean, solid or subtle gradient background (white, light gray, or dark navy) to ensure high contrast.
    5.  **No Margins Issues**: Keep all content well away from the edges (safe zone).
    
    This is a "Mini-Infographic". It should look like a simplified, zoomed-in section of a larger infographic.
  `;

  try {
    const imageResponse = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: slidePrompt,
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K" // Slides usually don't need 4K if text is huge, saves quota/speed
        }
      }
    });

    let base64Image = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    
    if (!base64Image) throw new Error("Slide generation failed");
    return base64Image;

  } catch (error) {
    handleApiError(error, "generating slide image");
    throw error;
  }
};

/**
 * UPDATED: Generates 5 KEY FACTS for a video (Supports 60s/90s).
 */
export const generateShortsScript = async (
  topic: Topic,
  subject: string,
  level: string,
  duration: '60s' | '90s' = '60s'
): Promise<ShortsScene[]> => {
  const ai = getAiClient();
  
  const isDeepDive = duration === '90s';
  const wordCount = isDeepDive ? "30-40" : "15-20";
  const toneInstruction = isDeepDive 
    ? "Provide a DETAILED, fascinating explanation. Go deep into the 'why' and 'how'."
    : "Keep it punchy, rhythmic, and clear.";

  // Inject source content if available
  const sourceContext = topic.sourceContent 
    ? `
      STRICT REQUIREMENT: The user has provided specific content for this video.
      You MUST base the chapters and script on the following facts:
      ${topic.sourceContent}
      ` 
    : "";

  const prompt = `
    Analyze the topic "${topic.title}" (${subject}).
    ${sourceContext}
    
    Extract exactly 5 KEY CHAPTERS for a ${duration} video aimed at ${level}.
    
    For each chapter, provide:
    1. "headline": A very short, punchy title (max 5-7 words). This is the visual anchor.
    2. "voiceScript": The narrator's script. ${toneInstruction} Length: approx ${wordCount} words.
    3. "visualPrompt": A description for a CINEMATIC, PHOTOREALISTIC, HIGH-FIDELITY SCENE representing this fact.
    
    STYLE GUIDE for Visuals:
    - **PHOTOREALISM ONLY**. Do NOT use "vector", "cartoon", "illustration".
    - Keywords: "Cinematic lighting", "8k resolution", "National Geographic photography", "Macro lens", "Unreal Engine 5 render".
    
    Return STRICT JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              headline: { type: Type.STRING },
              voiceScript: { type: Type.STRING },
              visualPrompt: { type: Type.STRING }
            },
            required: ["id", "headline", "voiceScript", "visualPrompt"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    handleApiError(error, "generating shorts script");
    throw error;
  }
};

/**
 * UPDATED: Generates a HIGH QUALITY CINEMATIC background image.
 */
export const generateShortsImage = async (visualPrompt: string, aspectRatio: '9:16' | '16:9' = '9:16'): Promise<string> => {
  const ai = getAiClient();
  const enhancedPrompt = `
    Create a stunning ${aspectRatio === '9:16' ? 'vertical' : 'landscape'} cinematic image.
    Subject: ${visualPrompt}.
    
    MANDATORY STYLE:
    - **Photorealistic / 3D Render** (No cartoons, no vector art, no illustrations).
    - **High Fidelity**: 8k resolution, highly detailed textures, dramatic lighting, depth of field.
    - **Composition**: Cinematic ${aspectRatio === '9:16' ? 'vertical' : 'widescreen'} shot. Center focus. 
    - **Atmosphere**: Professional documentary style (National Geographic / BBC Earth).
    
    NEGATIVE PROMPT (Do not include): text, watermark, labels, cartoon, sketch, painting, low poly, blur.
  `;

  try {
    const imageResponse = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: enhancedPrompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K" 
        }
      }
    });

    let base64Image = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    
    if (!base64Image) throw new Error("Shorts image generation failed");
    return base64Image;

  } catch (error) {
    handleApiError(error, "generating shorts image");
    throw error;
  }
};

/**
 * NEW: Generates Voiceover Audio for a single text segment.
 */
export const generateVoiceover = async (text: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' } // 'Fenrir' is a deep, authoritative narrator voice
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    return base64PcmToWavBlobUrl(base64Audio, 24000);
  } catch (error) {
    console.error("Voiceover failed", error);
    return ""; // Return empty string on fail so video can still play without audio
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
  
  // Inject source content if available
  const sourceContext = topic.sourceContent 
    ? `
      STRICT REQUIREMENT: The user has provided source material.
      You MUST base your article and summary on the following facts:
      ${topic.sourceContent}
      ` 
    : "";

  const prompt = `
    Write an educational summary and a comprehensive article about "${topic.title}" (${subject}), tailored for a ${level} audience.
    ${sourceContext}
    
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

  // Inject source content
  const sourceContext = topic.sourceContent 
    ? `
      STRICT REQUIREMENT: The user provided specific content. 
      The hosts MUST discuss these specific facts found in the source material:
      ${topic.sourceContent}
      ` 
    : "";

  const scriptPrompt = `
    Write an engaging conversational podcast script between two hosts (Host and Expert) discussing "${topic.title}" for a ${level} audience.
    ${sourceContext}
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

/**
 * Generates 20 quiz questions.
 */
export const generateQuiz = async (topic: Topic, subject: string, level: string): Promise<QuizQuestion[]> => {
  const ai = getAiClient();
  
  // Inject source content
  const sourceContext = topic.sourceContent 
    ? `
      STRICT REQUIREMENT: The user provided specific content.
      You MUST base your questions on these facts:
      ${topic.sourceContent}
      ` 
    : "";

  const prompt = `Generate 20 multiple-choice questions for a classroom quiz about "${topic.title}" (${subject}), suitable for a ${level} audience.
  ${sourceContext}
  
  Output STRICT JSON array format:
  [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Short explanation of why this is correct."
    }
  ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    handleApiError(error, "generating quiz");
    throw error;
  }
};

/**
 * Generates a structured Presentation Deck.
 */
export const generatePresentation = async (
  topic: Topic, 
  subject: string, 
  level: string,
  slideCount: number,
  tone: string
): Promise<PresentationSlide[]> => {
  const ai = getAiClient();
  
  // Inject source content
  const sourceContext = topic.sourceContent 
    ? `
      STRICT REQUIREMENT: Use the source material below to structure the deck content.
      Source: ${topic.sourceContent}
      ` 
    : "";

  const prompt = `
    Act as a professional presentation designer and instructional designer.
    Deconstruct the topic "${topic.title}" (${subject}) into ${slideCount} distinct "Mini-Infographic" concepts for a ${level} audience (${tone} tone).
    ${sourceContext}
    
    The goal is to create a visual deck where EACH slide is a self-contained, large-format infographic (16:9).
    
    Structure Required:
    1. Title Slide
    2. Overview / Agenda
    3- ${slideCount-1}. Core Concepts (Break down the mother topic into sub-topics)
    ${slideCount}. Conclusion
    
    Output STRICT JSON array of objects with keys: title, content (array of strings), speakerNotes, visualPrompt, type.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.ARRAY, items: { type: Type.STRING } },
              speakerNotes: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["title", "content", "speakerNotes", "visualPrompt", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    handleApiError(error, "generating presentation");
    throw error;
  }
};

/**
 * Helper to convert Base64 PCM data to WAV Blob URL for playback.
 */
function base64PcmToWavBlobUrl(base64Pcm: string, sampleRate: number): string {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, len, true);

  const blob = new Blob([view, bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Helper to Overlay QR Code on Image.
 */
const mergeQrCodeWithImage = async (base64Image: string, qrConfig: QrConfig): Promise<string> => {
  if (!qrConfig.url) return base64Image;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (!ctx) { resolve(base64Image); return; }

      ctx.drawImage(img, 0, 0);

      // Simple QR Code generation using an API to avoid large libraries
      const qrImg = new Image();
      qrImg.crossOrigin = "Anonymous";
      const qrSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.15);
      const encodedUrl = encodeURIComponent(qrConfig.url);
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodedUrl}&bgcolor=255-255-255&margin=2`;

      qrImg.onload = () => {
        const padding = Math.floor(canvas.width * 0.03);
        let x = 0, y = 0;

        switch(qrConfig.position) {
           case QrPosition.BOTTOM_RIGHT:
              x = canvas.width - qrSize - padding;
              y = canvas.height - qrSize - padding;
              break;
           case QrPosition.BOTTOM_LEFT:
              x = padding;
              y = canvas.height - qrSize - padding;
              break;
           case QrPosition.TOP_RIGHT:
              x = canvas.width - qrSize - padding;
              y = padding;
              break;
           case QrPosition.TOP_LEFT:
              x = padding;
              y = padding;
              break;
           default: // Bottom Right default
              x = canvas.width - qrSize - padding;
              y = canvas.height - qrSize - padding;
        }

        // Draw White Background Box/Border
        ctx.fillStyle = "white";
        // A little extra border
        ctx.fillRect(x - 5, y - 5, qrSize + 10, qrSize + 10);

        ctx.drawImage(qrImg, x, y, qrSize, qrSize);

        if (qrConfig.footnote) {
           ctx.fillStyle = "black";
           ctx.font = `bold ${Math.floor(qrSize * 0.08)}px sans-serif`;
           ctx.textAlign = "center";
           ctx.fillText(qrConfig.footnote, x + qrSize/2, y + qrSize + 15);
        }

        resolve(canvas.toDataURL('image/png'));
      };

      qrImg.onerror = () => {
         console.warn("QR Code API failed to load");
         resolve(base64Image);
      };
    };

    img.onerror = () => resolve(base64Image);
    img.src = base64Image;
  });
};
