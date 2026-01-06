import React, { useEffect, useState } from 'react';

interface LoadingProgressProps {
  duration?: number; // Estimated duration in ms
  label?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({ duration = 8000, label = "Igniting pixels... 🚀" }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min((elapsed / duration) * 100, 95);
      setProgress(rawProgress);
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6">
       <div className="relative w-32 h-32 flex items-center justify-center">
         {/* Background Circle */}
         <svg className="transform -rotate-90 w-full h-full">
           <circle
             cx="64"
             cy="64"
             r={radius}
             stroke="currentColor"
             strokeWidth="8"
             fill="transparent"
             className="text-slate-200 dark:text-slate-800"
           />
           {/* Progress Circle */}
           <circle
             cx="64"
             cy="64"
             r={radius}
             stroke="currentColor"
             strokeWidth="8"
             fill="transparent"
             strokeDasharray={circumference}
             strokeDashoffset={strokeDashoffset}
             strokeLinecap="round"
             className="text-blue-600 transition-all duration-300 ease-linear"
           />
         </svg>
         {/* Text centered: Added pb-1 to correct visual alignment if needed, used flexbox centering */}
         <div className="absolute inset-0 flex items-center justify-center pb-1">
             <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
               {Math.round(progress)}%
             </span>
         </div>
       </div>
       <div className="mt-4 text-center">
         <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">{label}</h3>
         <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Weaving digital magic ✨</p>
       </div>
    </div>
  );
};