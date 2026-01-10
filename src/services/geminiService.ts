
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Topic, AspectRatio, InfographicFormat, ImageResolution, QrConfig, QrPosition, QuizQuestion, PresentationSlide, ShortsScene } from "../types";
import { getSystemConfig } from "./dbService";

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  return new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });
};

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview'; // For complex text/logic
const IMAGE_MODEL_DEFAULT = 'gemini-3-pro-image-preview'; 
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// --- ROBUST MOCK DATA FOR FALLBACKS ---
const MOCK_CATEGORIES = [
  "Core Concepts", "History & Evolution", "Key Figures", "Modern Applications", 
  "Future Trends", "Case Studies", "Global Impact", "Anatomy & Structure", 
  "Process & Workflow", "Comparison & Contrast", "Statistics & Data", "Myths vs Facts"
];

const MOCK_TOPICS: Topic[] = [
  { id: 'm1', title: 'The Water Cycle', description: 'Visualizing evaporation, condensation, and precipitation.' },
  { id: 'm2', title: 'Layers of the Earth', description: 'A cross-section view of the crust, mantle, and core.' },
  { id: 'm3', title: 'Photosynthesis Explained', description: 'How plants convert light into energy.' },
  { id: 'm4', title: 'Solar System Overview', description: 'Relative sizes and distances of planets.' },
  { id: 'm5', title: 'Human Brain Anatomy', description: 'Functions of the different lobes and hemispheres.' },
  { id: 'm6', title: 'The Internet Infrastructure', description: 'How data travels through cables and satellites.' }
];

const MOCK_QUIZ: QuizQuestion[] = [
  { id: 1, question: "What is the primary concept?", options: ["A", "B", "C", "D"], correctAnswerIndex: 0, explanation: "This is a placeholder quiz." },
  { id: 2, question: "Which factor is most critical?", options: ["Speed", "Cost", "Quality", "Time"], correctAnswerIndex: 2, explanation: "Quality ensures longevity." }
];

// --- HELPERS ---

/**
 * Helper: Clean up common AI markdown artifacts
 */
const cleanAiText = (text: string) => {
  if (!text) return "";
  let clean = text;
  // Remove ** wrapping entire lines/paragraphs
  clean = clean.replace(/^\s*\*\*(.*?)\*\*\s*$/gm, '$1');
  // Remove "Sure, here is..." meta text
  clean = clean.replace(/^(Sure|Here|Certainly).*?:\n/i, '');
  return clean.trim();
};

/**
 * Helper to check if we should use Mock Mode
 */
const shouldMock = () => {
  const key = process.env.API_KEY;
  return !key || key.includes('placeholder') || key.length < 10;
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

  // Fallback for safety/quota errors
  if (msg.includes('429') || msg.includes('quota')) {
    throw new Error("AI Quota Exceeded. Please try again later.");
  }

  throw error;
};

// --- CORE SERVICES ---

/**
 * Generates a list of categories based on Subject and Level using Gemini Flash.
 */
export const fetchCategories = async (subject: string, level: string): Promise<string[]> => {
  if (shouldMock()) return MOCK_CATEGORIES;

  const ai = getAiClient();
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
    if (!text) return MOCK_CATEGORIES;
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    // Graceful degradation
    return MOCK_CATEGORIES; 
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
  if (shouldMock()) return MOCK_TOPICS.slice(0, count);

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
    if (!text) return MOCK_TOPICS.slice(0, count);
    const rawData = JSON.parse(text);
    
    return rawData.map((item: any, index: number) => ({
      id: `topic-${Date.now()}-${index}`,
      title: item.title,
      description: item.description
    }));
  } catch (error) {
    console.warn("Topic generation failed, using mocks");
    return MOCK_TOPICS.slice(0, count);
  }
};

