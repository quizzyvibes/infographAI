
import React from 'react';
import { Check, Crown, Zap } from 'lucide-react';

interface PricingProps {
  onUpgrade: (plan: 'free' | 'basic' | 'pro') => void;
  currentPlan: 'free' | 'basic' | 'pro';
}

export const Pricing: React.FC<PricingProps> = ({ onUpgrade, currentPlan }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Unlock Your Creative Potential
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          From curious minds to professional educators, we have a plan that fits your journey.
          Generate visual knowledge at the speed of thought.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Card 1: Explorer */}
        <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-300 rounded-t-3xl" />
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Explorer</h3>
          <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
            Free
            <span className="text-base font-normal text-slate-500 ml-2">/forever</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 min-h-[48px]">
            Perfect for students and casual learners testing the waters.
          </p>
          <button 
            onClick={() => onUpgrade('free')}
            className={`w-full py-3 rounded-xl font-bold mb-8 transition-colors ${currentPlan === 'free' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-default' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800'}`}
          >
            {currentPlan === 'free' ? 'Current Plan' : 'Select Explorer'}
          </button>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> 1K Resolution Images</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> Standard Layout Only</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> 5 Local History Items</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> Basic Summary Generation</li>
          </ul>
        </div>

        {/* Card 2: Scholar */}
        <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border-2 border-blue-500 transform scale-105 z-10">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
            MOST POPULAR
          </div>
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-500 rounded-t-3xl" />
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
            Scholar <Zap className="w-5 h-5 fill-current" />
          </h3>
          <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
            $9.99
            <span className="text-base font-normal text-slate-500 ml-2">/mo</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 min-h-[48px]">
            For serious students and educators needing cloud features.
          </p>
          <button 
             onClick={() => onUpgrade('basic')}
             className={`w-full py-3 rounded-xl font-bold mb-8 transition-all shadow-lg hover:shadow-blue-500/25 ${currentPlan === 'basic' ? 'bg-blue-100 text-blue-600 cursor-default' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02]'}`}
          >
            {currentPlan === 'basic' ? 'Active Plan' : 'Start Trial'}
          </button>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> <strong>Everything in Explorer</strong></li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Unlimited Cloud Storage</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Full Article Generator</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> All Aspect Ratios Unlocked</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-500" /> Portrait & Landscape Modes</li>
          </ul>
        </div>

        {/* Card 3: Visionary */}
        <div className="relative bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 shadow-xl border border-amber-200 dark:border-amber-900/30 hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-3xl" />
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
            Visionary <Crown className="w-5 h-5 fill-current" />
          </h3>
          <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
            $19.99
            <span className="text-base font-normal text-slate-500 ml-2">/mo</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 min-h-[48px]">
            The ultimate suite for content creators and institutions.
          </p>
          <button 
             onClick={() => onUpgrade('pro')}
             className={`w-full py-3 rounded-xl font-bold mb-8 transition-all shadow-lg hover:shadow-amber-500/25 ${currentPlan === 'pro' ? 'bg-amber-100 text-amber-700 cursor-default' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-[1.02]'}`}
          >
            {currentPlan === 'pro' ? 'Active Plan' : 'Go Pro'}
          </button>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-500" /> <strong>Everything in Scholar</strong></li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-500" /> <span className="font-bold text-amber-600 dark:text-amber-400">4K Ultra HD</span> Generation</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-500" /> <span className="font-bold text-amber-600 dark:text-amber-400">Podcast</span> Audio Generation</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-500" /> <span className="font-bold text-amber-600 dark:text-amber-400">QR Code</span> Integration</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-500" /> Mindmap & Flowchart Formats</li>
            <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-500" /> Priority GPU Access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};



