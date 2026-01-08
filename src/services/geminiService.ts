
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
  
  // 1. Prepare Variables for the Master Template
  let ratioLabel = "Square (1:1)";
  let apiRatio = "1:1";

  if (aspectRatio === AspectRatio.PORTRAIT) { ratioLabel = "Portrait (3:4)"; apiRatio = "3:4"; }
  else if (aspectRatio === AspectRatio.LANDSCAPE) { ratioLabel = "Landscape (4:3)"; apiRatio = "4:3"; }
  else if (aspectRatio === AspectRatio.TALL) { ratioLabel = "Story (9:16)"; apiRatio = "9:16"; }
  else if (aspectRatio === AspectRatio.WIDE) { ratioLabel = "Presentation (16:9)"; apiRatio = "16:9"; }

  const qrEnabled = qrConfig && qrConfig.enabled ? "TRUE" : "FALSE";
  const qrPos = qrConfig?.position || "Bottom Right";

  // --- THE MASTER TEMPLATE ---
  const MASTER_TEMPLATE = `
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

  // Apply Variables
  const systemInstruction = MASTER_TEMPLATE
    .replace(/{TOPIC}/g, topic.title)
    .replace(/{TARGET_AUDIENCE}/g, level)
    .replace(/{ASPECT_RATIO_LABEL}/g, ratioLabel)
    .replace(/{QR_ENABLED}/g, qrEnabled)
    .replace(/{QR_POSITION}/g, qrPos);

  // 2. Generate Prompt using Flash
  const promptRes = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Write a detailed image generation prompt for a ${ratioLabel} infographic about ${topic.title} based on the Art Director instructions provided.`,
    config: { systemInstruction }
  });
  const refinedPrompt = promptRes.text || topic.title;

  // 3. Generate Image
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

  // 4. QR Merge (Client Side Overlay)
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






















