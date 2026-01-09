
import React, { useState } from 'react';
import { ShopBundle } from '../src/types';
import { analyzeBundleImages } from '../src/services/geminiService';
import { Upload, Wand2, Check, Loader2, Save, X } from 'lucide-react';

interface AdminShopManagerProps {
  onSaveBundle: (bundle: ShopBundle) => void;
}

export const AdminShopManager: React.FC<AdminShopManagerProps> = ({ onSaveBundle }) => {
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [price, setPrice] = useState(9.99);
  const [features, setFeatures] = useState<string[]>([]);

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
      const data = await analyzeBundleImages(images);
      setTitle(data.title);
      setDescription(data.description);
      setSubject(data.subject);
      setLevel(data.level);
      setFeatures(data.features);
    } catch (e) {
      alert("AI Analysis Failed. Please fill manually.");
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublish = () => {
    if (!title || !price || images.length === 0) {
        alert("Please complete the form.");
        return;
    }
    const newBundle: ShopBundle = {
        id: `bundle_${Date.now()}`,
        title,
        description,
        subject,
        level,
        price,
        format: 'Infographics', // Default
        itemCount: images.length,
        thumbnailUrl: images[0],
        gallery: images.slice(1),
        features
    };
    onSaveBundle(newBundle);
    // Reset
    setImages([]);
    setTitle('');
    setDescription('');
    setFeatures([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
       {/* Left: Upload & Preview */}
       <div className="space-y-6">
          <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative group">
             <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
             <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
             <h3 className="text-white font-bold text-lg">Drop Infographics Here</h3>
             <p className="text-slate-400 text-sm">Upload all pages of the bundle to auto-generate details.</p>
          </div>

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
             {analyzing ? "AI Agent Working..." : "Auto-Generate Details"}
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
                   <input key={i} type="text" value={f} onChange={e => {
                      const newF = [...features]; newF[i] = e.target.value; setFeatures(newF);
                   }} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white" />
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
  );
};
