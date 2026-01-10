
import React, { useState, useEffect } from 'react';
import pptxgen from "pptxgenjs";
import { generatePresentation, generateSlideImage } from '../src/services/geminiService';
import { PresentationSlide, Topic } from '../src/types';
import { RefreshCw, FileDown, CheckCircle, Presentation, Layout, Loader2 } from 'lucide-react';

interface PresentationGeneratorProps {
  topic: Topic;
  subject: string;
  level: string;
  generatedImage: string | null;
  onSave: (data: PresentationSlide[]) => void;
  initialData?: PresentationSlide[] | null;
}

type GenerationStatus = 'idle' | 'planning' | 'generating_images' | 'done';

export const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({ 
  topic, subject, level, generatedImage, onSave, initialData 
}) => {
  const [slideCount, setSlideCount] = useState(8);
  const [tone, setTone] = useState("Hyper-Realistic 3D");
  
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [slides, setSlides] = useState<PresentationSlide[] | null>(null);

  // Initialize from saved data
  useEffect(() => {
    if (initialData && initialData.length > 0) {
       setSlides(initialData);
       setStatus('done');
    }
  }, [initialData]);

  const handleGenerate = async () => {
    setStatus('planning');
    setSlides(null);
    setProgress({ current: 0, total: slideCount });

    try {
      // 1. Generate Structure (Text & Prompts)
      const data = await generatePresentation(topic, subject, level, slideCount, tone);
      
      // 2. Generate Images for each slide
      setStatus('generating_images');
      const enrichedSlides: PresentationSlide[] = [];
      
      // We process sequentially to avoid rate limits and allow progress updates
      for (let i = 0; i < data.length; i++) {
        setProgress({ current: i + 1, total: data.length });
        
        try {
           // We pass the subject now to give context to the image generator
           const slideImage = await generateSlideImage(data[i].title, data[i].visualPrompt, tone, subject);
           enrichedSlides.push({ ...data[i], imageUrl: slideImage });
        } catch (err) {
           console.error(`Failed to generate image for slide ${i}`, err);
           // Fallback: push without image, we'll handle text-only fallback in PPTX
           enrichedSlides.push(data[i]); 
        }
        
        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, 500));
      }

      setSlides(enrichedSlides);
      onSave(enrichedSlides);
      setStatus('done');

    } catch (e) {
      console.error(e);
      alert("Failed to generate presentation. Please try again.");
      setStatus('idle');
    }
  };

  const handleDownload = async () => {
    if (!slides) return;

    const pres = new pptxgen();
    
    // Metadata
    pres.title = topic.title;
    pres.subject = subject;
    pres.author = "InfographAI";
    pres.layout = "LAYOUT_16x9";

    // Loop through slides
    slides.forEach((slide, index) => {
      const s = pres.addSlide();

      // Add Speaker Notes
      if (slide.speakerNotes) {
        s.addNotes(slide.speakerNotes);
      }

      // If we have a generated mini-infographic image, use it full screen
      if (slide.imageUrl) {
         // Full bleed image
         s.addImage({ 
             data: slide.imageUrl, 
             x: 0, y: 0, w: "100%", h: "100%",
             sizing: { type: "contain", w: "100%", h: "100%" }
         });
      } else {
         // Fallback to text if image failed
         s.addText(slide.title, { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "363636" });
         s.addText(slide.content.join("\n"), { x: 0.5, y: 1.5, w: 9, fontSize: 18, color: "666666", breakLine: true });
      }
    });

    await pres.writeFile({ fileName: `${topic.title.replace(/[^a-z0-9]/gi, '_')}_VisualDeck.pptx` });
  };

  return (
    <div className="flex flex-col w-full space-y-4">
      <button 
        onClick={status === 'done' ? handleDownload : handleGenerate} 
        disabled={status === 'planning' || status === 'generating_images'} 
        className={`
          flex items-center gap-3 px-6 py-4 border-2 rounded-xl transition-all text-left group shadow-sm w-full
          ${status === 'planning' || status === 'generating_images' 
             ? 'bg-slate-50 border-slate-200 cursor-wait' 
             : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}
        `}
      >
        <div className={`flex-shrink-0 p-3 rounded-full transition-transform ${status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110'}`}>
          {status === 'planning' || status === 'generating_images' ? <Loader2 className="w-6 h-6 animate-spin" /> : status === 'done' ? <FileDown className="w-6 h-6" /> : <Presentation className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
            {status === 'done' ? "Download Visual Deck" : status === 'generating_images' ? `Designing Slide ${progress.current} / ${progress.total}...` : status === 'planning' ? "Structuring Deck..." : "Generate Visual Deck"}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {status === 'done' ? "Your 8-slide visual masterpiece is ready." : "Creates 8 unique 'Mini-Infographic' slides."}
          </p>
          
          {/* Progress Bar */}
          {(status === 'generating_images' || status === 'planning') && (
             <div className="mt-3 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
                  style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                />
             </div>
          )}
        </div>
      </button>

      {/* Configuration Panel */}
      {status === 'idle' && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
           <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Slides</label>
                 <select 
                   value={slideCount} 
                   onChange={(e) => setSlideCount(parseInt(e.target.value))}
                   className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm"
                 >
                    <option value={5}>5 Mini-Infographics</option>
                    <option value={8}>8 Mini-Infographics</option>
                    <option value={10}>10 Mini-Infographics</option>
                 </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Visual Style</label>
                 <select 
                   value={tone} 
                   onChange={(e) => setTone(e.target.value)}
                   className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm"
                 >
                    <option value="Hyper-Realistic 3D">Hyper-Realistic 3D (Medical/Sci-Fi)</option>
                    <option value="Vibrant Vector Art">Vibrant Vector (Educational)</option>
                    <option value="Neon Futuristic">Neon Futuristic (Cyberpunk)</option>
                    <option value="Minimalist Swiss">Minimalist Swiss (Corporate)</option>
                 </select>
              </div>
           </div>
        </div>
      )}

      {/* Preview Panel */}
      {slides && (
        <div className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-slide-down">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Deck Ready</span>
              <button onClick={() => setStatus('idle')} className="text-xs text-slate-500 underline hover:text-red-500">Reset</button>
           </div>
           <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-black/20">
              {slides.map((s, i) => (
                 <div key={i} className="aspect-video bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden relative group hover:border-indigo-500 transition-all shadow-sm">
                    {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-2 text-center">{s.title}</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                        Slide {i+1}: {s.title}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};






