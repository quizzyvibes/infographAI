
import React from 'react';
import { AppDepartment, AppView } from '../src/types';
import { ArrowRight, Palette, ShoppingBag, GraduationCap } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (dept: AppDepartment, view?: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
         <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight leading-none">
          Knowledge, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
            Visualized.
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light">
          The ultimate platform for creating, buying, and learning from educational infographics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          {/* Create */}
          <div 
            onClick={() => onNavigate(AppDepartment.CREATE, AppView.HOME)}
            className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 cursor-pointer hover:border-blue-500 transition-all hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 text-blue-400 mx-auto group-hover:scale-110 transition-transform">
              <Palette className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Create</h3>
            <p className="text-slate-400 text-sm">Generate AI visuals, flowcharts, and diagrams in seconds.</p>
          </div>

          {/* Shop */}
          <div 
            onClick={() => onNavigate(AppDepartment.SHOP)}
            className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 cursor-pointer hover:border-purple-500 transition-all hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6 text-purple-400 mx-auto group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Shop</h3>
            <p className="text-slate-400 text-sm">Buy curated, high-quality educational bundles.</p>
          </div>

          {/* Learn */}
          <div 
            onClick={() => onNavigate(AppDepartment.LEARN)}
            className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 cursor-pointer hover:border-emerald-500 transition-all hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 mx-auto group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Learn</h3>
            <p className="text-slate-400 text-sm">Explore deep-dive articles powered by infographics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
