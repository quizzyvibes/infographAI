
import React, { useState, useEffect, useRef } from 'react';
import { generateShortsScript, generateShortsImage, generateVoiceover } from '../src/services/geminiService';
import { ShortsScene, Topic } from '../src/types';
import { Film, Loader2, Music, Play, Pause, X, Volume2, VolumeX, Mic, Settings, Download, Minimize2, ExternalLink } from 'lucide-react';

interface ShortsGeneratorProps {
  topic: Topic;
  subject: string;
  level: string;
  onSave: (data: ShortsScene[]) => void;
  onClose: () => void;
  isMinimized?: boolean;
  onMinimize?: (minimized: boolean) => void;
  initialData?: ShortsScene[] | null;
}

type GeneratorPhase = 'setup' | 'generating' | 'ready';
type GenerationStep = 'scripting' | 'imaging' | 'audio';

export const ShortsGenerator: React.FC<ShortsGeneratorProps> = ({ 
  topic, subject, level, onSave, onClose, isMinimized = false, onMinimize, initialData
}) => {
  // --- STATE ---
  const [phase, setPhase] = useState<GeneratorPhase>('setup');
  const [genStep, setGenStep] = useState<GenerationStep>('scripting');
  
  // Config
  const [duration, setDuration] = useState<'60s' | '90s'>('60s');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Data
  const [scenes, setScenes] = useState<ShortsScene[]>([]);
  const [progress, setProgress] = useState(0);

  // Player
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false); 
  
  // Recording State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  
  // Refs
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize from saved data
  useEffect(() => {
    if (initialData && initialData.length > 0) {
       setScenes(initialData);
       setPhase('ready');
    }
  }, [initialData]);

  // --- LOGIC: GENERATION ---

  const handleStartGeneration = async () => {
    setPhase('generating');
    setGenStep('scripting');
    setProgress(5);

    try {
      // 1. Scripting
      const script = await generateShortsScript(topic, subject, level, duration);
      setScenes(script);
      setProgress(25);
      setGenStep('imaging');

      // 2. Assets (Parallel-ish)
      const completeScenes: ShortsScene[] = [];
      for (let i = 0; i < script.length; i++) {
        // Update UI logic to toggle between "Painting" and "Recording" labels for better UX
        setGenStep(i % 2 === 0 ? 'imaging' : 'audio');
        
        const [img, voice] = await Promise.all([
            generateShortsImage(script[i].visualPrompt, aspectRatio).catch(e => {
                console.error("Img fail", e);
                return "https://via.placeholder.com/1080x1920/000000/FFFFFF?text=Visual+Failed"; 
            }),
            generateVoiceover(script[i].voiceScript).catch(e => {
                console.error("Voice fail", e);
                return "";
            })
        ]);

        completeScenes.push({ ...script[i], imageUrl: img, audioUrl: voice });
        setProgress(25 + Math.round(((i + 1) / script.length) * 75));
        
        // Small buffer to prevent API spikes
        await new Promise(r => setTimeout(r, 400));
      }

      setScenes(completeScenes);
      onSave(completeScenes);
      setPhase('ready');
      setIsPlaying(false); 
      if (onMinimize) onMinimize(false); 

    } catch (e) {
      console.error(e);
      alert("Generation failed. Please try again.");
      setPhase('setup');
    }
  };

  // --- LOGIC: PLAYER & SYNC ---

  // Handle Voice Ended -> Next Slide
  const handleVoiceEnded = () => {
     if (currentSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
     } else {
        setIsPlaying(false); // End of video
        setCurrentSceneIndex(0);
     }
  };

  // Effect: Sync Audio & Visuals
  useEffect(() => {
    if (phase !== 'ready' || isRendering) return;

    const music = musicRef.current;
    const voice = voiceRef.current;

    if (isPlaying) {
       // 1. Background Music
       if (music && musicEnabled) {
          music.volume = 0.15; // Background level
          music.play().catch(() => {});
       } else if (music) {
          music.pause();
       }

       // 2. Voiceover (Driver of the slideshow)
       if (voice) {
          const currentAudio = scenes[currentSceneIndex]?.audioUrl;
          if (currentAudio) {
             // Only update src if it changed to prevent reloading
             const currentSrcBlob = voice.src; 
             if (currentSrcBlob !== currentAudio) {
                voice.src = currentAudio;
                voice.load();
             }
             
             voice.onended = handleVoiceEnded;
             voice.play().catch(e => {
                console.warn("Voice play error", e);
                // If voice fails, wait 5s then next (fallback)
                setTimeout(handleVoiceEnded, 5000);
             });
          } else {
             // No audio for this slide? Wait 5s then next
             setTimeout(handleVoiceEnded, 5000);
          }
       }
    } else {
       if (music) music.pause();
       if (voice) voice.pause();
    }
  }, [isPlaying, currentSceneIndex, musicEnabled, phase, isRendering]);

  // --- EXPORT LOGIC (ZIP) ---
  const handleExportMedia = () => {
     if (!scenes.length) return;
     const prefix = topic.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
     
     const scriptContent = scenes.map((s, i) => `Scene ${i+1}\nHeadline: ${s.headline}\nAudio: ${s.voiceScript}\n`).join('\n---\n');
     const blob = new Blob([scriptContent], {type: 'text/plain'});
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${prefix}_script.txt`;
     a.click();

     alert("Downloading assets package (Images + Audio). Please allow multiple downloads if prompted.");

     scenes.forEach((scene, i) => {
        setTimeout(() => {
           if (scene.imageUrl) {
              const link = document.createElement('a');
              link.href = scene.imageUrl;
              link.download = `${prefix}_scene_${i+1}.png`;
              link.click();
           }
           if (scene.audioUrl) {
              const link = document.createElement('a');
              link.href = scene.audioUrl;
              link.download = `${prefix}_scene_${i+1}.wav`;
              link.click();
           }
        }, i * 800);
     });
  };

  // --- EXPORT LOGIC (FULL VIDEO) ---
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
       const stream = canvas.captureStream(30); // 30 FPS
       const combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...dest.stream.getAudioTracks()
       ]);
       
       const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
       const chunks: Blob[] = [];
       recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
       recorder.start();

       // 3. Playback Logic
       let globalTime = 0;
       
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

          // Animate Frame (Simulate playback)
          const startTime = Date.now();
          const sceneDurationMs = duration * 1000;
          
          // We need to block for 'duration' seconds while drawing to canvas
          // To keep UI responsive, we use a small async loop
          while (Date.now() - startTime < sceneDurationMs) {
             const elapsed = Date.now() - startTime;
             const progress = Math.min(elapsed / 15000, 1); // 15s Ken Burns max
             const scale = 1 + (progress * 0.15); // 1.0 -> 1.15
             
             // Draw Ken Burns
             ctx.save();
             ctx.fillStyle = "black";
             ctx.fillRect(0,0, width, height);
             
             // Simple center zoom
             const scaledW = width * scale;
             const scaledH = height * scale;
             const offsetX = (width - scaledW) / 2;
             const offsetY = (height - scaledH) / 2;
             
             if (img.complete) {
                ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
             }

             // Draw Overlays (Text)
             ctx.fillStyle = "rgba(0,0,0,0.3)";
             ctx.fillRect(0, 0, width, height); // Dimmer
             
             // Headline
             ctx.font = `900 ${width/15}px sans-serif`;
             ctx.fillStyle = "white";
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             const words = scene.headline.split(' ');
             // Very crude wrapping for canvas
             let line = '';
             let y = height * 0.8;
             if (width > height) y = height * 0.8; // Landscape
             
             // Just draw headline simply at bottom
             ctx.fillText(scene.headline, width/2, height * 0.7);

             // Subtitles box
             const fontSize = width/25;
             ctx.font = `500 ${fontSize}px sans-serif`;
             const textWidth = ctx.measureText(scene.voiceScript).width;
             if (textWidth > 0) {
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                const padding = 40;
                // Simple box approximation
                ctx.fillRect(20, height * 0.85, width - 40, height * 0.12);
                ctx.fillStyle = "white";
                ctx.fillText(scene.voiceScript.substring(0, 80) + "...", width/2, height * 0.91);
             }

             ctx.restore();

             // Force WebM to grab frames
             // Using await setTimeout to yield to event loop
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
          a.download = `${topic.title.replace(/\s+/g, '_')}_Short.webm`;
          a.click();
          setIsRendering(false);
          alert("Video downloaded!");
       };
       audioCtx.close();

    } catch (e) {
       console.error(e);
       alert("Video rendering failed.");
       setIsRendering(false);
    }
  };

  // --- RENDER HELPERS ---

  if (isMinimized) {
     return null; // The parent (App.tsx) handles the floating badge
  }

  // 1. SETUP VIEW
  if (phase === 'setup') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
         <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full relative shadow-2xl animate-fade-in">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6"/></button>
            
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                  <Film className="w-8 h-8 text-white" />
               </div>
               <h2 className="text-2xl font-bold text-white">Shorts Studio</h2>
               <p className="text-slate-400 text-sm mt-2">Configure your AI video generation.</p>
            </div>

            <div className="space-y-6">
               {/* Duration */}
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Video Duration</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => setDuration('60s')}
                       className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${duration === '60s' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}
                     >
                        60 Seconds
                        <div className="text-[10px] font-normal opacity-70">Concise Overview</div>
                     </button>
                     <button 
                       onClick={() => setDuration('90s')}
                       className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${duration === '90s' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}
                     >
                        90 Seconds
                        <div className="text-[10px] font-normal opacity-70">Deep Dive</div>
                     </button>
                  </div>
               </div>

               {/* Aspect Ratio */}
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Format</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => setAspectRatio('9:16')}
                       className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${aspectRatio === '9:16' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}
                     >
                        Vertical (9:16)
                        <div className="text-[10px] font-normal opacity-70">TikTok / Reels / Shorts</div>
                     </button>
                     <button 
                       onClick={() => setAspectRatio('16:9')}
                       className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${aspectRatio === '16:9' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}
                     >
                        Landscape (16:9)
                        <div className="text-[10px] font-normal opacity-70">YouTube / Presentation</div>
                     </button>
                  </div>
               </div>

               {/* Music Toggle */}
               <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${musicEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {musicEnabled ? <Music className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
                     </div>
                     <span className="text-sm font-bold text-white">Background Music</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={musicEnabled} onChange={e => setMusicEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
               </div>
            </div>

            <button 
               onClick={handleStartGeneration}
               className="w-full mt-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-xl"
            >
               <Loader2 className="w-5 h-5 animate-spin hidden" /> Generate Video
            </button>
         </div>
      </div>
    );
  }

  // 2. GENERATING VIEW (or RENDERING)
  if (phase === 'generating' || isRendering) {
     return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
         <div className="max-w-md w-full text-center relative">
            <div className="mb-8 relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  {isRendering ? <Download className="w-8 h-8 text-indigo-400 animate-bounce"/> : genStep === 'audio' ? <Mic className="w-8 h-8 text-indigo-400 animate-pulse"/> : <Film className="w-8 h-8 text-indigo-400 animate-pulse"/>}
               </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
               {isRendering ? "Rendering Video File..." : genStep === 'scripting' ? 'Writing Script...' : genStep === 'imaging' ? 'Rendering Scenes...' : 'Recording Voiceover...'}
            </h2>
            <p className="text-slate-400 mb-8">
               {isRendering ? `Mixing Audio & Visuals (${renderProgress}%)... Please wait.` : `Creating ${scenes.length > 0 ? `Scene ${Math.ceil(progress/20)} of 5` : 'Script'}`}
            </p>
            
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
               <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${isRendering ? renderProgress : progress}%` }}></div>
            </div>

            {isRendering ? (
               <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Do not close window</div>
            ) : onMinimize && (
               <button 
                  onClick={() => onMinimize(true)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-sm font-bold transition-colors flex items-center gap-2 mx-auto"
               >
                  <Minimize2 className="w-4 h-4" /> Run in Background
               </button>
            )}
         </div>
      </div>
     );
  }

  // 3. READY / PLAYER VIEW
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
       {/* Top Controls */}
       <div className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="p-2 bg-black/40 text-white rounded-full hover:bg-white hover:text-black transition-colors backdrop-blur-md">
             <X className="w-6 h-6" />
          </button>
          
          <div className="flex gap-2">
             <button 
                onClick={handleExportMedia}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transition-colors border border-slate-700"
                title="Download assets (images + audio)"
             >
                <FolderDown className="w-4 h-4" /> Media
             </button>
             <button 
                onClick={handleDownloadVideo}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transition-colors"
                title="Render and download full video"
             >
                <Film className="w-4 h-4" /> Save Video
             </button>
          </div>
       </div>

       {/* Main Player Container */}
       <div 
         className={`relative bg-black shadow-2xl overflow-hidden rounded-xl border border-slate-800 transition-all duration-500
            ${aspectRatio === '9:16' ? 'w-full h-full md:w-[45vh] md:h-[80vh]' : 'w-full aspect-video md:w-[80vw] max-w-6xl'}
         `}
       >
          {/* Audio Elements */}
          {/* Using a reliable MP3 source to ensure playback works */}
          <audio ref={musicRef} src="https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" loop />
          <audio ref={voiceRef} />

          {/* SCENES */}
          {scenes.map((scene, index) => (
             <div 
               key={scene.id}
               className={`absolute inset-0 transition-opacity duration-[500ms] ease-in-out ${index === currentSceneIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
             >
                {/* Visual */}
                <div className={`w-full h-full ${index === currentSceneIndex && isPlaying ? 'animate-ken-burns' : ''}`}>
                   <img src={scene.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                </div>
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />

                {/* TEXT CONTENT - Dual Layer (Headline + Captions) */}
                <div className="absolute inset-0 flex flex-col justify-end pb-24 px-6 md:px-10 text-center">
                   
                   {/* 1. Headline (Visual Anchor) */}
                   <div className="mb-6">
                      <h2 className={`text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-2xl uppercase tracking-tight ${index === currentSceneIndex ? 'animate-slide-up' : ''}`}>
                         {scene.headline}
                      </h2>
                   </div>

                   {/* 2. Captions (Spoken Content) */}
                   <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
                      <p className="text-sm md:text-lg text-white/90 font-medium leading-relaxed font-sans">
                         "{scene.voiceScript}"
                      </p>
                   </div>

                </div>
             </div>
          ))}

          {/* PLAY/PAUSE OVERLAY (When paused) */}
          {!isPlaying && !isRendering && (
             <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
                <button 
                   onClick={() => setIsPlaying(true)}
                   className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                >
                   <Play className="w-8 h-8 text-black fill-current ml-1" />
                </button>
             </div>
          )}

          {/* BOTTOM CONTROLS */}
          <div className="absolute bottom-0 left-0 w-full p-6 z-50 flex items-center justify-between">
             <div className="text-white text-xs font-bold uppercase tracking-widest opacity-80">
                Scene {currentSceneIndex + 1} / {scenes.length}
             </div>
             
             <div className="flex gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 text-white hover:text-indigo-400 transition-colors"
                >
                   {isPlaying ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current"/>}
                </button>
                <button
                   onClick={() => setMusicEnabled(!musicEnabled)}
                   className={`p-2 transition-colors ${musicEnabled ? 'text-white' : 'text-red-400'}`}
                >
                   {musicEnabled ? <Music className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
             </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20 z-50">
             <div 
                className="h-full bg-indigo-500 transition-all duration-300 ease-linear"
                style={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%` }}
             ></div>
          </div>
       </div>

       <style>{`
         @keyframes ken-burns {
           0% { transform: scale(1.0); }
           100% { transform: scale(1.15); }
         }
         .animate-ken-burns {
           animation: ken-burns 15s ease-out forwards;
         }
       `}</style>
    </div>
  );
};

// Simple Icon for Media
const FolderDown = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      <path d="M12 10v6"></path>
      <path d="m15 13-3 3-3-3"></path>
   </svg>
);




