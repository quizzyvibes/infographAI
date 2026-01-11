
import React, { useState, useEffect } from 'react';
import { Slide, SliderGlobalSettings } from '../src/types';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface UniversalSliderProps {
  slides?: Slide[];
  settings?: SliderGlobalSettings;
  className?: string;
  isPreview?: boolean; // New prop to handle scaling behavior for previews
}

const DEFAULT_SLIDES: Slide[] = [
  { 
    id: 'd1', 
    type: 'image', 
    // High-tech Earth/Network - Represents Global Knowledge
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop', 
    title: "Instant Clarity", 
    subtitle: "Turn complex text into stunning visual stories in seconds.", 
    textPosition: 'left',
    ctaLabel: "Start Creating",
    ctaLink: "#create"
  },
  { 
    id: 'd2', 
    type: 'image', 
    // Abstract fluid art - Represents Creativity
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop', 
    title: "Knowledge Reimagined", 
    subtitle: "Create professional visual guides for any subject or grade level.", 
    textPosition: 'center',
    ctaLabel: "Explore Shop",
    ctaLink: "#shop"
  },
  { 
    id: 'd3', 
    type: 'image', 
    // Clean geometry/Architecture - Represents Structure
    url: 'https://images.unsplash.com/photo-1495615080073-6b89c9839ce0?q=80&w=2606&auto=format&fit=crop', 
    title: "Design Without Effort", 
    subtitle: "Generate charts, mindmaps, and posters with zero design skills.", 
    textPosition: 'right',
    ctaLabel: "Try Generator",
    ctaLink: "#create"
  }
];

const DEFAULT_SETTINGS: SliderGlobalSettings = {
  height: 'medium',
  duration: 6000,
  fullWidth: true,
  overlayOpacity: 0.4
};

export const UniversalSlider: React.FC<UniversalSliderProps> = ({ 
  slides = [], 
  settings = DEFAULT_SETTINGS, 
  className = '',
  isPreview = false
}) => {
  const activeSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;
  const activeSettings = { ...DEFAULT_SETTINGS, ...settings };
  const [current, setCurrent] = useState(0);

  // Height mapping
  const getHeightClass = (h: string) => {
    // If preview, force full height of parent container (handled by parent flex/grid)
    if (isPreview) return 'h-full absolute inset-0'; 
    
    switch(h) {
      case 'compact': return 'h-48 md:h-64';
      case 'medium': return 'h-64 md:h-96';
      case 'large': return 'h-96 md:h-[500px]';
      case 'cinematic': return 'h-[60vh] md:h-[85vh]';
      default: return 'h-64 md:h-96';
    }
  };

  useEffect(() => {
    if (isPreview) return; // Disable auto-play in preview to avoid distraction
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % activeSlides.length);
    }, activeSettings.duration);
    return () => clearInterval(timer);
  }, [activeSlides.length, activeSettings.duration, isPreview]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(prev => (prev + 1) % activeSlides.length);
  };

  // Helper for font sizes
  const getTitleSize = (size?: string) => {
    // If preview, we scale down significantly to fit the small box
    if (isPreview) {
        switch(size) {
            case 'small': return 'text-xl';
            case 'large': return 'text-3xl';
            case 'xl': return 'text-4xl';
            default: return 'text-2xl'; // medium
        }
    }
    // Normal Sizes
    switch(size) {
        case 'small': return 'text-2xl md:text-4xl';
        case 'large': return 'text-5xl md:text-7xl lg:text-8xl';
        case 'xl': return 'text-6xl md:text-8xl lg:text-9xl';
        default: return 'text-4xl md:text-6xl lg:text-7xl'; // medium
    }
  };

  const getSubtitleSize = (size?: string) => {
    if (isPreview) {
        return 'text-[10px] leading-tight';
    }
    // Normal
    return 'text-lg md:text-2xl';
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
          
          // Preview padding adjustments
          const previewTextPosClass = slide.textPosition === 'right'
             ? 'items-end text-right pr-6'
             : slide.textPosition === 'center'
             ? 'items-center text-center px-4'
             : 'items-start text-left pl-6';

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
                   className={`w-full h-full object-cover transform ${isPreview ? '' : 'scale-105'}`}
                 />
              )}
              
              {/* Dark Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60 transition-opacity duration-500" 
                style={{ opacity: activeSettings.overlayOpacity || 0.4 }}
              ></div>

              {/* Text Content Overlay */}
              {(slide.title || slide.subtitle) && (
                 <div className={`absolute inset-0 flex flex-col justify-center pb-8 ${isPreview ? previewTextPosClass : textPosClass}`}>
                    <div className={`max-w-3xl transform transition-all duration-1000 delay-300 ${isCurrent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                       {slide.title && (
                          <h2 
                            className={`${getTitleSize(slide.fontSize)} font-black text-white drop-shadow-2xl mb-4 leading-tight tracking-tight`}
                            style={{ fontFamily: slide.fontFamily || 'Inter' }}
                          >
                             {slide.title}
                          </h2>
                       )}
                       {slide.subtitle && (
                          <p 
                            className={`${getSubtitleSize(slide.fontSize)} text-slate-100 font-medium drop-shadow-lg mb-8 leading-relaxed opacity-90 max-w-2xl`}
                            style={{ fontFamily: slide.fontFamily || 'Inter' }}
                          >
                             {slide.subtitle}
                          </p>
                       )}
                       {slide.ctaLabel && (
                          <a 
                            href={slide.ctaLink || '#'} 
                            className={`inline-flex items-center gap-2 ${isPreview ? 'px-3 py-1.5 text-xs' : 'px-8 py-4 text-lg'} bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-xl hover:shadow-blue-600/30 transition-all transform hover:-translate-y-1`}
                          >
                             {slide.ctaLabel} <ArrowRight className={isPreview ? "w-3 h-3" : "w-5 h-5"} />
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
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 ${isPreview ? 'p-1' : 'p-3'} bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10`}
          >
            <ChevronLeft className={isPreview ? "w-4 h-4" : "w-6 h-6"} />
          </button>
          <button 
            onClick={handleNext}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 ${isPreview ? 'p-1' : 'p-3'} bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10`}
          >
            <ChevronRight className={isPreview ? "w-4 h-4" : "w-6 h-6"} />
          </button>
        </>
      )}

      {/* Dots */}
      {activeSlides.length > 1 && (
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex ${isPreview ? 'gap-1' : 'gap-3'}`}>
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`rounded-full transition-all duration-300 ${isPreview ? 'h-1' : 'h-1.5'} ${idx === current ? 'bg-white ' + (isPreview ? 'w-4' : 'w-10') : 'bg-white/40 ' + (isPreview ? 'w-1' : 'w-2') + ' hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};


