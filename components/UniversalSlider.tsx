
import React, { useState, useEffect } from 'react';
import { Slide, SliderGlobalSettings } from '../src/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UniversalSliderProps {
  slides?: Slide[];
  settings?: SliderGlobalSettings;
  className?: string;
}

const DEFAULT_SLIDES: Slide[] = [
  { id: 'd1', type: 'image', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop' },
  { id: 'd2', type: 'image', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2670&auto=format&fit=crop' },
  { id: 'd3', type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }
];

const DEFAULT_SETTINGS: SliderGlobalSettings = {
  height: 'medium',
  duration: 5000,
  fullWidth: true,
  overlayOpacity: 0
};

export const UniversalSlider: React.FC<UniversalSliderProps> = ({ 
  slides = [], 
  settings = DEFAULT_SETTINGS, 
  className = '' 
}) => {
  const activeSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;
  const activeSettings = { ...DEFAULT_SETTINGS, ...settings };
  const [current, setCurrent] = useState(0);

  // Height mapping
  const getHeightClass = (h: string) => {
    switch(h) {
      case 'compact': return 'h-48 md:h-64';
      case 'medium': return 'h-64 md:h-96';
      case 'large': return 'h-96 md:h-[500px]';
      case 'cinematic': return 'h-[60vh] md:h-[70vh]';
      default: return 'h-64 md:h-96';
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % activeSlides.length);
    }, activeSettings.duration);
    return () => clearInterval(timer);
  }, [activeSlides.length, activeSettings.duration]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(prev => (prev + 1) % activeSlides.length);
  };

  return (
    <div className={`relative overflow-hidden group ${className} ${activeSettings.fullWidth ? 'w-full' : 'max-w-7xl mx-auto rounded-2xl shadow-2xl mt-6'}`}>
      <div className={`relative w-full ${getHeightClass(activeSettings.height)}`}>
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {slide.type === 'video' ? (
               <video 
                 src={slide.url} 
                 autoPlay 
                 muted 
                 loop 
                 playsInline 
                 className="w-full h-full object-cover"
               />
            ) : (
               <img 
                 src={slide.url} 
                 alt="Slide" 
                 className="w-full h-full object-cover"
               />
            )}
            {/* Optional Overlay */}
            {activeSettings.overlayOpacity > 0 && (
                <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: activeSettings.overlayOpacity }}></div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
