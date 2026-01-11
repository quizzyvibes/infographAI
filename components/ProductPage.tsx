
import React, { useState } from 'react';
import { ShopBundle } from '../src/types';
import { ArrowLeft, ShoppingCart, Star, ZoomIn, Download, FileText, Image as ImageIcon, Monitor, File, X, Square } from 'lucide-react';
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
  const [activeImage, setActiveImage] = useState(product.thumbnailUrl);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const allImages = [product.thumbnailUrl, ...(product.gallery || [])];

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
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-24 relative">
      
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm animate-fade-in flex flex-col">
           <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 text-white/50 hover:text-white z-50 p-2">
              <X className="w-8 h-8" />
           </button>
           <ImageViewer src={lightboxImage} alt={product.title} />
        </div>
      )}

      {/* Breadcrumb / Back */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 font-bold mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Shop
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div className="space-y-4">
           <div 
             className="relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl cursor-pointer"
             onClick={() => setLightboxImage(activeImage)}
           >
              <img src={activeImage} alt={product.title} className="w-full h-full object-contain" />
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                 <ZoomIn className="w-3 h-3" /> Click to Zoom
              </div>
           </div>
           
           <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {allImages.map((img, i) => (
                 <button 
                   key={i} 
                   onClick={() => setActiveImage(img)}
                   className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700 hover:border-slate-500'}`}
                 >
                    <img src={img} className="w-full h-full object-cover" />
                 </button>
              ))}
           </div>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
           <div className="mb-6">
              {/* Badges - Larger & Colored */}
              <div className="flex items-center gap-3 mb-6">
                 <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-md">{product.subject}</span>
                 <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-md">{product.level}</span>
              </div>
              
              {/* Title - Reduced Size */}
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4">{product.title}</h1>
              
              {/* Rating Bar */}
              <div className="flex items-center gap-3 mb-4">
                 <StarRating rating={product.rating || 0} />
                 <span className="text-slate-400 text-sm">({product.rating || 0} / 5)</span>
              </div>

              <p className="text-lg text-slate-400 leading-relaxed">{product.description}</p>
           </div>

           <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                 <Star className="w-5 h-5 text-amber-400 fill-current" /> What's Inside?
              </h3>
              <ul className="space-y-4">
                 {product.features.map((feature, i) => (
                    <li key={i} className="flex flex-col">
                       <div className="flex items-start gap-3 text-slate-300">
                          {/* Square Icon with white border */}
                          <div className="flex-shrink-0 mt-1 w-4 h-4 border-2 border-white rounded-[1px]"></div>
                          <span>{feature}</span>
                       </div>
                       {feature.toLowerCase().includes("digital download") && renderDigitalBadges()}
                    </li>
                 ))}
              </ul>
           </div>

           <div className="mt-auto pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                 <div className="text-3xl font-bold text-white">${product.price}</div>
                 {product.originalPrice && <div className="text-slate-500 line-through text-sm">was ${product.originalPrice}</div>}
              </div>
              <button 
                onClick={() => onAddToCart(product)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-3 transform hover:-translate-y-1"
              >
                 <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};



