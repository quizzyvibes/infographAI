
import React, { useState, useEffect } from 'react';
import { Slide, SliderGlobalSettings } from '../src/types';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface UniversalSliderProps {
  slides?: Slide[];
  settings?: SliderGlobalSettings;
  className?: string;
}

const DEFAULT_SLIDES: Slide[] = [
  { id: 'd1', type: 'image', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop', title: "Explore the Universe", subtitle: "Visual knowledge at your fingertips.", textPosition: 'left' },
  { id: 'd2', type: 'image', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2670&auto=format&fit=crop', title: "Create Anything", subtitle: "From science to history in seconds.", textPosition: 'center' },
  { id: 'd3', type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', title: "Deep Dive Learning", subtitle: "Master complex topics visually.", textPosition: 'right' }
];

const DEFAULT_SETTINGS: SliderGlobalSettings = {
  height: 'medium',
  duration: 5000,
  fullWidth: true,
  overlayOpacity: 0.3
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
      case 'cinematic': return 'h-[60vh] md:h-[75vh]';
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
        {activeSlides.map((slide, index) => {
          const isCurrent = index === current;
          const textPosClass = slide.textPosition === 'right' 
             ? 'items-end text-right pr-12 md:pr-24' 
             : slide.textPosition === 'center' 
             ? 'items-center text-center px-4' 
             : 'items-start text-left pl-12 md:pl-24';

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              {/* Media Layer */}
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
                   className="w-full h-full object-cover transform scale-105"
                 />
              )}
              
              {/* Dark Overlay */}
              <div 
                className="absolute inset-0 bg-black transition-opacity duration-500" 
                style={{ opacity: activeSettings.overlayOpacity || 0.3 }}
              ></div>

              {/* Text Content Overlay */}
              {(slide.title || slide.subtitle) && (
                 <div className={`absolute inset-0 flex flex-col justify-center pb-8 ${textPosClass}`}>
                    <div className={`max-w-2xl transform transition-all duration-1000 delay-300 ${isCurrent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                       {slide.title && (
                          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-lg mb-4 leading-tight">
                             {slide.title}
                          </h2>
                       )}
                       {slide.subtitle && (
                          <p className="text-lg md:text-2xl text-slate-100 font-medium drop-shadow-md mb-8 leading-relaxed opacity-90">
                             {slide.subtitle}
                          </p>
                       )}
                       {slide.ctaLabel && (
                          <a 
                            href={slide.ctaLink || '#'} 
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-blue-600/30 transition-all transform hover:-translate-y-1"
                          >
                             {slide.ctaLabel} <ArrowRight className="w-5 h-5" />
                          </a>
                       )}
                    </div>
                 </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === current ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

