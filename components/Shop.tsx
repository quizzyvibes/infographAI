
import React, { useState, useEffect } from 'react';
import { ShopBundle, LEVELS, SHOP_SUBJECTS, Slide, SliderGlobalSettings } from '../src/types';
import { ShoppingCart, Search, Filter, Eye, Tag, Layers, GraduationCap, Star, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageViewer } from './ImageViewer';
import { UniversalSlider } from './UniversalSlider';

interface ShopProps {
  bundles: ShopBundle[];
  onSelectProduct: (product: ShopBundle) => void;
  onAddToCart: (product: ShopBundle) => void;
  slides?: Slide[];
  sliderSettings?: SliderGlobalSettings;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-amber-400 fill-current' : 'text-slate-600'}`} 
        />
      ))}
    </div>
  );
};

// ... ProductCard component remains exactly same as before ...
// Re-implementing ProductCard inline to ensure full file validity
const ProductCard: React.FC<{ 
  bundle: ShopBundle; 
  onSelect: () => void; 
  onAdd: () => void;
  onZoom: (idx: number) => void;
}> = ({ bundle, onSelect, onAdd, onZoom }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const images = [bundle.thumbnailUrl, ...(bundle.gallery || [])];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleZoomClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onZoom(currentImageIdx);
  };

  const displayTitle = bundle.title;
  const originalPrice = bundle.originalPrice || (bundle.price * 1.3).toFixed(2);

  return (
    <div 
      className="group bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div 
        className="relative aspect-[4/3] bg-slate-900 overflow-hidden cursor-pointer"
        onClick={handleZoomClick}
      >
        <div className="absolute inset-0">
           <img 
             src={images[currentImageIdx]} 
             alt={bundle.title} 
             className="w-full h-full object-cover transition-opacity duration-300" 
           />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        <div className={`absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
           <ZoomIn className="w-3 h-3 text-blue-400" /> Zoom
        </div>
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-all z-20 border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-all z-20 border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between relative bg-slate-800">
        <div className="mb-6 text-center flex flex-col gap-3">
           <div className="flex justify-center"><StarRating rating={bundle.rating || 0} /></div>
           <h3 className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-sm flex items-center justify-center min-h-[3.5rem]" title={bundle.title}>{displayTitle}</h3>
           <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-slate-500 line-through text-sm font-semibold">${originalPrice}</span>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1 text-emerald-400 font-extrabold text-lg shadow-[0_0_10px_rgba(16,185,129,0.2)]">${bundle.price}</div>
           </div>
           <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed min-h-[2.5em] mt-1">{bundle.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-auto">
           <div className="bg-slate-700/50 rounded-xl py-2 px-1 flex flex-col items-center justify-center text-center border border-slate-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Subject</span>
              <span className="text-xs font-bold text-blue-200 truncate w-full px-1">{bundle.subject}</span>
           </div>
           <div className="bg-slate-700/50 rounded-xl py-2 px-1 flex flex-col items-center justify-center text-center border border-slate-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Content</span>
              <span className="text-xs font-bold text-purple-200 truncate w-full px-1">{bundle.itemCount} Items</span>
           </div>
           <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm"><Eye className="w-4 h-4" /> View</button>
           <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 text-sm"><ShoppingCart className="w-4 h-4" /> Add</button>
        </div>
      </div>
    </div>
  );
};

export const Shop: React.FC<ShopProps> = ({ bundles, onSelectProduct, onAddToCart, slides, sliderSettings }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxBundle, setLightboxBundle] = useState<ShopBundle | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleOpenLightbox = (bundle: ShopBundle, idx: number) => {
    setLightboxBundle(bundle);
    setLightboxIndex(idx);
  };

  const handleLightboxNext = () => {
    if (!lightboxBundle) return;
    const images = [lightboxBundle.thumbnailUrl, ...(lightboxBundle.gallery || [])];
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const handleLightboxPrev = () => {
    if (!lightboxBundle) return;
    const images = [lightboxBundle.thumbnailUrl, ...(lightboxBundle.gallery || [])];
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const filteredBundles = bundles.filter(b => {
    if (selectedSubject && b.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
    if (selectedLevel && b.level !== selectedLevel) return false;
    if (selectedFormat && b.format !== selectedFormat) return false;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesDesc = b.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
    }
    return true;
  });

  return (
    <div className="w-full animate-fade-in relative">
      {/* Slider Replaces Hero Banner */}
      <div className="mb-12">
         <UniversalSlider slides={slides} settings={sliderSettings} />
      </div>

      {/* LIGHTBOX */}
      {lightboxBundle && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-fade-in flex flex-col">
           <div className="absolute top-4 right-4 z-50">
              <button onClick={() => setLightboxBundle(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
           </div>
           <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
              <ImageViewer src={[lightboxBundle.thumbnailUrl, ...(lightboxBundle.gallery || [])][lightboxIndex]} alt={lightboxBundle.title} />
              <button onClick={(e) => { e.stopPropagation(); handleLightboxPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full border border-white/20 z-50 transition-transform active:scale-95"><ChevronLeft className="w-8 h-8" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleLightboxNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full border border-white/20 z-50 transition-transform active:scale-95"><ChevronRight className="w-8 h-8" /></button>
           </div>
           <div className="h-24 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center pb-6 pt-4 z-50">
              <button onClick={() => setLightboxBundle(null)} className="px-8 py-3 bg-white text-black font-bold rounded-full shadow-lg hover:bg-slate-200 transition-colors flex items-center gap-2"><X className="w-5 h-5" /> Exit Zoom</button>
           </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8 pb-24">
         <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div className="sticky top-24">
               <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Filter className="w-4 h-4"/> Filters</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Format</label>
                     <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none">
                        <option value="">All Formats</option>
                        <option value="Infographics">Infographics</option>
                        <option value="Mindmaps">Mindmaps</option>
                        <option value="Flowcharts">Flowcharts</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Subject</label>
                     <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none custom-scrollbar">
                        <option value="">All Subjects</option>
                        {SHOP_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Level</label>
                     <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none">
                        <option value="">All Levels</option>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                  </div>
               </div>
            </div>
         </aside>

         <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
               <div className="text-slate-400 text-sm">Showing {filteredBundles.length} results</div>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="Search bundles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-48 focus:w-64 transition-all" />
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredBundles.map(bundle => (
                  <ProductCard key={bundle.id} bundle={bundle} onSelect={() => onSelectProduct(bundle)} onAdd={() => onAddToCart(bundle)} onZoom={(idx) => handleOpenLightbox(bundle, idx)} />
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};










