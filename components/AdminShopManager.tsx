
import React, { useState } from 'react';
import { ShopBundle } from '../src/types';
import { analyzeBundleImages, generateMarketingThumbnail } from '../src/services/geminiService';
import { Upload, Wand2, Check, Loader2, Save, X, CheckCircle2, ImagePlus, RefreshCw } from 'lucide-react';

interface AdminShopManagerProps {
  onSaveBundle: (bundle: ShopBundle) => void;
}

export const AdminShopManager: React.FC<AdminShopManagerProps> = ({ onSaveBundle }) => {
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const [recentBundles, setRecentBundles] = useState<ShopBundle[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [price, setPrice] = useState(9.99);
  const [features, setFeatures] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [visualStyle, setVisualStyle] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAutoFill = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    try {
      // 1. Analyze text metadata
      const data = await analyzeBundleImages(images);
      setTitle(data.title);
      setDescription(data.description);
      setSubject(data.subject);
      setLevel(data.level);
      setVisualStyle(data.visualStyle || "");
      
      // Ensure exactly 4 features + Digital Download
      const limitedFeatures = data.features.slice(0, 4);
      setFeatures([...limitedFeatures, "Digital Download"]);

      // 2. Generate Marketing Thumbnail
      await generateAndSetThumbnail(data.title, data.subject, data.description, data.visualStyle);

    } catch (e) {
      alert("AI Analysis Failed. Please fill manually.");
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAndSetThumbnail = async (t: string, s: string, d: string, style: string) => {
      setGeneratingThumb(true);
      try {
        const thumb = await generateMarketingThumbnail(t, s, d, style);
        if (thumb) {
            setThumbnailUrl(thumb);
        } else if (images.length > 0) {
            setThumbnailUrl(images[0]); // Fallback
        }
      } catch (e) {
        console.error(e);
      } finally {
        setGeneratingThumb(false);
      }
  };

  const handleRegenerateThumbnail = () => {
      if (!title) return;
      generateAndSetThumbnail(title, subject, description, visualStyle);
  };

  const handlePublish = () => {
    if (!title || !price || images.length === 0) {
        alert("Please complete the form.");
        return;
    }
    const finalThumbnail = thumbnailUrl || images[0];
    
    const newBundle: ShopBundle = {
        id: `bundle_${Date.now()}`,
        title,
        description,
        subject,
        level,
        price,
        format: 'Infographics', // Default
        itemCount: images.length,
        thumbnailUrl: finalThumbnail,
        gallery: images, // Include all uploaded images in gallery
        features
    };
    onSaveBundle(newBundle);
    setRecentBundles(prev => [newBundle, ...prev]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    
    // Reset
    setImages([]);
    setTitle('');
    setDescription('');
    setFeatures([]);
    setThumbnailUrl('');
    setVisualStyle('');
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {showSuccess && (
         <div className="absolute top-0 left-0 right-0 z-50 flex justify-center animate-slide-down">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5" /> Bundle Published Successfully!
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Left: Upload & Preview */}
         <div className="space-y-6">
            <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative group">
               <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
               <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
               <h3 className="text-white font-bold text-lg">Drop Infographics Here</h3>
               <p className="text-slate-400 text-sm">Upload all pages of the bundle to auto-generate details.</p>
            </div>

            {/* Generated Thumbnail Preview */}
            {(thumbnailUrl || generatingThumb) && (
               <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <ImagePlus className="w-4 h-4" /> Generated Cover Art
                    </h4>
                    <button 
                        onClick={handleRegenerateThumbnail}
                        disabled={generatingThumb}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${generatingThumb ? 'animate-spin' : ''}`} /> Regenerate
                    </button>
                  </div>
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-600 bg-black">
                     {generatingThumb ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                     ) : (
                        <img src={thumbnailUrl} className="w-full h-full object-cover" />
                     )}
                  </div>
                  {visualStyle && <div className="mt-2 text-[10px] text-slate-500 truncate">Style: {visualStyle}</div>}
               </div>
            )}

            {images.length > 0 && (
               <div className="grid grid-cols-4 gap-2">
                  {images.map((img, i) => (
                     <div key={i} className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <X className="w-3 h-3" />
                        </button>
                     </div>
                  ))}
               </div>
            )}

            <button 
              onClick={handleAutoFill}
              disabled={images.length === 0 || analyzing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
               {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
               {analyzing ? "Generating Magic..." : "Auto-Generate Details"}
            </button>
         </div>

         {/* Right: Product Details Form */}
         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="text-white font-bold border-b border-slate-700 pb-4 mb-4">Product Metadata</h3>
            
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
               <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
               <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Level</label>
                  <input type="text" value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" />
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price ($)</label>
               <input type="number" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Features (Bullet Points)</label>
               <div className="space-y-2">
                  {features.map((f, i) => (
                     <div key={i} className="flex gap-2">
                        <input 
                           type="text" 
                           value={f} 
                           onChange={e => {
                              const newF = [...features]; newF[i] = e.target.value; setFeatures(newF);
                           }} 
                           className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white" 
                        />
                        <button onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                     </div>
                  ))}
                  <button onClick={() => setFeatures([...features, ""])} className="text-xs text-blue-400 hover:text-blue-300">+ Add Feature</button>
               </div>
            </div>

            <div className="pt-4">
               <button onClick={handlePublish} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Publish to Shop
               </button>
            </div>
         </div>
      </div>

      {recentBundles.length > 0 && (
         <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-emerald-500" /> Recently Published</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {recentBundles.map(bundle => (
                  <div key={bundle.id} className="flex gap-4 p-3 bg-slate-900 rounded-xl border border-slate-700">
                     <img src={bundle.thumbnailUrl} className="w-16 h-16 rounded object-cover border border-slate-600" />
                     <div>
                        <div className="font-bold text-white text-sm">{bundle.title}</div>
                        <div className="text-xs text-slate-400">${bundle.price} • {bundle.subject}</div>
                        <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Live in Shop</div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};




