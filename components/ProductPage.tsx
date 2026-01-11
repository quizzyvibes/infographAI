
import React, { useState } from 'react';
import { ShopBundle } from '../src/types';
import { ShoppingCart, Star, ZoomIn, Download, FileText, Image as ImageIcon, Monitor, File, X, Square, ChevronLeft, ChevronRight, Unlock } from 'lucide-react';
import { ImageViewer } from './ImageViewer';

interface ProductPageProps {
  product: ShopBundle;
  onBack: () => void;
  onAddToCart: (product: ShopBundle) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-amber-400 fill-current' : 'text-slate-600'}`} 
        />
      ))}
    </div>
  );
};

export const ProductPage: React.FC<ProductPageProps> = ({ product, onBack, onAddToCart }) => {
  const allImages = [product.thumbnailUrl, ...(product.gallery || [])];
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % allImages.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const renderDigitalBadges = () => (
    <div className="flex flex-wrap gap-2 mt-2 ml-8">
       <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-200 text-xs font-bold rounded border border-red-500/30"><FileText className="w-3 h-3" /> PDF</span>
       <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-200 text-xs font-bold rounded border border-blue-500/30"><ImageIcon className="w-3 h-3" /> PNG</span>
       <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-200 text-xs font-bold rounded border border-purple-500/30"><Monitor className="w-3 h-3" /> 4K</span>
       <span className="flex items-center gap-1 px-2 py-1 bg-slate-500/20 text-slate-200 text-xs font-bold rounded border border-slate-500/30"><File className="w-3 h-3" /> A4 Size</span>
       <span className="flex items-center gap-1 px-2 py-1 bg-slate-500/20 text-slate-200 text-xs font-bold rounded border border-slate-500/30"><File className="w-3 h-3" /> Letter Size</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24 relative animate-fade-in">
      
      {/* FULL SCREEN LIGHTBOX */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-fade-in flex flex-col">
           {/* Top Bar */}
           <div className="absolute top-4 right-4 z-50">
              <button 
                onClick={() => setIsLightboxOpen(false)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
              >
                 <X className="w-8 h-8" />
              </button>
           </div>

           {/* Main Image Area */}
           <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
              <ImageViewer 
                src={allImages[currentIdx]} 
                alt={product.title} 
              />
              
              {/* Navigation Arrows */}
              <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full border border-white/20 z-50 transition-transform active:scale-95"
              >
                 <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full border border-white/20 z-50 transition-transform active:scale-95"
              >
                 <ChevronRight className="w-8 h-8" />
              </button>
           </div>

           {/* Bottom Bar with Exit Button */}
           <div className="h-24 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center pb-6 pt-4 z-50">
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="px-8 py-3 bg-white text-black font-bold rounded-full shadow-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                 <X className="w-5 h-5" /> Exit Zoom
              </button>
           </div>
        </div>
      )}

      {/* Centered Back Button - Reduced vertical padding for compactness on mobile */}
      <div className="flex justify-center py-2 md:py-6">
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-slate-800 text-slate-300 font-bold rounded-full border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors shadow-sm text-sm"
        >
          ← Back to Shop
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mt-2">
        {/* Left: Gallery */}
        <div className="space-y-4">
           {/* Main Image */}
           <div 
             className="relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl cursor-pointer group"
             onClick={() => setIsLightboxOpen(true)}
           >
              <img src={allImages[currentIdx]} alt={product.title} className="w-full h-full object-contain" />
              
              {/* Interaction Hint Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                     <ZoomIn className="w-3 h-3" /> Click to Expand
                 </div>
              </div>

              {/* Navigation Arrows (Always visible on mobile/desktop for ease) */}
              {allImages.length > 1 && (
                 <>
                    <button 
                      onClick={handlePrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 hover:scale-110 transition-all z-20 border border-white/10"
                    >
                       <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 hover:scale-110 transition-all z-20 border border-white/10"
                    >
                       <ChevronRight className="w-6 h-6" />
                    </button>
                 </>
              )}
           </div>
           
           {/* Thumbnail Strip */}
           <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar justify-center lg:justify-start">
              {allImages.map((img, i) => (
                 <button 
                   key={i} 
                   onClick={() => setCurrentIdx(i)}
                   className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentIdx === i ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700 hover:border-slate-500'}`}
                 >
                    <img src={img} className="w-full h-full object-cover" />
                 </button>
              ))}
           </div>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
           {/* Left-Aligned Description Container */}
           <div className="mb-6 text-center lg:text-left">
              {/* Badges - Compact Text & Centered */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                 <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-md text-center min-w-[100px] flex justify-center items-center">{product.subject}</span>
                 <span className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-md text-center min-w-[100px] flex justify-center items-center">{product.level}</span>
              </div>
              
              {/* Title (Centering preserved per request) */}
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4 text-center">{product.title}</h1>
              
              {/* Rating Bar */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                 <StarRating rating={product.rating || 0} />
                 <span className="text-slate-400 text-sm">({product.rating || 0} / 5)</span>
              </div>

              {/* Description - Left Aligned */}
              <p className="text-lg text-slate-400 leading-relaxed text-left">{product.description}</p>
           </div>

           <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8 text-left">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-xl md:text-lg">
                 <Star className="w-6 h-6 md:w-5 md:h-5 text-amber-400 fill-current" /> What's Inside?
              </h3>
              <ul className="space-y-4">
                 {product.features.map((feature, i) => (
                    <li key={i} className="flex flex-col">
                       {/* Aligned Icon Center with Text */}
                       <div className="flex items-start gap-3 text-slate-300">
                          {/* Square Icon with white border */}
                          <div className="flex-shrink-0 mt-[5px] w-4 h-4 border-2 border-white rounded-[1px]"></div>
                          <span className="leading-relaxed">{feature}</span>
                       </div>
                       {feature.toLowerCase().includes("digital download") && renderDigitalBadges()}
                    </li>
                 ))}
              </ul>
           </div>

           {/* Mobile-Fixed / Desktop-Static Footer */}
           <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                 <div className="text-3xl font-bold text-white">${product.price}</div>
                 {product.originalPrice && <div className="text-slate-500 line-through text-sm">was ${product.originalPrice}</div>}
              </div>
              
              {/* Add to Cart Button - Fixed size constraint */}
              <button 
                onClick={() => onAddToCart(product)}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 max-w-sm"
              >
                 <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};






