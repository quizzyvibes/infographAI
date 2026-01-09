import React, { useState, useRef, useEffect } from 'react';
import { Topic, ShortsScene } from '../src/types';
import { generateShortsScript, generateShortsImage, generateVoiceover } from '../src/services/geminiService';
import { 
  X, Film, Wand2, Music, Download, Play, Pause, RefreshCw, 
  Image as ImageIcon, Mic, Maximize2, Minimize2, Loader2, CheckCircle 
} from 'lucide-react';

interface ShortsGeneratorProps {
  topic: Topic;
  subject: string;
  level: string;
  onSave: (data: ShortsScene[]) => void;
  onClose: () => void;
  isMinimized: boolean;
  onMinimize: (minimized: boolean) => void;
  initialData?: ShortsScene[] | null;
}

export const ShortsGenerator: React.FC<ShortsGeneratorProps> = ({ 
  topic, subject, level, onSave, onClose, isMinimized, onMinimize, initialData 
}) => {
  // State
  const [scenes, setScenes] = useState<ShortsScene[]>(initialData || []);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [duration, setDuration] = useState<'60s' | '90s'>('60s');
  const [musicEnabled, setMusicEnabled] = useState(true);
  
  const [status, setStatus] = useState<'idle' | 'scripting' | 'imaging' | 'voicing' | 'ready'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  // Playback / Rendering State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const BACKGROUND_MUSIC_URL = "https://actions.google.com/sounds/v1/science_fiction/scifi_drama_theme.ogg";

  useEffect(() => {
    // Determine status from initial data
    if (initialData && initialData.length > 0) {
      if (initialData.every(s => s.imageUrl && s.audioUrl)) {
        setStatus('ready');
      } else {
        setStatus('idle'); // Partial data, maybe treat as idle to allow regen
      }
    }
  }, [initialData]);

  // Initialize Music
  useEffect(() => {
    const audio = new Audio(BACKGROUND_MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.15;
    musicRef.current = audio;
    return () => {
       audio.pause();
       musicRef.current = null;
    };
  }, []);

  const handleGenerateAll = async () => {
    setStatus('scripting');
    setScenes([]);
    try {
        // 1. Script
        const script = await generateShortsScript(topic, subject, level, duration);
        setScenes(script);
        
        // 2. Images
        setStatus('imaging');
        const scenesWithImages = [...script];
        for(let i=0; i<scenesWithImages.length; i++) {
           setProgress({ current: i+1, total: scenesWithImages.length });
           try {
              scenesWithImages[i].imageUrl = await generateShortsImage(scenesWithImages[i].visualPrompt, aspectRatio);
              setScenes([...scenesWithImages]); // Update UI progressively
           } catch(e) { console.error(e); }
        }

        // 3. Audio
        setStatus('voicing');
        const finalScenes = [...scenesWithImages];
        for(let i=0; i<finalScenes.length; i++) {
           setProgress({ current: i+1, total: finalScenes.length });
           try {
              finalScenes[i].audioUrl = await generateVoiceover(finalScenes[i].voiceScript);
              setScenes([...finalScenes]); 
           } catch(e) { console.error(e); }
        }
        
        onSave(finalScenes);
        setStatus('ready');

    } catch (e) {
        console.error(e);
        alert("Generation failed");
        setStatus('idle');
    }
  };

  const handleDownloadVideo = async () => {
    setIsRendering(true);
    setIsPlaying(false);
    setRenderProgress(0);

    const canvas = document.createElement("canvas");
    // Standard Vertical Video or Landscape
    const width = aspectRatio === '16:9' ? 1920 : 1080;
    const height = aspectRatio === '16:9' ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
       alert("Canvas not supported");
       setIsRendering(false);
       return;
    }

    try {
       // 1. Prepare Audio
       const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
       const dest = audioCtx.createMediaStreamDestination();
       
       // Load Background Music Buffer
       let bgBuffer: AudioBuffer | null = null;
       if (musicEnabled && musicRef.current) {
          try {
             const resp = await fetch(musicRef.current.src);
             const arr = await resp.arrayBuffer();
             bgBuffer = await audioCtx.decodeAudioData(arr);
          } catch(e) { console.warn("Music load fail", e); }
       }

       // 2. Prepare Recorder
       // Note: 30FPS stream capture
       const stream = canvas.captureStream(30); 
       const combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...dest.stream.getAudioTracks()
       ]);
       
       const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
       const chunks: Blob[] = [];
       recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
       recorder.start();

       // 3. Playback Logic
       
       // Start BG Music (Looping)
       if (bgBuffer) {
          const src = audioCtx.createBufferSource();
          src.buffer = bgBuffer;
          src.loop = true;
          const gain = audioCtx.createGain();
          gain.gain.value = 0.15; // Low volume
          src.connect(gain);
          gain.connect(dest);
          src.start(0);
       }

       // 4. Render Loop Scene-by-Scene
       for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          setRenderProgress(Math.round((i / scenes.length) * 100));

          // Load Image
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = scene.imageUrl || "";
          await new Promise(r => { img.onload = r; img.onerror = r; });

          // Load Voice
          let voiceBuffer: AudioBuffer | null = null;
          let duration = 6; // default 6s fallback
          if (scene.audioUrl) {
             try {
                const resp = await fetch(scene.audioUrl);
                const arr = await resp.arrayBuffer();
                voiceBuffer = await audioCtx.decodeAudioData(arr);
                duration = voiceBuffer.duration;
             } catch(e) { console.warn("Voice load fail", e); }
          }

          // Play Voice
          if (voiceBuffer) {
             const src = audioCtx.createBufferSource();
             src.buffer = voiceBuffer;
             src.connect(dest);
             src.start(audioCtx.currentTime); // Play "now" in context time
          }

          // --- PRE-CALCULATE TEXT LAYOUT ---
          const safeMargin = width * 0.06; // 6% margin sides
          const bottomPadding = height * 0.12; // Bottom area padding
          const maxWidth = width - (safeMargin * 2);
          
          // A. Measure Captions
          const captionFontSize = Math.floor(width * 0.035); // ~38px on 1080p
          ctx.font = `500 ${captionFontSize}px sans-serif`;
          const captionWords = scene.voiceScript.split(' ');
          let captionLine = '';
          const captionLines: string[] = [];
          for (const word of captionWords) {
              const test = captionLine + word + ' ';
              if (ctx.measureText(test).width > maxWidth - (width * 0.04)) { 
                  captionLines.push(captionLine);
                  captionLine = word + ' ';
              } else {
                  captionLine = test;
              }
          }
          captionLines.push(captionLine);
          
          const captionLineHeight = captionFontSize * 1.4;
          const captionBoxPadding = width * 0.03;
          const captionContentHeight = captionLines.length * captionLineHeight;
          const captionBoxHeight = captionContentHeight + (captionBoxPadding * 2);
          
          // B. Measure Headline
          const headlineFontSize = Math.floor(width * 0.055); // ~60px on 1080p
          ctx.font = `900 ${headlineFontSize}px sans-serif`;
          const headlineWords = scene.headline.toUpperCase().split(' ');
          let headlineLine = '';
          const headlineLines: string[] = [];
          for (const word of headlineWords) {
              const test = headlineLine + word + ' ';
              if (ctx.measureText(test).width > maxWidth) {
                  headlineLines.push(headlineLine);
                  headlineLine = word + ' ';
              } else {
                  headlineLine = test;
              }
          }
          headlineLines.push(headlineLine);
          const headlineLineHeight = headlineFontSize * 1.1;
          
          // C. Calculate Y Positions
          const captionBoxBottom = height - bottomPadding;
          const captionBoxTop = captionBoxBottom - captionBoxHeight;
          
          const gap = height * 0.03; // Gap between headline and captions
          const headlineBottom = captionBoxTop - gap;

          // --- ANIMATION LOOP ---
          const startTime = Date.now();
          const sceneDurationMs = duration * 1000;
          
          // We need to block for 'duration' seconds while drawing to canvas
          while (Date.now() - startTime < sceneDurationMs) {
             const elapsed = Date.now() - startTime;
             const progress = Math.min(elapsed / 15000, 1); // 15s Ken Burns max
             const scale = 1 + (progress * 0.15); // 1.0 -> 1.15
             
             // 1. Draw Ken Burns Image
             ctx.save();
             ctx.fillStyle = "black";
             ctx.fillRect(0,0, width, height);
             
             const scaledW = width * scale;
             const scaledH = height * scale;
             const offsetX = (width - scaledW) / 2;
             const offsetY = (height - scaledH) / 2;
             
             if (img.complete) {
                ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
             }

             // 2. Dimmer Overlay
             ctx.fillStyle = "rgba(0,0,0,0.25)";
             ctx.fillRect(0, 0, width, height);
             // Extra gradient at bottom for readability
             const grad = ctx.createLinearGradient(0, height * 0.5, 0, height);
             grad.addColorStop(0, "transparent");
             grad.addColorStop(1, "rgba(0,0,0,0.8)");
             ctx.fillStyle = grad;
             ctx.fillRect(0, height * 0.5, width, height * 0.5);
             
             // 3. Draw Headline
             ctx.fillStyle = "white";
             ctx.font = `900 ${headlineFontSize}px sans-serif`;
             ctx.textAlign = "center";
             ctx.textBaseline = "bottom";
             ctx.shadowColor = "rgba(0,0,0,0.8)";
             ctx.shadowBlur = width * 0.02; // Soft shadow
             
             let currentHeadlineY = headlineBottom - ((headlineLines.length - 1) * headlineLineHeight);
             for (const line of headlineLines) {
                 ctx.fillText(line.trim(), width / 2, currentHeadlineY);
                 currentHeadlineY += headlineLineHeight;
             }
             
             // 4. Draw Caption Box & Text
             ctx.shadowBlur = 0; // Reset shadow for box
             
             // Box
             const boxX = (width - maxWidth) / 2;
             ctx.fillStyle = "rgba(0,0,0,0.6)"; 
             ctx.fillRect(boxX, captionBoxTop, maxWidth, captionBoxHeight);
             
             // Border
             ctx.strokeStyle = "rgba(255,255,255,0.15)";
             ctx.lineWidth = 2;
             ctx.strokeRect(boxX, captionBoxTop, maxWidth, captionBoxHeight);
             
             // Text
             ctx.fillStyle = "rgba(255,255,255,0.95)";
             ctx.font = `500 ${captionFontSize}px sans-serif`;
             ctx.textAlign = "center";
             ctx.textBaseline = "top";
             
             let currentCaptionY = captionBoxTop + captionBoxPadding;
             for (const line of captionLines) {
                 ctx.fillText(line.trim(), width / 2, currentCaptionY);
                 currentCaptionY += captionLineHeight;
             }

             ctx.restore();

             // Force WebM to grab frames
             await new Promise(r => setTimeout(r, 33)); 
          }
       }

       // Finish
       recorder.stop();
       recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${topic.title.replace(/[^a-z0-9]/gi, '_')}_Short.webm`;
          a.click();
          setIsRendering(false);
       };
       audioCtx.close();

    } catch (e) {
       console.error(e);
       alert("Video rendering failed.");
       setIsRendering(false);
    }
  };

  if (isMinimized) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-zoom-in">
      {/* HEADER */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center">
             <Film className="w-5 h-5 text-white" />
           </div>
           <div>
              <h2 className="font-bold text-white text-lg leading-tight">Shorts Studio</h2>
              <div className="text-xs text-slate-400">{topic.title}</div>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => onMinimize(true)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
              <Minimize2 className="w-5 h-5" />
           </button>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* LEFT PANEL: CONFIG & SCENES */}
         <div className="w-1/3 min-w-[350px] bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800 space-y-4">
               <div className="flex gap-4">
                  <div className="flex-1">
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ratio</label>
                     <select 
                       value={aspectRatio} 
                       onChange={(e) => setAspectRatio(e.target.value as any)}
                       disabled={status !== 'idle'}
                       className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 text-sm"
                     >
                       <option value="9:16">Vertical (9:16)</option>
                       <option value="16:9">Landscape (16:9)</option>
                     </select>
                  </div>
                  <div className="flex-1">
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Duration</label>
                     <select 
                       value={duration} 
                       onChange={(e) => setDuration(e.target.value as any)}
                       disabled={status !== 'idle'}
                       className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 text-sm"
                     >
                       <option value="60s">60 Seconds</option>
                       <option value="90s">90s Deep Dive</option>
                     </select>
                  </div>
               </div>
               
               {status === 'idle' ? (
                  <button 
                    onClick={handleGenerateAll}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-pink-500/25"
                  >
                    <Wand2 className="w-4 h-4" /> Generate Video
                  </button>
               ) : status === 'ready' ? (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-900/20 p-3 rounded-lg border border-emerald-900/50 justify-center">
                     <CheckCircle className="w-5 h-5" /> Video Ready for Render
                  </div>
               ) : (
                  <div className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-3">
                     <Loader2 className="w-4 h-4 animate-spin text-pink-500" /> 
                     {status === 'scripting' && 'Writing Script...'}
                     {status === 'imaging' && `Rendering Frame ${progress.current}/${progress.total}...`}
                     {status === 'voicing' && `Recording Voice ${progress.current}/${progress.total}...`}
                  </div>
               )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
               {scenes.map((scene, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-slate-600 transition-colors flex gap-3 group">
                     <div className="w-16 h-16 bg-slate-900 rounded-lg flex-shrink-0 overflow-hidden relative border border-slate-700">
                        {scene.imageUrl ? (
                           <img src={scene.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-600" />
                           </div>
                        )}
                        <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] px-1">{idx+1}</div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">{scene.headline}</div>
                        <div className="text-xs text-slate-400 line-clamp-2 mt-1">{scene.voiceScript}</div>
                        <div className="flex gap-2 mt-2">
                           {scene.audioUrl && <div className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1"><Mic className="w-3 h-3" /> Voice</div>}
                           {scene.imageUrl && <div className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image</div>}
                        </div>
                     </div>
                  </div>
               ))}
               {scenes.length === 0 && status === 'idle' && (
                  <div className="text-center py-10 text-slate-500 text-sm">
                     Configure settings and click Generate to start.
                  </div>
               )}
            </div>
         </div>

         {/* RIGHT PANEL: PREVIEW */}
         <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative p-8">
            
            {/* Video Container */}
            <div 
               className={`relative bg-black shadow-2xl overflow-hidden border border-slate-800 transition-all duration-500 ${aspectRatio === '9:16' ? 'aspect-[9/16] h-[80vh]' : 'aspect-video w-full max-w-4xl'}`}
            >
               {scenes.length > 0 ? (
                  <>
                     {/* Image Layer */}
                     <img 
                       src={scenes[currentPreviewIndex]?.imageUrl || ""} 
                       className="w-full h-full object-cover"
                     />
                     
                     {/* Overlay Layer */}
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 flex flex-col justify-end p-8 text-center pb-20">
                        <h2 className="text-4xl font-black text-white drop-shadow-xl mb-6 uppercase tracking-tight">{scenes[currentPreviewIndex]?.headline}</h2>
                        <div className="bg-black/60 backdrop-blur-sm border border-white/10 p-4 rounded-xl inline-block mx-auto max-w-md">
                           <p className="text-white font-medium text-lg leading-relaxed">{scenes[currentPreviewIndex]?.voiceScript}</p>
                        </div>
                     </div>

                     {/* Play Controls (Fake Preview) */}
                     {!isRendering && status === 'ready' && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                           <button 
                             onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                             className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
                           >
                              Prev
                           </button>
                           <span className="text-white font-mono flex items-center">{currentPreviewIndex + 1} / {scenes.length}</span>
                           <button 
                             onClick={() => setCurrentPreviewIndex(Math.min(scenes.length - 1, currentPreviewIndex + 1))}
                             className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
                           >
                              Next
                           </button>
                        </div>
                     )}
                  </>
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                     <Film className="w-16 h-16 mb-4 opacity-50" />
                     <p>Preview Area</p>
                  </div>
               )}

               {/* Rendering Overlay */}
               {isRendering && (
                  <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
                     <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                     <h3 className="text-xl font-bold text-white mb-2">Rendering Final Video...</h3>
                     <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${renderProgress}%` }} />
                     </div>
                     <p className="text-slate-400 mt-2 text-sm">{renderProgress}% Complete</p>
                  </div>
               )}
            </div>

            {/* Action Bar */}
            {status === 'ready' && !isRendering && (
               <div className="absolute bottom-8 flex gap-4">
                  <button 
                     onClick={handleDownloadVideo}
                     className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center gap-2"
                  >
                     <Download className="w-5 h-5" /> Download .WebM
                  </button>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};




