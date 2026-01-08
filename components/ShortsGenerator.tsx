
import React, { useState, useEffect, useRef } from 'react';
import { generateShortsScript, generateShortsImage, generateVoiceover } from '../src/services/geminiService';
import { ShortsScene, Topic } from '../src/types';
import { Film, Loader2, Music, Play, Pause, RefreshCw, X, Volume2, VolumeX, Mic } from 'lucide-react';

interface ShortsGeneratorProps {
  topic: Topic;
  subject: string;
  level: string;
  onSave: (data: ShortsScene[]) => void;
  onClose: () => void;
}

type GeneratorStatus = 'idle' | 'scripting' | 'imaging' | 'audio' | 'ready';

export const ShortsGenerator: React.FC<ShortsGeneratorProps> = ({ 
  topic, subject, level, onSave, onClose 
}) => {
  const [status, setStatus] = useState<GeneratorStatus>('idle');
  const [scenes, setScenes] = useState<ShortsScene[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Player State
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  
  // Audio Refs
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Constants
  const SCENE_DURATION = 6000; // 6s per scene visual duration

  // --- GENERATION LOGIC ---

  const handleGenerate = async () => {
    setStatus('scripting');
    setProgress(10);
    
    try {
      // 1. Scripting (Key Concepts)
      const script = await generateShortsScript(topic, subject, level);
      setScenes(script);
      setProgress(30);
      setStatus('imaging');

      // 2. Imaging & Audio Generation Loop
      const completeScenes: ShortsScene[] = [];
      for (let i = 0; i < script.length; i++) {
        // Update status label based on phase
        if (i < Math.floor(script.length / 2)) {
            setStatus('imaging');
        } else {
            setStatus('audio');
        }

        // Parallel-ish Generation: Image + Voice
        // We use Promise.all to speed it up but keep it per-scene to avoid total rate limit blowout
        const [img, voice] = await Promise.all([
            generateShortsImage(script[i].visualPrompt).catch(e => {
                console.error("Img gen failed", e);
                return "https://via.placeholder.com/1080x1920/000000/FFFFFF?text=Visual+Failed";
            }),
            generateVoiceover(script[i].voiceScript).catch(e => {
                console.error("Voice gen failed", e);
                return "";
            })
        ]);

        completeScenes.push({ ...script[i], imageUrl: img, audioUrl: voice });
        setProgress(30 + Math.round(((i + 1) / script.length) * 70));
        
        // Slight buffer
        await new Promise(r => setTimeout(r, 250));
      }

      setScenes(completeScenes);
      onSave(completeScenes);
      setStatus('ready');
      // Auto-start handled by useEffect below

    } catch (e) {
      console.error(e);
      alert("Failed to generate video. Please try again.");
      setStatus('idle');
    }
  };

  // --- PLAYER LOGIC ---

  // Effect: Handle Scene Changes & Audio Playback
  useEffect(() => {
    if (!isPlaying || status !== 'ready') {
       if (musicRef.current) musicRef.current.pause();
       if (voiceRef.current) voiceRef.current.pause();
       clearInterval(timerRef.current);
       return;
    }

    // 1. Play Background Music (if enabled)
    if (musicRef.current) {
        if (isMusicEnabled) {
            musicRef.current.volume = 0.15; // Lower music so voice is clear
            musicRef.current.play().catch(e => console.warn("Music play blocked", e));
        } else {
            musicRef.current.pause();
        }
    }

    // 2. Play Current Scene Voiceover
    const currentScene = scenes[currentSceneIndex];
    if (currentScene?.audioUrl && voiceRef.current) {
        voiceRef.current.src = currentScene.audioUrl;
        voiceRef.current.volume = 1.0;
        voiceRef.current.play().catch(e => console.warn("Voice play blocked", e));
    }

    // 3. Timer for Slide Transition
    // We use a fixed timer to ensure the video pacing stays energetic (6s), 
    // even if the voiceover is slightly shorter or longer.
    timerRef.current = setInterval(() => {
        setCurrentSceneIndex(prev => {
            const next = prev + 1;
            if (next >= scenes.length) {
                setIsPlaying(false);
                clearInterval(timerRef.current);
                return 0; // Reset to start
            }
            return next;
        });
    }, SCENE_DURATION);

    return () => clearInterval(timerRef.current);

  }, [isPlaying, currentSceneIndex, status, isMusicEnabled]); // Re-run when scene changes to trigger new voice track

  // --- RENDER ---

  if (status === 'idle') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
         <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center relative shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6"/></button>
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
               <Film className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Shorts Studio</h2>
            <p className="text-slate-400 mb-8">Generate a 30-second educational vertical video with bright visuals, voiceover, and background music.</p>
            <button onClick={handleGenerate} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
               <Film className="w-5 h-5" /> Generate 5-Scene Short
            </button>
         </div>
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
         <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            {status === 'audio' ? <Mic className="absolute inset-0 m-auto text-indigo-500 w-8 h-8 animate-pulse" /> : <Film className="absolute inset-0 m-auto text-indigo-500 w-8 h-8 animate-pulse" />}
         </div>
         <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
            {status === 'scripting' ? "Extracting Key Facts..." : status === 'imaging' ? "Drawing High-Fidelity Scenes..." : "Recording Voiceover..."}
         </h2>
         <p className="text-slate-500 mb-8">Creating assets for Scene {Math.min(scenes.length + 1, 5)}/5</p>
         <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
       {/* Close Button */}
       <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors">
          <X className="w-6 h-6" />
       </button>

       {/* Mobile Container (9:16 aspect ratio) */}
       <div className="relative w-full h-full md:w-[45vh] md:h-[80vh] bg-black shadow-2xl overflow-hidden rounded-xl border border-slate-800">
          
          {/* Audio Elements */}
          <audio ref={musicRef} src="https://actions.google.com/sounds/v1/ambiences/piano_bar.ogg" loop />
          <audio ref={voiceRef} />

          {/* VISUAL LAYER */}
          {scenes.map((scene, index) => (
             <div 
               key={scene.id}
               className={`absolute inset-0 transition-opacity duration-[800ms] ease-in-out ${index === currentSceneIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
             >
                {/* Image with Ken Burns Effect */}
                <div className={`w-full h-full ${index === currentSceneIndex && isPlaying ? 'animate-ken-burns' : ''}`}>
                   <img src={scene.imageUrl} alt="Background" className="w-full h-full object-cover" />
                </div>
                
                {/* Gradient Overlays for Text Legibility */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none"></div>

                {/* TEXT LAYER - Top and Bottom Split for better visual balance */}
                <div className="absolute top-8 left-0 w-full p-6 text-center">
                   <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white/80 text-xs font-bold uppercase tracking-widest border border-white/20">
                      Fact {index + 1} of 5
                   </span>
                </div>

                <div className="absolute bottom-24 left-0 w-full p-8 text-center flex flex-col items-center">
                   <div className="space-y-4">
                      <p className={`text-2xl md:text-3xl font-bold text-white leading-snug drop-shadow-2xl ${index === currentSceneIndex ? 'animate-slide-up' : ''}`}>
                         {scene.text}
                      </p>
                   </div>
                </div>
             </div>
          ))}

          {/* CONTROLS OVERLAY */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-transparent z-50 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                   {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <div className="text-white text-sm font-bold font-mono drop-shadow-md">
                   {String(currentSceneIndex + 1)} / 5
                </div>
             </div>
             <button 
               onClick={() => setIsMusicEnabled(!isMusicEnabled)}
               className={`p-3 rounded-full backdrop-blur-md transition-all ${isMusicEnabled ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-400'}`}
             >
                {isMusicEnabled ? <Music className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
             </button>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-50">
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
           animation: ken-burns 6s ease-out forwards;
         }
       `}</style>
    </div>
  );
};