export const analyzeSourceMaterial = async (inputs: { text?: string; image?: string; url?: string; idea?: string; }): Promise<Topic> => {
  if (shouldMock()) {
    return {
      id: 'mock-analysis',
      title: 'Analysis of Your Content',
      description: 'A visual summary of the provided text.',
      sourceContent: inputs.text || "Mock extracted content..."
    };
  }

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

  // 1. Handle Image/PDF
  if (inputs.image) {
     const base64Data = inputs.image.split(',')[1];
     const mimeType = inputs.image.split(';')[0].split(':')[1];
     contentsPayload.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
     });
     promptParts.push("SOURCE MATERIAL: Analyze the attached image or document. If it is a PDF, summarize the key textual information. If it is an image, perform OCR and analyze visual structure.");
  }

  // 2. Handle URL
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
      model: tools.length > 0 ? PRO_MODEL : FLASH_MODEL, 
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

export const fetchSingleTopic = async (
  subject: string,
  level: string,
  category: string,
  existingTitles: string[]
): Promise<Topic> => {
  if (shouldMock()) return MOCK_TOPICS[0];

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

const getApiAspectRatio = (ratio: AspectRatio): string => {
  switch (ratio) {
    case AspectRatio.A4_PORTRAIT:
    case AspectRatio.LETTER_PORTRAIT:
      return "3:4";
    case AspectRatio.A4_LANDSCAPE:
    case AspectRatio.LETTER_LANDSCAPE:
      return "4:3";
    default:
      return ratio;
  }
};

const getLayoutDescription = (ratio: AspectRatio): string => {
  switch (ratio) {
    case AspectRatio.A4_PORTRAIT: return "A4 Portrait Print Layout";
    case AspectRatio.A4_LANDSCAPE: return "A4 Landscape Print Layout";
    case AspectRatio.LETTER_PORTRAIT: return "US Letter Portrait Print Layout";
    case AspectRatio.LETTER_LANDSCAPE: return "US Letter Landscape Print Layout";
    default: return ratio;
  }
};

export const generateInfographicImage = async (
  topic: Topic,
  subject: string,
  level: string,
  aspectRatio: AspectRatio,
  format: InfographicFormat = InfographicFormat.STANDARD,
  resolution: ImageResolution = ImageResolution.RES_1K,
  qrConfig?: QrConfig
): Promise<{ base64Image: string, refinedPrompt: string }> => {
  if (shouldMock()) {
    return {
        base64Image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
        refinedPrompt: "Mock Prompt: Blue infographic about data"
    };
  }

  // --- BRAIN CONFIG FETCH ---
  let sysConfig;
  try {
    sysConfig = await getSystemConfig();
  } catch (e) { console.warn("Failed to fetch system config", e); }

  if (sysConfig?.maintenanceMode) {
    throw new Error("System is currently in maintenance mode. Please try again later.");
  }

  const ai = getAiClient();
  const apiAspectRatio = getApiAspectRatio(aspectRatio);
  const layoutDescription = getLayoutDescription(aspectRatio);

  const GOLD_STANDARD_TEMPLATE = `
    DESIGN STYLE: High-end, vector-art educational infographic. 
    Flat design, clean lines, vibrant but professional color palette (Deep Blue, Teal, Gold, Soft White).
    Typography should be legible, sans-serif, and hierarchical (Headings, Subheadings, Body).
    Avoid photorealism; prefer stylized, clear, and explanatory scientific illustration.
    White background or very light neutral background for clarity.
    
    VISUAL HIERARCHY:
    1. Title: Large, bold, at the top.
    2. Central Visual: The main concept illustrated clearly in the center.
    3. Data Points: Surrounding stats, charts, or bullet points.
    4. Flow: Eye should move logically from top-left to bottom-right (or center-out).
  `;
  
  let layoutInstruction = "";
  if (format === InfographicFormat.MINDMAP) {
    layoutInstruction = `
      LAYOUT: Central Concept Mindmap. 
      Place the core idea "${topic.title}" in the absolute center. 
      Branch out with 4-6 connected nodes using smooth curved lines. 
      Each node should have a distinct icon and a small text label.
      Radial symmetry or balanced organic spread.
    `;
  } else if (format === InfographicFormat.FLOWCHART) {
    layoutInstruction = `
      LAYOUT: Vertical Decision Flowchart. 
      Start at the top with the main question/topic.
      Use clear directional arrows pointing downwards or sidewards.
      Distinct shapes for processes (rectangles) and decisions (diamonds).
      Logical step-by-step progression.
    `;
  } else {
    layoutInstruction = `
      LAYOUT: Detailed Educational Poster with Callouts.
      Main visual anchor in the center or top-third.
      Surrounding sections with stats, facts, and mini-charts.
      Use connecting lines to point to specific parts of the main visual.
      Organized grid-like structure but organic flow.
    `;
  }

  let qrInstruction = "Ensure strictly wide safe margins on all sides. No text or icons touching the edges.";
  if (qrConfig && qrConfig.enabled) {
     qrInstruction = `
       CRITICAL LAYOUT CONSTRAINT: You MUST reserve the ${qrConfig.position} as a 'Forbidden Zone'. 
       Do not place ANY text, key visuals, or important lines in the ${qrConfig.position} corner (approx 15% of width/height).
       Leave this area empty or with a solid background color, as a QR code will be overlaid there later.
     `;
  }

  const contentSourceInstruction = topic.sourceContent 
    ? `CRITICAL SOURCE MATERIAL: Use these facts to construct the visual hierarchy: ${topic.sourceContent}`
    : `**Content Generation**: Invent specific, accurate, and educational text labels, stats, and facts suitable for ${subject} at ${level} level.`;

  // Use Dynamic System Prompt if available, otherwise default to Gold Standard
  const baseSystemInstruction = sysConfig?.systemPrompt || `
    You are an expert Art Director for educational infographics.
    Write a single, highly detailed image generation prompt for a text-to-image model.
    Adhere to this Style: ${GOLD_STANDARD_TEMPLATE}
  `;

  const systemInstruction = `
    ${baseSystemInstruction}
    
    Adhere to this Layout:
    ${layoutInstruction}
    Aspect Ratio Target: ${layoutDescription}
    
    ${qrInstruction}
    
    ${contentSourceInstruction}
    
    Target Audience: ${level}
    
    Your output should be the raw prompt text only. Describe the visual elements, colors, composition, and specific text labels to render.
  `;

  const promptGenerationPrompt = `Write the image prompt for: ${topic.title} - ${topic.description}. Subject: ${subject}. Format: ${format}.`;

  let refinedPrompt = "";
  try {
    const textResponse = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: promptGenerationPrompt,
      config: { 
        systemInstruction: systemInstruction, 
        temperature: sysConfig?.temperature ?? 0.7 
      }
    });
    refinedPrompt = textResponse.text || `${topic.title} infographic`;
  } catch (e) {
    refinedPrompt = `Create a flat vector educational infographic about ${topic.title}`;
  }

  // Step 2: Generate Image
  try {
    const activeImageModel = sysConfig?.imageModel || IMAGE_MODEL_DEFAULT;
    let imageResponse;
    try {
        imageResponse = await ai.models.generateContent({
          model: activeImageModel,
          contents: refinedPrompt,
          config: { imageConfig: { aspectRatio: apiAspectRatio, imageSize: resolution } }
        });
    } catch (highResError) {
       // Fallback for models that don't support high res or quota limits
       if (resolution !== ImageResolution.RES_1K) {
         console.warn("High res failed, falling back to 1K");
         imageResponse = await ai.models.generateContent({
            model: activeImageModel,
            contents: refinedPrompt,
            config: { imageConfig: { aspectRatio: apiAspectRatio, imageSize: ImageResolution.RES_1K } }
         });
       } else { throw highResError; }
    }

    let base64Image = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    if (!base64Image) throw new Error("No image data returned");

    if (qrConfig && qrConfig.enabled) {
      base64Image = await mergeQrCodeWithImage(base64Image, qrConfig);
    }

    return { base64Image, refinedPrompt };
  } catch (error) {
    handleApiError(error, "generating image");
    throw error;
  }
};

