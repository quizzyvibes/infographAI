
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Image as ImageIcon, BrainCircuit, Activity, 
  Search, ShieldAlert, Trash2, Ban, Save, RefreshCw, 
  Terminal, Server, Lock, Globe, AlertTriangle, Cpu, ToggleLeft, ToggleRight, ShoppingBag, CheckCircle2,
  FileText, Film, Mic, Play, MonitorPlay, Plus, Upload, X, Zap
} from 'lucide-react';
import { HistoryItem, ShopBundle, SystemConfig, Slide, SliderGlobalSettings } from '../src/types';
import { getSystemConfig, saveSystemConfig, getAllUsers, toggleUserBan, uploadImageToStorage } from '../src/services/dbService';
import { AdminShopManager } from './AdminShopManager';

interface AdminPanelProps {
  onExit: () => void;
  onSaveShopBundle?: (bundle: ShopBundle) => void;
}

type Tab = 'site-performance' | 'users' | 'content' | 'ai-config' | 'system' | 'shop-manager' | 'slider-config';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit, onSaveShopBundle }) => {
  const [activeTab, setActiveTab] = useState<Tab>('site-performance');
  
  // Real State for AI Config
  const [systemPrompt, setSystemPrompt] = useState('');
  const [thumbnailSystemPrompt, setThumbnailSystemPrompt] = useState('');
  const [articleSystemPrompt, setArticleSystemPrompt] = useState('');
  const [visualDeckSystemPrompt, setVisualDeckSystemPrompt] = useState('');
  const [quizSystemPrompt, setQuizSystemPrompt] = useState('');
  const [shortsSystemPrompt, setShortsSystemPrompt] = useState('');
  const [podcastSystemPrompt, setPodcastSystemPrompt] = useState('');
  
  const [activePromptTab, setActivePromptTab] = useState('core'); // Internal tab for AI Config

  const [temperature, setTemperature] = useState(0.7);
  const [safetyThreshold, setSafetyThreshold] = useState('BLOCK_ONLY_HIGH');
  const [modelType, setModelType] = useState('gemini-3-pro-image-preview');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Slider State
  const [sliderSettings, setSliderSettings] = useState<SliderGlobalSettings>({
    height: 'medium',
    duration: 5000,
    fullWidth: true,
    overlayOpacity: 0
  });
  const [sliders, setSliders] = useState<SystemConfig['sliders']>({
    landing: [],
    create: [],
    shop: [],
    learn: []
  });
  const [uploadingSlide, setUploadingSlide] = useState(false);
  
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // --- DEFAULTS ---
  const DEFAULT_PROMPT = `
    You are an expert Art Director for educational infographics.
    Write a single, highly detailed image generation prompt for a text-to-image model.
    
    DESIGN STYLE: High-end, vector-art educational infographic. 
    Flat design, clean lines, vibrant but professional color palette (Deep Blue, Teal, Gold, Soft White).
    Typography should be legible, sans-serif, and hierarchical (Headings, Subheadings, Body).
    Avoid photorealism; prefer stylized, clear, and explanatory scientific illustration.
    White background or very light neutral background for clarity.
    
    VISUAL HIERARCHY:
    1. Title: Large, bold, at the top.
    2. Central Visual: The main concept illustrated clearly in the center.
    3. Data Points: Surrounding stats, charts, or bullet points.
    4. Flow: Eye should move logically from top-left to bottom-right (or center-out).
    
    INSTRUCTIONS:
    - Describe the layout specifically (Mindmap, Flowchart, or Standard).
    - Include specific text labels found in the source material.
    - Ensure margins are clear if specified.
    - Output raw prompt text only.
  `.trim();

  const DEFAULT_THUMBNAIL_PROMPT = `
    CRITICAL VISUAL REQUIREMENT:
    - **FULLY COLORED BACKGROUND**: The entire image must have a rich, vibrant background color (Deep Blue, Purple, Emerald, or Dark Space). No white or plain grey backgrounds.
    - **HIGH CONTRAST & SATURATION**: The colors must pop. Use high saturation and strong lighting contrast to grab attention immediately.
    - **CENTERPIECE**: An abstract, 3D glossy composition representing the subject matter in the center.
    - Do NOT look like a flat document scan. Look like a premium 3D software box or high-budget course header.
    - Clean, modern, professional.
    - NO TEXT IN IMAGE.
  `.trim();

  // Re-declaring for completeness
  const DEFAULT_ARTICLE_PROMPT = `Act as an engaging, expert teacher giving a masterclass...`;
  const DEFAULT_DECK_PROMPT = `Act as an expert educational content creator...`;
  const DEFAULT_QUIZ_PROMPT = `Generate 10 multiple choice questions...`;
  const DEFAULT_SHORTS_PROMPT = `Analyze the topic provided by the user...`;
  const DEFAULT_PODCAST_PROMPT = `Create a podcast script between two hosts...`;

  useEffect(() => {
     if (activeTab === 'ai-config' || activeTab === 'slider-config') {
       loadConfig();
     }
     if (activeTab === 'users') {
       loadUsers();
     }
  }, [activeTab]);

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const config = await getSystemConfig();
      if (config) {
        setSystemPrompt(config.systemPrompt || DEFAULT_PROMPT);
        setThumbnailSystemPrompt(config.thumbnailSystemPrompt || DEFAULT_THUMBNAIL_PROMPT);
        setArticleSystemPrompt(config.articleSystemPrompt || DEFAULT_ARTICLE_PROMPT);
        setVisualDeckSystemPrompt(config.visualDeckSystemPrompt || DEFAULT_DECK_PROMPT);
        setQuizSystemPrompt(config.quizSystemPrompt || DEFAULT_QUIZ_PROMPT);
        setShortsSystemPrompt(config.shortsSystemPrompt || DEFAULT_SHORTS_PROMPT);
        setPodcastSystemPrompt(config.podcastSystemPrompt || DEFAULT_PODCAST_PROMPT);

        setTemperature(config.temperature ?? 0.7);
        setSafetyThreshold(config.safetyThreshold || 'BLOCK_ONLY_HIGH');
        setModelType(config.imageModel || 'gemini-3-pro-image-preview');
        setMaintenanceMode(config.maintenanceMode || false);

        if (config.sliderSettings) setSliderSettings(config.sliderSettings);
        if (config.sliders) setSliders(config.sliders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleBanUser = async (uid: string, currentStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'Banned' ? 'unban' : 'ban'} this user?`)) return;
    try {
      const newStatus = await toggleUserBan(uid, currentStatus || 'Active');
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: newStatus } : u));
    } catch (e) {
      alert("Failed to update user status");
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await saveSystemConfig({
        systemPrompt,
        thumbnailSystemPrompt,
        articleSystemPrompt,
        visualDeckSystemPrompt,
        quizSystemPrompt,
        shortsSystemPrompt,
        podcastSystemPrompt,
        temperature,
        safetyThreshold,
        imageModel: modelType,
        maintenanceMode,
        sliderSettings,
        sliders
      });
      setSaveMessage("Successfully Deployed");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage("Error saving config.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSlideUpload = async (section: keyof SystemConfig['sliders'], files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingSlide(true);
    
    try {
      const newSlides: Slide[] = [];
      const adminId = 'admin_system_assets'; 
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const base64Promise = new Promise<string>((resolve) => {
           reader.onloadend = () => resolve(reader.result as string);
           reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        
        let url = base64;
        try {
           const res = await uploadImageToStorage(adminId, base64, 'sliders');
           url = res.url;
        } catch(e) {
           console.warn("Storage upload failed, using base64 fallback", e);
        }

        newSlides.push({
           id: `slide_${Date.now()}_${i}`,
           type: 'image',
           url: url
        });
      }

      setSliders(prev => ({
         ...prev,
         [section]: [...(prev[section] || []), ...newSlides]
      }));

    } catch (e) {
      console.error(e);
      alert("Failed to upload slide.");
    } finally {
      setUploadingSlide(false);
    }
  };

  const removeSlide = (section: keyof SystemConfig['sliders'], slideId: string) => {
     setSliders(prev => ({
        ...prev,
        [section]: prev[section]?.filter(s => s.id !== slideId)
     }));
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Activity className="w-24 h-24 text-indigo-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Generations</h3>
        <div className="text-4xl font-bold text-white mt-2">12,543</div>
        <div className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1">
           <TrendingUp className="w-3 h-3" /> +14% this week
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Users className="w-24 h-24 text-blue-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Active Users</h3>
        <div className="text-4xl font-bold text-white mt-2">{users.length > 0 ? users.length : 142}</div>
        <div className="text-blue-400 text-xs font-bold mt-2 flex items-center gap-1">
           <Globe className="w-3 h-3" /> Global Reach
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Server className="w-24 h-24 text-emerald-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Storage Used</h3>
        <div className="text-4xl font-bold text-white mt-2">48.2 GB</div>
        <div className="text-slate-500 text-xs font-bold mt-2">of 100 GB Quota</div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Cpu className="w-24 h-24 text-purple-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">System Status</h3>
        <div className="text-xl font-bold text-white mt-3 flex items-center gap-2">
           <div className={`w-3 h-3 rounded-full ${maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
           {maintenanceMode ? 'Maintenance' : 'Operational'}
        </div>
        <div className="text-purple-400 text-xs font-bold mt-2">
           Gemini 3 Pro Active
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in shadow-xl">
       <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2"><Users className="w-5 h-5"/> User Database</h3>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input type="text" placeholder="Search users..." className="bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
             <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500">
                <tr>
                   <th className="px-6 py-4">User</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Joined</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-700">
                {users.map((user) => (
                   <tr key={user.uid} className="hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full" /> : user.displayName?.[0]}
                         </div>
                         <div>
                            <div className="font-bold text-white">{user.displayName}</div>
                            <div className="text-xs">{user.email}</div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="bg-indigo-900/30 text-indigo-400 px-2 py-1 rounded text-xs font-bold border border-indigo-500/30">
                            {user.role || 'User'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         {user.status === 'Banned' ? (
                            <span className="flex items-center gap-1 text-red-400 font-bold"><ShieldAlert className="w-3 h-3"/> Banned</span>
                         ) : (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 className="w-3 h-3"/> Active</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         {new Date(user.metadata?.creationTime || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => handleBanUser(user.uid, user.status)}
                           className={`p-2 rounded-lg transition-colors ${user.status === 'Banned' ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40' : 'bg-red-900/20 text-red-400 hover:bg-red-900/40'}`}
                           title={user.status === 'Banned' ? "Unban User" : "Ban User"}
                         >
                            <Ban className="w-4 h-4" />
                         </button>
                      </td>
                   </tr>
                ))}
                {users.length === 0 && !loadingUsers && (
                   <tr><td colSpan={5} className="text-center py-8">No users found</td></tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderAiConfig = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in relative pb-20">
       <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                   <Terminal className="w-5 h-5 text-purple-500" /> System Prompts
                </h3>
                <div className="flex bg-slate-900 rounded-lg p-1">
                   {['core', 'shorts', 'article', 'deck'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActivePromptTab(t)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activePromptTab === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                         {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                   ))}
                </div>
             </div>
             
             {activePromptTab === 'core' && (
                <div className="space-y-4 animate-fade-in">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Core Infographic Prompt</label>
                      <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-64 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-slate-300 focus:border-purple-500 outline-none resize-none"
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Thumbnail Style Prompt</label>
                      <textarea 
                        value={thumbnailSystemPrompt}
                        onChange={(e) => setThumbnailSystemPrompt(e.target.value)}
                        className="w-full h-32 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-slate-300 focus:border-purple-500 outline-none resize-none"
                      />
                   </div>
                </div>
             )}

             {activePromptTab === 'shorts' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Video Shorts Scripting Prompt</label>
                   <textarea 
                     value={shortsSystemPrompt}
                     onChange={(e) => setShortsSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-slate-300 focus:border-purple-500 outline-none resize-none"
                   />
                </div>
             )}

             {activePromptTab === 'article' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Article Generator Prompt</label>
                   <textarea 
                     value={articleSystemPrompt}
                     onChange={(e) => setArticleSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-slate-300 focus:border-purple-500 outline-none resize-none"
                   />
                </div>
             )}

             {activePromptTab === 'deck' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Presentation Deck Prompt</label>
                   <textarea 
                     value={visualDeckSystemPrompt}
                     onChange={(e) => setVisualDeckSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-slate-300 focus:border-purple-500 outline-none resize-none"
                   />
                </div>
             )}
          </div>
       </div>

       <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm sticky top-24">
             <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                <BrainCircuit className="w-5 h-5 text-blue-500" /> Model Parameters
             </h3>
             
             <div className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Image Model</label>
                   <select 
                     value={modelType} 
                     onChange={(e) => setModelType(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
                   >
                      <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (Best Quality)</option>
                      <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fastest)</option>
                   </select>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Temperature (Creativity)</label>
                   <input 
                     type="range" 
                     min="0" 
                     max="1" 
                     step="0.1" 
                     value={temperature} 
                     onChange={(e) => setTemperature(parseFloat(e.target.value))}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                   />
                   <div className="text-right text-xs text-slate-400">{temperature}</div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Safety Filter</label>
                   <select 
                     value={safetyThreshold} 
                     onChange={(e) => setSafetyThreshold(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
                   >
                      <option value="BLOCK_NONE">Block None (Risky)</option>
                      <option value="BLOCK_ONLY_HIGH">Block Only High (Balanced)</option>
                      <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium+ (Strict)</option>
                   </select>
                </div>

                <div className="flex items-center justify-between p-2 border-t border-slate-700 pt-4 mt-4">
                   <span className="text-sm text-slate-300 font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500"/> Maintenance Mode</span>
                   <button 
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-slate-600'}`}
                   >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-700">
                <button 
                  onClick={handleSaveConfig} 
                  disabled={savingConfig}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Deploy Configuration
                </button>
                {saveMessage && <div className="text-center text-emerald-400 text-sm mt-2 font-bold animate-pulse">{saveMessage}</div>}
             </div>
          </div>
       </div>
    </div>
  );

  const renderSliderConfig = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in relative pb-20">
       {/* Global Settings */}
       <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm sticky top-24">
             <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                <MonitorPlay className="w-5 h-5 text-pink-500" /> Global Settings
             </h3>
             
             <div className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Slider Height</label>
                   <select 
                     value={sliderSettings.height}
                     onChange={(e) => setSliderSettings({...sliderSettings, height: e.target.value as any})}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
                   >
                      <option value="compact">Compact (Small)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="large">Large (Impact)</option>
                      <option value="cinematic">Cinematic (Full Screen Feel)</option>
                   </select>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Slide Duration (ms)</label>
                   <input 
                     type="number"
                     step="500"
                     value={sliderSettings.duration}
                     onChange={(e) => setSliderSettings({...sliderSettings, duration: parseInt(e.target.value)})}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
                   />
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Overlay Dimming</label>
                   <input 
                     type="range"
                     min="0"
                     max="0.8"
                     step="0.1"
                     value={sliderSettings.overlayOpacity}
                     onChange={(e) => setSliderSettings({...sliderSettings, overlayOpacity: parseFloat(e.target.value)})}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                   />
                   <div className="text-right text-xs text-slate-400">{Math.round(sliderSettings.overlayOpacity * 100)}%</div>
                </div>

                <div className="flex items-center justify-between p-2">
                   <span className="text-sm text-slate-300 font-bold">Full Width Stretch</span>
                   <button 
                      onClick={() => setSliderSettings({...sliderSettings, fullWidth: !sliderSettings.fullWidth})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sliderSettings.fullWidth ? 'bg-pink-600' : 'bg-slate-600'}`}
                   >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sliderSettings.fullWidth ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-700">
                <button 
                  onClick={handleSaveConfig} 
                  disabled={savingConfig}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save All Changes
                </button>
             </div>
          </div>
       </div>

       {/* Sliders Management */}
       <div className="lg:col-span-2 space-y-8">
          {(['landing', 'create', 'shop', 'learn'] as const).map((section) => (
             <div key={section} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-white capitalize text-lg">{section} Page Slider</h3>
                   <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{sliders[section]?.length || 0} Slides</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                   {sliders[section]?.map((slide) => (
                      <div key={slide.id} className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden group border border-slate-600">
                         {slide.type === 'video' ? (
                            <video src={slide.url} className="w-full h-full object-cover" muted />
                         ) : (
                            <img src={slide.url} className="w-full h-full object-cover" />
                         )}
                         <button 
                           onClick={() => removeSlide(section, slide.id)}
                           className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <X className="w-3 h-3" />
                         </button>
                      </div>
                   ))}
                   
                   {/* Add Button */}
                   <label className="flex flex-col items-center justify-center aspect-video bg-slate-900/50 border-2 border-dashed border-slate-600 rounded-lg hover:border-pink-500 hover:bg-pink-900/10 cursor-pointer transition-colors relative">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={(e) => handleSlideUpload(section, e.target.files)} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadingSlide}
                      />
                      {uploadingSlide ? <RefreshCw className="w-6 h-6 animate-spin text-pink-500" /> : <Plus className="w-6 h-6 text-slate-400" />}
                      <span className="text-xs text-slate-500 mt-2 font-bold">Add Images</span>
                   </label>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  // Icon Helper for Dashboard
  const TrendingUp = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <Lock className="w-5 h-5 text-rose-500 mr-2" />
           <span className="font-bold text-lg tracking-tight text-white">ADMIN<span className="text-slate-500">PANEL</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('site-performance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'site-performance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <LayoutDashboard className="w-5 h-5" /> Site Performance
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <Users className="w-5 h-5" /> User Management
          </button>
          <button onClick={() => setActiveTab('shop-manager')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'shop-manager' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <ShoppingBag className="w-5 h-5" /> Shop Manager
          </button>
          <button onClick={() => setActiveTab('slider-config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'slider-config' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <MonitorPlay className="w-5 h-5" /> Slider Config
          </button>
          <button onClick={() => setActiveTab('ai-config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ai-config' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <BrainCircuit className="w-5 h-5" /> AI Brain Config
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={onExit} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm">
              Exit Control Room
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-950">
         <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
            <h2 className="text-xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">AD</div>
            </div>
         </header>
         
         <div className="p-8">
            {activeTab === 'site-performance' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'shop-manager' && onSaveShopBundle && (
                <AdminShopManager onSaveBundle={(b) => { onSaveShopBundle(b); }} />
            )}
            {activeTab === 'slider-config' && renderSliderConfig()}
            {activeTab === 'ai-config' && renderAiConfig()}
         </div>
      </div>
    </div>
  );
};












