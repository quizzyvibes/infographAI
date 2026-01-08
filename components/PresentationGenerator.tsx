
import React, { useState } from 'react';
import pptxgen from "pptxgenjs";
import { generatePresentation } from '../src/services/geminiService';
import { PresentationSlide, Topic } from '../src/types';
import { RefreshCw, MonitorPlay, FileDown, CheckCircle, Presentation } from 'lucide-react';

interface PresentationGeneratorProps {
  topic: Topic;
  subject: string;
  level: string;
  generatedImage: string | null;
  onSave: (data: PresentationSlide[]) => void;
}

export const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({ 
  topic, subject, level, generatedImage, onSave 
}) => {
  const [slideCount, setSlideCount] = useState(10);
  const [tone, setTone] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<PresentationSlide[] | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await generatePresentation(topic, subject, level, slideCount, tone);
      setSlides(data);
      onSave(data);
    } catch (e) {
      console.error(e);
      alert("Failed to generate presentation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!slides) return;

    const pres = new pptxgen();
    
    // Set Metadata
    pres.title = topic.title;
    pres.subject = subject;
    pres.author = "InfographAI";

    // Define Master Slide (Layout)
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "F1F5F9" }, // Slate-100
      objects: [
        // Header Bar
        { rect: { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "1E293B" } } }, // Slate-900
        // Footer Line
        { line: { x: 0.5, y: 7.0, w: 9.0, h: 0, line: { color: "64748B", width: 1 } } },
        // Slide Number
        { 
            text: { 
                text: "InfographAI", 
                options: { x: 0.5, y: 7.1, w: 3, h: 0.3, fontSize: 10, color: "94A3B8" } 
            } 
        }
      ],
      slideNumber: { x: 9.0, y: 7.1, fontSize: 10, color: "94A3B8" }
    });

    slides.forEach((slide) => {
      const s = pres.addSlide({ masterName: "MASTER_SLIDE" });

      // Add Speaker Notes
      if (slide.speakerNotes) {
        s.addNotes(slide.speakerNotes);
      }

      if (slide.type === 'title') {
        // Big Title
        s.addText(slide.title, { 
            x: 0.5, y: 2.0, w: 9, h: 1.5, 
            fontSize: 36, fontFace: "Arial", 
            color: "1E293B", align: "center", bold: true 
        });
        
        // Add the infographic image if available on title slide
        if (generatedImage) {
            // Must strip metadata header if present for some pptxgenjs versions, 
            // but normally data URI works fine.
            s.addImage({ data: generatedImage, x: 3.5, y: 3.5, w: 3, h: 3, sizing: { type: "contain", w: 3, h: 3 } });
        } else {
            // Subtitle area
            s.addText(`${subject} • ${level}`, { 
                x: 0.5, y: 3.5, w: 9, h: 0.5, 
                fontSize: 18, color: "64748B", align: "center" 
            });
        }

      } else if (slide.type === 'content' || slide.type === 'conclusion') {
        // Slide Title (in the dark header area)
        s.addText(slide.title, { 
            x: 0.5, y: 0.15, w: 9, h: 0.6, 
            fontSize: 24, fontFace: "Arial", 
            color: "FFFFFF", bold: true 
        });

        // Content Bullets
        if (slide.content && slide.content.length > 0) {
            s.addText(slide.content.map(c => ({ text: c, options: { breakLine: true } })), {
                x: 0.7, y: 1.5, w: 8.6, h: 5.0,
                fontSize: 18, color: "334155",
                bullet: { type: "number" }, // Removed unsupported 'color' property
                paraSpaceBefore: 10
            });
        }
      }
    });

    await pres.writeFile({ fileName: `${topic.title.replace(/[^a-z0-9]/gi, '_')}.pptx` });
  };

  return (
    <div className="flex flex-col w-full space-y-4">
      <button 
        onClick={slides ? handleDownload : handleGenerate} 
        disabled={isGenerating} 
        className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left group shadow-sm w-full"
      >
        <div className="flex-shrink-0 p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
          {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : slides ? <FileDown className="w-6 h-6" /> : <Presentation className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
            {slides ? "Download PowerPoint Deck" : "Generate Presentation Deck"}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {slides ? "Ready for download! Includes speaker notes." : "Create slides with script & notes."}
          </p>
        </div>
      </button>

      {/* Configuration Panel (Only show if not generated yet) */}
      {!slides && !isGenerating && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
           <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Slide Count</label>
                 <select 
                   value={slideCount} 
                   onChange={(e) => setSlideCount(parseInt(e.target.value))}
                   className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm"
                 >
                    <option value={5}>5 Slides (Brief)</option>
                    <option value={10}>10 Slides (Standard)</option>
                    <option value={15}>15 Slides (Detailed)</option>
                    <option value={20}>20 Slides (Deep Dive)</option>
                 </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tone</label>
                 <select 
                   value={tone} 
                   onChange={(e) => setTone(e.target.value)}
                   className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm"
                 >
                    <option value="Professional">Professional (Business)</option>
                    <option value="Academic">Academic (School)</option>
                    <option value="Engaging">Engaging (Workshop)</option>
                    <option value="Playful">Playful (Kids)</option>
                 </select>
              </div>
           </div>
        </div>
      )}

      {/* Preview Panel */}
      {slides && (
        <div className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-slide-down">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Deck Generated</span>
              <button onClick={() => setSlides(null)} className="text-xs text-slate-500 underline">Reset</button>
           </div>
           <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-black/20">
              {slides.map((s, i) => (
                 <div key={i} className="aspect-video bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 p-2 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slide {i+1}</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">{s.title}</p>
                    <p className="text-[9px] text-slate-500 mt-1">{s.type}</p>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