export const generateSlideImage = async (slideTitle: string, visualDescription: string, tone: string, subject?: string, bulletPoints: string[] = []): Promise<string> => {
    if (shouldMock()) return ""; 

    const ai = getAiClient();
    
    // --- SOPHISTICATED STYLE MAPPING ---
    let styleGuide = "";
    switch(tone) {
        case "Hyper-Realistic 3D":
            styleGuide = `
                STYLE: Cinematic 3D Render, Unreal Engine 5, Octane Render.
                VISUALS: Highly detailed, volumetric lighting, ray-tracing, subsurface scattering. 
                BACKGROUND: Clean, deep depth of field, premium medical/scientific studio lighting.
                ELEMENTS: Floating 3D icons, glass morphism, metallic accents.
            `;
            break;
        case "Vibrant Vector Art":
            styleGuide = `
                STYLE: "Kurzgesagt" Educational Style.
                VISUALS: Flat vector art, vibrant gradients, thick rounded outlines.
                BACKGROUND: Subtle geometric patterns, clean single-color backdrop.
                ELEMENTS: Expressive characters, clear bold icons, simplified diagrams.
            `;
            break;
        case "Neon Futuristic":
            styleGuide = `
                STYLE: Cyberpunk / Sci-Fi HUD.
                VISUALS: Glowing neon lines, wireframes, holograms on dark glass.
                BACKGROUND: Deep dark blue/purple grid, bokeh effects.
                ELEMENTS: Data streams, digital nodes, glowing schematics.
            `;
            break;
        default: // Minimalist Swiss (Default)
            styleGuide = `
                STYLE: Swiss Design / Corporate Memphis.
                VISUALS: Clean, minimalist, bold typography, negative space.
                BACKGROUND: Pure white or very light grey.
                ELEMENTS: Simple geometric shapes, high contrast, professional icons.
            `;
    }

    // Format bullets for the prompt
    const bulletsPrompt = bulletPoints.length > 0 
      ? `\nCONTENT TO INTEGRATE (Must be rendered as readable text in the image):\n- ${bulletPoints.join('\n- ')}`
      : "";

    const slidePrompt = `
      ROLE: You are a world-class Scientific Illustrator and Presentation Designer.
      TASK: Create a stunning, 4K, 16:9 presentation slide background and visual composition.
      
      CONTENT CONTEXT:
      Subject: "${subject || 'General'}"
      Slide Title: "${slideTitle}"
      Key Concept to Visualize: "${visualDescription}"
      ${bulletsPrompt}
      
      ${styleGuide}
      
      CRITICAL INSTRUCTIONS:
      1. **INTEGRATED TEXT**: You MUST render the title "${slideTitle}" into the image itself as a high-quality main headline. Use professional typography suitable for the style (e.g., 3D floating text for 3D style, bold sans-serif for Vector).
      2. **INTEGRATED BULLETS**: If content points are provided above, RENDER THEM into the composition creatively. 
         - They could be floating text boxes, labels connected to the diagram, or a clean holographic list.
         - Ensure the text is large enough to be legible on a slide.
      3. **VISUAL CENTERPIECE**: Create a specific, detailed diagram or illustration of the 'Key Concept' in the center or right half of the slide. Do not use generic icons. Make it look like a textbook diagram or high-end render.
      4. **COMPOSITION**: Balance the headline, the bullets (if any), and the main visual. Avoid clutter.
      5. **QUALITY**: 10/10 quality. Sharp, noiseless, perfect composition.
    `;

    try {
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview', // Force PRO model for text rendering capability
            contents: slidePrompt,
            config: { 
                imageConfig: { aspectRatio: "16:9", imageSize: "1K" } // 1K is faster/safer for slides, can scale up
            }
        });
        
        let base64Image = "";
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }
        return base64Image || "";
    } catch (e) { 
        console.error("Slide generation failed", e);
        return ""; 
    }
};

