
import React, { useState, useEffect, useRef } from 'react';
import { generateShortsScript, generateShortsImage } from '../src/services/geminiService';
import { ShortsScene, Topic } from '../src/types';
import { Film, Loader2, Music, Play, Pause, RefreshCw, X } from 'lucide-react';

interface ShortsGeneratorProps {
  topic: Topic;
  subject: string;
  level: string;
  onSave: (data: ShortsScene[]) => void;
  onClose: () => void;
}

type GeneratorStatus = 'idle' | 'scripting' | 'imaging' | 'ready';

export const ShortsGenerator: React.FC<ShortsGeneratorProps> = ({ 
  topic, subject, level, onSave, onClose 
}) => {
  const [status, setStatus] = useState<GeneratorStatus>('idle');
  const [scenes, setScenes] = useState<ShortsScene[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Player State
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Constants
  const SCENE_DURATION = 6000; // 6s per scene
  const TOTAL_DURATION = 30000; // 30s total

  // --- GENERATION LOGIC ---

  const handleGenerate = async () => {
    setStatus('scripting');
    setProgress(10);
    
    try {
      // 1. Scripting
      const script = await generateShortsScript(topic, subject, level);
      setScenes(script);
      setProgress(30);
      setStatus('imaging');

      // 2. Imaging (Sequential to manage rate limits)
      const completeScenes: ShortsScene[] = [];
      for (let i = 0; i < script.length; i++) {
        setProgress(30 + Math.round(((i + 1) / script.length) * 60));
        try {
           const img = await generateShortsImage(script[i].visualPrompt);
           completeScenes.push({ ...script[i], imageUrl: img });
        } catch (e) {
           console.error("Image gen failed for scene " + i);
           // Use a placeholder if fails, to not break the whole video
           completeScenes.push({ ...script[i], imageUrl: "https://via.placeholder.com/1080x1920/000000/FFFFFF?text=Visual+Generation+Failed" });
        }
        await new Promise(r => setTimeout(r, 500)); // Rate limit buffer
      }

      setScenes(completeScenes);
      onSave(completeScenes);
      setStatus('ready');
      setIsPlaying(true); // Auto-play when ready

    } catch (e) {
      console.error(e);
      alert("Failed to generate video. Please try again.");
      setStatus('idle');
    }
  };

  // --- PLAYER LOGIC ---

  useEffect(() => {
    if (isPlaying && status === 'ready') {
      audioRef.current?.play().catch(e => console.warn("Autoplay blocked", e));
      
      const startTime = Date.now() - (currentSceneIndex * SCENE_DURATION);
      
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const nextIndex = Math.floor(elapsed / SCENE_DURATION);
        
        if (nextIndex >= scenes.length) {
           setIsPlaying(false);
           setCurrentSceneIndex(0);
           clearInterval(timerRef.current);
        } else if (nextIndex !== currentSceneIndex) {
           setCurrentSceneIndex(nextIndex);
        }
      }, 100);
    } else {
      audioRef.current?.pause();
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, status, scenes.length]); // Intentionally omitting currentSceneIndex to avoid re-triggering

  // --- RENDER ---

  if (status === 'idle') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
         <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6"/></button>
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
               <Film className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Shorts Studio</h2>
            <p className="text-slate-400 mb-8">Generate a 30-second cinematic vertical video with poetic lyrics and stunning minimalist art.</p>
            <button onClick={handleGenerate} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
               <Film className="w-5 h-5" /> Generate Video
            </button>
         </div>
      </div>
    );
  }

  if (status === 'scripting' || status === 'imaging') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
         <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <Film className="absolute inset-0 m-auto text-indigo-500 w-8 h-8 animate-pulse" />
         </div>
         <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
            {status === 'scripting' ? "Writing Visual Poem..." : `Directing Scene ${Math.min(scenes.length + 1, 5)}/5...`}
         </h2>
         <p className="text-slate-500 mb-8">Creating high-resolution minimalist assets</p>
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
          
          {/* Audio Element */}
          {/* Royalty-free piano ambient loop */}
          <audio ref={audioRef} src="https://actions.google.com/sounds/v1/ambiences/piano_bar.ogg" loop />

          {/* VISUAL LAYER */}
          {scenes.map((scene, index) => (
             <div 
               key={scene.id}
               className={`absolute inset-0 transition-opacity duration-[1000ms] ease-in-out ${index === currentSceneIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
             >
                {/* Image with Ken Burns Effect */}
                <div className={`w-full h-full ${index === currentSceneIndex && isPlaying ? 'animate-ken-burns' : ''}`}>
                   <img src={scene.imageUrl} alt="Background" className="w-full h-full object-cover" />
                </div>
                
                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-black/40"></div>

                {/* TEXT LAYER */}
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                   <div className="space-y-4">
                      {/* Split text into words for stagger effect if desired, but here simpler block fade up is elegant */}
                      <p className={`text-3xl md:text-4xl font-serif text-white font-bold leading-relaxed drop-shadow-2xl ${index === currentSceneIndex ? 'animate-fade-in-up' : ''}`}>
                         {scene.text}
                      </p>
                   </div>
                </div>
             </div>
          ))}

          {/* CONTROLS OVERLAY */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent z-50 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                   {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <div className="text-white text-sm font-bold font-mono">
                   00:{String((currentSceneIndex * 6)).padStart(2, '0')} / 00:30
                </div>
             </div>
             <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-white/70 animate-pulse" />
             </div>
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
         @keyframes fade-in-up {
           0% { opacity: 0; transform: translateY(20px); }
           100% { opacity: 1; transform: translateY(0); }
         }
         .animate-fade-in-up {
           animation: fade-in-up 1.5s ease-out forwards;
         }
       `}</style>
    </div>
  );
};
