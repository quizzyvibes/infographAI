
import React, { useState } from 'react';
import { ShopBundle } from '../src/types';
import { ArrowLeft, ShoppingCart, Check, Star, ZoomIn } from 'lucide-react';

interface ProductPageProps {
  product: ShopBundle;
  onBack: () => void;
  onAddToCart: (product: ShopBundle) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ product, onBack, onAddToCart }) => {
  const [activeImage, setActiveImage] = useState(product.thumbnailUrl);

  const allImages = [product.thumbnailUrl, ...product.gallery];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-24">
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
           <div className="relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
              <img src={activeImage} alt={product.title} className="w-full h-full object-contain" />
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                 <ZoomIn className="w-3 h-3" /> Hover to Zoom
              </div>
           </div>
           
           <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {allImages.map((img, i) => (
                 <button 
                   key={i} 
                   onClick={() => setActiveImage(img)}
                   className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-700 hover:border-slate-500'}`}
                 >
                    <img src={img} className="w-full h-full object-cover" />
                 </button>
              ))}
           </div>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
           <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                 <span className="bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{product.subject}</span>
                 <span className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold">{product.level}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{product.title}</h1>
              <p className="text-lg text-slate-400 leading-relaxed">{product.description}</p>
           </div>

           <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                 <Star className="w-5 h-5 text-amber-400 fill-current" /> What's Inside?
              </h3>
              <ul className="space-y-3">
                 {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                       <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                       <span>{feature}</span>
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