export const generateShortsScript = async (topic: Topic, subject: string, level: string, duration: string) => {
    if (shouldMock()) return []; 

    const ai = getAiClient();
    const prompt = `
      Analyze the topic "${topic.title}" (${subject}, ${level}). 
      Create a structured script for a ${duration} YouTube Short / TikTok video.
      Break it down into exactly 5 distinct visual scenes/chapters.
      
      Return a JSON Array of objects with:
      - id: number
      - headline: (Short, punchy text overlay, max 5 words)
      - voiceScript: (The spoken narration for this segment, about 10-15 seconds)
      - visualPrompt: (Description of the image to generate for this scene)
    `;
    
    const schema: Schema = {
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
    };

    try {
      const response = await ai.models.generateContent({
          model: PRO_MODEL,
          contents: prompt,
          config: { responseMimeType: "application/json", responseSchema: schema } 
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error(e);
      return [];
    }
};

export const generateShortsImage = async (visualPrompt: string, aspectRatio: string) => {
    if (shouldMock()) return "";

    const ai = getAiClient();
    try {
      const response = await ai.models.generateContent({
          model: IMAGE_MODEL_DEFAULT,
          contents: `Cinematic vertical video frame: ${visualPrompt}. High detailed, trending on artstation, 8k.`,
          config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" } }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data 
        ? `data:image/png;base64,${response.candidates[0].content.parts[0].inlineData.data}` 
        : "";
    } catch (e) {
      console.error("Shorts image gen failed", e);
      return "";
    }
};

export const generateVoiceover = async (text: string) => {
    if (shouldMock()) return "";

    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text }] }],
            config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } }
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return data ? base64PcmToWavBlobUrl(data, 24000) : "";
    } catch (e) { return ""; }
};

