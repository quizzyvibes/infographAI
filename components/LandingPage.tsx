
import React from 'react';
import { AppDepartment, AppView, Slide, SliderGlobalSettings } from '../src/types';
import { Palette, ShoppingBag, GraduationCap } from 'lucide-react';
import { UniversalSlider } from './UniversalSlider';

interface LandingPageProps {
  onNavigate: (dept: AppDepartment, view?: AppView) => void;
  slides?: Slide[];
  sliderSettings?: SliderGlobalSettings;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, slides, sliderSettings }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col animate-fade-in relative overflow-hidden pb-32">
      
      {/* Slider Hero */}
      <div className="absolute top-0 left-0 w-full z-0 opacity-60">
         <UniversalSlider 
            slides={slides} 
            settings={sliderSettings ? { ...sliderSettings, height: 'cinematic', fullWidth: true } : undefined} 
            className="mask-image-gradient-bottom"
         />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center mt-32 md:mt-48">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-4">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tight leading-tight md:leading-none drop-shadow-2xl">
            Knowledge, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
              Visualized.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-200 max-w-2xl mx-auto font-light drop-shadow-md">
            The ultimate platform for creating, buying, and learning from educational infographics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16 max-w-5xl mx-auto w-full">
            {/* Create */}
            <div 
              onClick={() => onNavigate(AppDepartment.CREATE, AppView.GENERATOR)}
              className="group relative bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8 cursor-pointer hover:border-blue-500 transition-all hover:-translate-y-2 overflow-hidden shadow-xl"
            >
              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-900/50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-blue-400 mx-auto group-hover:scale-110 transition-transform">
                <Palette className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Create</h3>
              <p className="text-slate-400 text-sm">Generate AI visuals, flowcharts, and diagrams in seconds.</p>
            </div>

            {/* Shop */}
            <div 
              onClick={() => onNavigate(AppDepartment.SHOP)}
              className="group relative bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8 cursor-pointer hover:border-purple-500 transition-all hover:-translate-y-2 overflow-hidden shadow-xl"
            >
              <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-900/50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-purple-400 mx-auto group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Shop</h3>
              <p className="text-slate-400 text-sm">Buy curated, high-quality educational bundles.</p>
            </div>

            {/* Learn */}
            <div 
              onClick={() => onNavigate(AppDepartment.LEARN)}
              className="group relative bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8 cursor-pointer hover:border-emerald-500 transition-all hover:-translate-y-2 overflow-hidden shadow-xl"
            >
              <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-emerald-400 mx-auto group-hover:scale-110 transition-transform">
                <GraduationCap className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Learn</h3>
              <p className="text-slate-400 text-sm">Explore deep-dive articles powered by infographics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
