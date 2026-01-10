
import React from 'react';
import { AppDepartment, AppView } from '../src/types';
import { ArrowRight, Palette, ShoppingBag, GraduationCap } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (dept: AppDepartment, view?: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden pb-32">
      {/* Animated Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
         <div className="absolute top-10 left-10 w-64 h-64 md:w-96 md:h-96 bg-blue-600/30 rounded-full blur-[80px] md:blur-[100px] animate-pulse" />
         <div className="absolute bottom-10 right-10 w-64 h-64 md:w-96 md:h-96 bg-purple-600/30 rounded-full blur-[80px] md:blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 mt-10 md:mt-0">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tight leading-tight md:leading-none">
          Knowledge, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
            Visualized.
          </span>
        </h1>
        <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto font-light px-2">
          The ultimate platform for creating, buying, and learning from educational infographics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16 max-w-5xl mx-auto w-full">
          {/* Create */}
          <div 
            onClick={() => onNavigate(AppDepartment.CREATE, AppView.GENERATOR)}
            className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8 cursor-pointer hover:border-blue-500 transition-all hover:-translate-y-2 overflow-hidden"
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
            className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8 cursor-pointer hover:border-purple-500 transition-all hover:-translate-y-2 overflow-hidden"
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
            className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6 md:p-8 cursor-pointer hover:border-emerald-500 transition-all hover:-translate-y-2 overflow-hidden"
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
  );
};