export const generateArticle = async (topic: Topic, subject: string, level: string) => {
    if (shouldMock()) return { summary: "Mock Summary", article: "Mock Article content." };

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
      Act as an engaging, expert teacher giving a masterclass.
      Topic: "${topic.title}" (${subject})
      Audience: ${level}
      ${sourceContext}

      STYLE GUIDE:
      1. TONE: Highly conversational, warm, and confident. Write as if you are speaking directly to a student. Use "we", "you", and natural transitions. Avoid stiff academic language. Make it feel like a live talk or podcast transcript.
      2. NO BOLDING: Do not use bold text, asterisks (**), or markdown bolding anywhere. Use natural emphasis through sentence structure instead.
      3. FORMATTING: Use Markdown Headers (###) for main sections. Keep paragraphs short and readable (2-3 sentences max). Use clean spacing.

      OUTPUT STRUCTURE:
      [SUMMARY]
      (Write a flowing, engaging preview of at least 150 words. Hook the reader immediately. Explain why this topic matters and what they will take away. No bold text.)

      [ARTICLE]
      (Write a comprehensive lesson of at least 500 words. Divide into logical sections with ### Headers.
       - Introduction: Set the stage.
       - Core Concepts: Explain simply.
       - Real-world context: Why does this matter?
       - Conclusion: Wrap up with a key takeaway.
       No bold text.)
    `;

    try {
      const response = await ai.models.generateContent({ 
        model: FLASH_MODEL, 
        contents: prompt
      });
      
      const text = response.text || "";
      const summary = text.match(/\[SUMMARY\]([\s\S]*?)\[ARTICLE\]/i)?.[1] || "";
      const article = text.match(/\[ARTICLE\]([\s\S]*)/i)?.[1] || text;

      // Post-processing to strictly enforce the "No Bold" rule
      const removeMarkdownBold = (str: string) => str.replace(/\*\*/g, '').replace(/__/g, '');

      return { 
        summary: removeMarkdownBold(cleanAiText(summary)), 
        article: removeMarkdownBold(cleanAiText(article)) 
      };
    } catch (e) {
      handleApiError(e, "generating article");
      throw e;
    }
};

export const generatePodcast = async (topic: Topic, subject: string, level: string) => {
    if (shouldMock()) return { audioUrl: "", script: "Mock Podcast Script" };

    const ai = getAiClient();
    const scriptResp = await ai.models.generateContent({ 
      model: FLASH_MODEL, 
      contents: `Create a podcast script between two hosts (Host and Expert) discussing "${topic.title}". 
      Keep it conversational, fun, and educational. Duration: 2 minutes.
      Do not include sound effects in the text.` 
    });
    const script = scriptResp.text || "";
    
    // Generate Audio
    const ttsResp = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: script.replace(/\*\*/g, '') }] }],
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
    const data = ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return { audioUrl: data ? base64PcmToWavBlobUrl(data, 24000) : "", script };
};

export const generateQuiz = async (topic: Topic, subject: string, level: string) => {
    if (shouldMock()) return MOCK_QUIZ;

    const ai = getAiClient();
    const prompt = `Generate 10 multiple choice questions for "${topic.title}" (${level}).
    Return a JSON Array of objects: { id, question, options: string[], correctAnswerIndex: number, explanation: string }`;
    
    try {
      const response = await ai.models.generateContent({
          model: FLASH_MODEL,
          contents: prompt,
          config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return MOCK_QUIZ;
    }
};

export const generatePresentation = async (topic: Topic, subject: string, level: string, count: number, tone: string) => {
    if (shouldMock()) {
       return Array(count).fill(0).map((_, i) => ({
          title: `Slide ${i+1}`,
          content: ["Point 1", "Point 2"],
          speakerNotes: "Mock notes",
          visualPrompt: "Mock prompt",
          type: "content"
       }));
    }

    const ai = getAiClient();
    
    // Inject source content if available (Mother Infographic context)
    const sourceContext = topic.sourceContent 
      ? `SOURCE MATERIAL (The "Mother Infographic" content): ${topic.sourceContent}\n\nUSE THIS SOURCE MATERIAL to generate specific, accurate bullet points.` 
      : `Generate comprehensive, educational content based on the topic.`;

    const prompt = `
      Act as an expert educational content creator and visual director.
      Create a ${count}-slide presentation deck structure for "${topic.title}" (${subject}, ${level}).
      
      ${sourceContext}
      
      VISUAL STYLE: ${tone}
      
      CRITICAL INSTRUCTIONS:
      1. **CONTENT**: For each slide, provide 4-5 detailed bullet points in the 'content' array. These must be factual, extracted from the source material if possible, and high value.
      2. **SPEAKER NOTES**: Write a FULL SPEECH SCRIPT for the presenter in 'speakerNotes'. Do not just write bullet points. Write natural, engaging paragraphs. The total presentation must last at least 3 minutes, so each slide needs about 60-80 words of speech script.
      3. **VISUALS**: The 'visualPrompt' must be a highly detailed description for an AI image generator (Gemini 3 Pro Image) to create a high-end background/diagram.
      
      Return JSON Array: { title, content: string[], speakerNotes, visualPrompt, type }`;
    
    try {
      const response = await ai.models.generateContent({
          model: FLASH_MODEL,
          contents: prompt,
          config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
};

function base64PcmToWavBlobUrl(base64Pcm: string, sampleRate: number): string {
    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    const writeString = (view: DataView, offset: number, string: string) => { for (let i = 0; i < string.length; i++) { view.setUint8(offset + i, string.charCodeAt(i)); } };
    writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + len, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data'); view.setUint32(40, len, true);
    return URL.createObjectURL(new Blob([view, bytes], { type: 'audio/wav' }));
}

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

        ctx.fillStyle = "white";
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

/**
 * SHOP AUTOMATION: Analyzes uploaded bundle images to generate product details.
 */
export const analyzeBundleImages = async (base64Images: string[]): Promise<{
  title: string;
  description: string;
  subject: string;
  level: string;
  features: string[];
}> => {
  if (shouldMock()) {
     return {
        title: "Mock Bundle Title",
        description: "This is a mock description generated without API key.",
        subject: "General",
        level: "All Levels",
        features: ["Mock Feature 1", "Mock Feature 2"]
     };
  }

  const ai = getAiClient();
  
  const contents = [
    {
      role: 'user',
      parts: [
        { text: "Here are several infographic images that belong to a single educational bundle. Analyze them collectively." },
        ...base64Images.map(img => ({
          inlineData: {
            mimeType: 'image/png', // Assuming PNG/JPG upload
            data: img.split(',')[1] // Strip prefix
          }
        })),
        { text: `
          Act as a Marketing Copywriter. 
          Based on the visual content of these images, generate a JSON object with:
          1. "title": A catchy, commercial product title (e.g., "Ultimate Solar System Pack").
          2. "description": A compelling 2-sentence description selling the educational value.
          3. "subject": The most likely academic subject.
          4. "level": The estimated target audience level (e.g., High School).
          5. "features": A list of 4-6 specific bullet points describing what is covered or included (e.g., "Includes detailed map of Mars", "Cycle diagram of Nitrogen").
          
          Return ONLY valid JSON.
        ` }
      ]
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis generated");
    return JSON.parse(text);
  } catch (error) {
    handleApiError(error, "analyzing bundle");
    throw error;
  }
};
















































