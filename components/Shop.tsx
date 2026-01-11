
import React, { useState, useEffect } from 'react';
import { ShopBundle, LEVELS, SHOP_SUBJECTS } from '../src/types';
import { ShoppingCart, Search, Filter, Eye, Tag, Layers, GraduationCap } from 'lucide-react';

interface ShopProps {
  bundles: ShopBundle[];
  onSelectProduct: (product: ShopBundle) => void;
  onAddToCart: (product: ShopBundle) => void;
}

// --- SUB-COMPONENT FOR INDIVIDUAL CARD LOGIC ---
const ProductCard: React.FC<{ 
  bundle: ShopBundle; 
  onSelect: () => void; 
  onAdd: () => void; 
}> = ({ bundle, onSelect, onAdd }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Combine thumbnail and gallery for the slideshow
  const images = [bundle.thumbnailUrl, ...(bundle.gallery || [])];

  // Slideshow Effect
  useEffect(() => {
    let interval: any;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIdx((prev) => (prev + 1) % images.length);
      }, 1200); // Change slide every 1.2s
    } else {
      setCurrentImageIdx(0); // Reset to thumbnail
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  // Title Truncation (< 40 chars)
  const displayTitle = bundle.title.length > 38 
    ? bundle.title.substring(0, 38) + '...' 
    : bundle.title;

  // Fake Original Price logic (if not provided, assume 30% markup)
  const originalPrice = bundle.originalPrice || (bundle.price * 1.3).toFixed(2);

  return (
    <div 
      className="group bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect} // Allow click to view details on mobile
    >
      {/* 1. Dynamic Preview Thumbnail */}
      <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden cursor-pointer">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
           <img 
             src={images[currentImageIdx]} 
             alt={bundle.title} 
             className="w-full h-full object-cover transition-opacity duration-500" 
           />
        </div>
        
        {/* Overlay Gradient for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

        {/* Hover Indicator */}
        <div className={`absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
           <Layers className="w-3 h-3 text-blue-400" /> Previewing
        </div>
      </div>

      {/* 2. Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between relative bg-slate-800">
        
        {/* Title & Price Section */}
        <div className="mb-6 text-center space-y-3">
           <h3 
             className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-sm h-14 flex items-center justify-center"
             title={bundle.title}
           >
             {displayTitle}
           </h3>

           <div className="flex items-center justify-center gap-3">
              <span className="text-slate-500 line-through text-sm font-semibold">${originalPrice}</span>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1 text-emerald-400 font-extrabold text-lg shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                 ${bundle.price}
              </div>
           </div>
        </div>

        {/* 3. The 4-Button Grid (2 Rows) */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
           {/* Row 1: Info Pills (Visual Only) */}
           <div className="bg-slate-700/50 rounded-xl py-2 px-1 flex flex-col items-center justify-center text-center border border-slate-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Subject</span>
              <span className="text-xs font-bold text-blue-200 truncate w-full px-1">{bundle.subject}</span>
           </div>

           <div className="bg-slate-700/50 rounded-xl py-2 px-1 flex flex-col items-center justify-center text-center border border-slate-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Content</span>
              <span className="text-xs font-bold text-purple-200 truncate w-full px-1">{bundle.itemCount} Items</span>
           </div>

           {/* Row 2: Action Buttons */}
           <button 
             onClick={(e) => { e.stopPropagation(); onSelect(); }}
             className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm"
           >
              <Eye className="w-4 h-4" /> View
           </button>

           <button 
             onClick={(e) => { e.stopPropagation(); onAdd(); }}
             className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 text-sm"
           >
              <ShoppingCart className="w-4 h-4" /> Add
           </button>
        </div>

      </div>
    </div>
  );
};

export const Shop: React.FC<ShopProps> = ({ bundles, onSelectProduct, onAddToCart }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredBundles = bundles.filter(b => {
    if (selectedSubject && b.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
    if (selectedLevel && b.level !== selectedLevel) return false;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesDesc = b.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
    }
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
         {/* Decor */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
         {/* Sidebar Filters */}
         <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div className="sticky top-24">
               <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Filter className="w-4 h-4"/> Filters</h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Subject</label>
                     <select 
                       value={selectedSubject}
                       onChange={(e) => setSelectedSubject(e.target.value)}
                       className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none custom-scrollbar"
                     >
                        <option value="">All Subjects</option>
                        {SHOP_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
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
               </div>
            </div>
         </aside>

         {/* Grid */}
         <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
               <div className="text-slate-400 text-sm">Showing {filteredBundles.length} results</div>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search bundles..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-48 focus:w-64 transition-all" 
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredBundles.map(bundle => (
                  <ProductCard 
                    key={bundle.id} 
                    bundle={bundle} 
                    onSelect={() => onSelectProduct(bundle)} 
                    onAdd={() => onAddToCart(bundle)} 
                  />
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};




