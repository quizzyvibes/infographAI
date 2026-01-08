
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
}

type GeneratorPhase = 'setup' | 'generating' | 'ready';
type GenerationStep = 'scripting' | 'imaging' | 'audio';

export const ShortsGenerator: React.FC<ShortsGeneratorProps> = ({ 
  topic, subject, level, onSave, onClose, isMinimized = false, onMinimize
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
  const [isUserPaused, setIsUserPaused] = useState(false); // Distinction between auto-pause (buffering) and user pause
  
  // Refs
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const audioContextInitialized = useRef(false);

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
      setIsPlaying(false); // Don't auto-play immediately to allow user to settle
      if (onMinimize) onMinimize(false); // Maximize if it was minimized

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
    if (phase !== 'ready') return;

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
  }, [isPlaying, currentSceneIndex, musicEnabled, phase]);

  // --- EXPORT LOGIC ---
  const handleExport = () => {
     // Create a ZIP-like experience by downloading assets sequentially
     if (!scenes.length) return;
     
     const prefix = topic.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
     
     // 1. Download Script
     const scriptContent = scenes.map((s, i) => `Scene ${i+1}\nHeadline: ${s.headline}\nAudio: ${s.voiceScript}\n`).join('\n---\n');
     const blob = new Blob([scriptContent], {type: 'text/plain'});
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${prefix}_script.txt`;
     a.click();

     // 2. Alert user about assets
     alert("Downloading assets package (Images + Audio). Please allow multiple downloads if prompted.");

     // 3. Download Assets (Staggered to prevent browser blocking)
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

  // 2. GENERATING VIEW
  if (phase === 'generating') {
     return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
         <div className="max-w-md w-full text-center relative">
            <div className="mb-8 relative w-24 h-24 mx-auto">
               <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  {genStep === 'audio' ? <Mic className="w-8 h-8 text-indigo-400 animate-pulse"/> : <Film className="w-8 h-8 text-indigo-400 animate-pulse"/>}
               </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
               {genStep === 'scripting' ? 'Writing Script...' : genStep === 'imaging' ? 'Rendering Scenes...' : 'Recording Voiceover...'}
            </h2>
            <p className="text-slate-400 mb-8">Creating {scenes.length > 0 ? `Scene ${Math.ceil(progress/20)} of 5` : 'Script'}</p>
            
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
               <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
            </div>

            {onMinimize && (
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
          
          <button 
             onClick={handleExport}
             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transition-colors"
          >
             <Download className="w-4 h-4" /> Export Media
          </button>
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
          {!isPlaying && (
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



