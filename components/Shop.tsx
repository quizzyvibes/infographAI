
import React, { useState } from 'react';
import { ShopBundle, LEVELS } from '../src/types';
import { ShoppingCart, Search, Filter, Layers, Layout, Star } from 'lucide-react';

const HOT_SUBJECTS = ["Biology", "Astronomy", "History", "Physics", "Chemistry", "Geography", "Literature"];

const MOCK_BUNDLES: ShopBundle[] = [
  {
    id: '1',
    title: 'The Solar System - Ultimate Pack',
    price: 9.99,
    originalPrice: 15.00,
    subject: 'Astronomy',
    level: 'Grade 4-6',
    format: 'Infographics',
    itemCount: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1614730341194-75c60740a073?w=800&auto=format&fit=crop&q=60',
    gallery: [],
    description: 'Complete visual guide to planets, moons, and asteroids.',
    features: ['12 High-Res PDFs', 'Print Ready', 'Teacher Notes included']
  },
  {
    id: '2',
    title: 'Human Anatomy - Skeletal System',
    price: 12.99,
    subject: 'Biology',
    level: 'High School',
    format: 'Infographics',
    itemCount: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&auto=format&fit=crop&q=60',
    gallery: [],
    description: 'Detailed vector diagrams of the human skeletal system.',
    features: ['Vector SVG Source', '2K Resolution', 'Quiz Included']
  },
  {
    id: '3',
    title: 'World War II - Timeline & Maps',
    price: 14.99,
    originalPrice: 20.00,
    subject: 'History',
    level: 'High School',
    format: 'Mindmaps',
    itemCount: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1550949982-b7b3531b2723?w=800&auto=format&fit=crop&q=60',
    gallery: [],
    description: 'Comprehensive mindmaps covering major events of WWII.',
    features: ['Timeline Flowcharts', 'Strategic Maps', 'Key Figures Profiles']
  },
  {
    id: '4',
    title: 'Photosynthesis & Cellular Respiration',
    price: 4.99,
    subject: 'Biology',
    level: 'Middle School',
    format: 'Infographics',
    itemCount: 4,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&auto=format&fit=crop&q=60',
    gallery: [],
    description: 'Essential biological processes visualized.',
    features: ['Cycle Diagrams', 'Vocabulary Sheet']
  }
];

export const Shop: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

  // Filter Logic
  const filteredBundles = MOCK_BUNDLES.filter(b => {
    if (selectedSubject && b.subject !== selectedSubject) return false;
    if (selectedLevel && b.level !== selectedLevel) return false;
    if (selectedFormat && b.format !== selectedFormat) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-3xl p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white">
               Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">Bundles</span>
            </h1>
            <p className="text-purple-200 text-lg max-w-lg">
               Save time with professionally generated, high-resolution educational packs. Ready to print and present.
            </p>
         </div>
         <div className="relative z-10 mt-8 md:mt-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
               <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">50% OFF</div>
                  <div className="text-xs text-purple-200 uppercase tracking-widest">Teacher's Starter Pack</div>
                  <button className="mt-4 w-full py-2 bg-white text-purple-900 font-bold rounded-lg hover:bg-purple-100 transition-colors">
                     View Deal
                  </button>
               </div>
            </div>
         </div>
         {/* Decor */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
         {/* Sidebar Filters */}
         <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div>
               <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Filter className="w-4 h-4"/> Filters</h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Subject</label>
                     <select 
                       value={selectedSubject}
                       onChange={(e) => setSelectedSubject(e.target.value)}
                       className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                     >
                        <option value="">All Subjects</option>
                        {HOT_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Level</label>
                     <select 
                       value={selectedLevel}
                       onChange={(e) => setSelectedLevel(e.target.value)}
                       className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                     >
                        <option value="">All Levels</option>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Format</label>
                     <select 
                       value={selectedFormat}
                       onChange={(e) => setSelectedFormat(e.target.value)}
                       className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                     >
                        <option value="">All Formats</option>
                        <option value="Infographics">Infographics</option>
                        <option value="Mindmaps">Mindmaps</option>
                     </select>
                  </div>
               </div>
            </div>
         </aside>

         {/* Grid */}
         <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
               <div className="text-slate-400 text-sm">Showing {filteredBundles.length} results</div>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="Search bundles..." className="bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-48 focus:w-64 transition-all" />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredBundles.map(bundle => (
                  <div key={bundle.id} className="group bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:shadow-2xl hover:border-slate-500 transition-all duration-300 flex flex-col">
                     {/* Image Stack Effect */}
                     <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                        <img src={bundle.thumbnailUrl} alt={bundle.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                        <div className="absolute top-2 left-2 flex gap-1">
                           <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">{bundle.subject}</span>
                           <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded">{bundle.itemCount} Items</span>
                        </div>
                     </div>
                     
                     <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-bold text-white leading-tight flex-1 pr-2">{bundle.title}</h3>
                           <div className="flex flex-col items-end">
                              <span className="font-bold text-lg text-emerald-400">${bundle.price}</span>
                              {bundle.originalPrice && <span className="text-xs text-slate-500 line-through">${bundle.originalPrice}</span>}
                           </div>
                        </div>
                        
                        <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{bundle.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                           {bundle.features.slice(0,2).map((f, i) => (
                              <span key={i} className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-1 rounded-full border border-slate-600 flex items-center gap-1">
                                 <Star className="w-2 h-2" /> {f}
                              </span>
                           ))}
                        </div>

                        <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                           <ShoppingCart className="w-4 h-4" /> Add to Cart
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
