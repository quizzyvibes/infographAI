
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

  // --- DEFAULTS (POPULATED WITH PRODUCTION PROMPTS) ---
  
  const DEFAULT_PROMPT = `You are an expert Art Director for educational infographics.
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
- Output raw prompt text only.`.trim();

  const DEFAULT_THUMBNAIL_PROMPT = `CRITICAL VISUAL REQUIREMENT:
- **FULLY COLORED BACKGROUND**: The entire image must have a rich, vibrant background color (Deep Blue, Purple, Emerald, or Dark Space). No white or plain grey backgrounds.
- **HIGH CONTRAST & SATURATION**: The colors must pop. Use high saturation and strong lighting contrast to grab attention immediately.
- **CENTERPIECE**: An abstract, 3D glossy composition representing the subject matter in the center.
- Do NOT look like a flat document scan. Look like a premium 3D software box or high-budget course header.
- Clean, modern, professional.
- NO TEXT IN IMAGE.`.trim();

  const DEFAULT_ARTICLE_PROMPT = `Act as an engaging, expert teacher giving a masterclass.

STYLE GUIDE:
1. TONE: Highly conversational, warm, and confident. Write as if you are speaking directly to a student. Use "we", "you", and natural transitions. Avoid stiff academic language. Make it feel like a live talk or podcast transcript.
2. NO BOLDING: Do not use bold text, asterisks (**), or markdown bolding anywhere. Use natural emphasis through sentence structure instead.
3. FORMATTING: Use Markdown Headers (###) for main sections. Keep paragraphs short and readable (2-3 sentences max). Use clean spacing.

OUTPUT STRUCTURE:
[SUMMARY]
(Write a flowing, engaging preview of at least 150 words. Hook the reader immediately. Explain why this topic matters and what they will take away. No bold text.)

[ARTICLE]
(Write a comprehensive lesson of at least 500 words. Divide into logical sections with ### Headers.
 - Introduction: Set the stage.
 - Core Concepts: Explain simply.
 - Real-world context: Why does this matter?
 - Conclusion: Wrap up with a key takeaway.
 No bold text.)`.trim();

  const DEFAULT_DECK_PROMPT = `Act as an expert educational content creator and visual director.

CRITICAL INSTRUCTIONS:
1. **CONTENT**: For each slide, provide 4-5 detailed bullet points in the 'content' array. These must be factual, extracted from the source material if possible, and high value.
2. **SPEAKER NOTES**: Write a FULL SPEECH SCRIPT for the presenter in 'speakerNotes'. Do not just write bullet points. Write natural, engaging paragraphs. The total presentation must last at least 3 minutes, so each slide needs about 60-80 words of speech script.
3. **VISUALS**: The 'visualPrompt' must be a highly detailed description for an AI image generator (Gemini 3 Pro Image) to create a high-end background/diagram.`.trim();

  const DEFAULT_QUIZ_PROMPT = `Generate 10 multiple choice questions for the provided topic.
Ensure the questions challenge the student but are appropriate for the level.
Provide a clear explanation for the correct answer.`.trim();

  const DEFAULT_SHORTS_PROMPT = `Analyze the topic provided by the user.
Create a structured script for a YouTube Short / TikTok video.
Break it down into exactly 5 distinct visual scenes/chapters.

RULES:
- Headlines must be short and punchy (max 5 words) suitable for overlay.
- Voice Script must be conversational, high-energy, and about 10-15 seconds per scene.
- Visual Prompt must be descriptive for an AI image generator.`.trim();

  const DEFAULT_PODCAST_PROMPT = `Create a podcast script between two hosts (Host and Expert) discussing the provided topic.
Keep it conversational, fun, and educational. Duration target: 2 minutes.
Do not include sound effects in the text.
Strictly follow the format "Host: ..." and "Expert: ...".`.trim();

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
        // Use saved config OR fall back to the populated defaults defined above
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
      } else {
        // If no config exists in DB, set all defaults
        setSystemPrompt(DEFAULT_PROMPT);
        setThumbnailSystemPrompt(DEFAULT_THUMBNAIL_PROMPT);
        setArticleSystemPrompt(DEFAULT_ARTICLE_PROMPT);
        setVisualDeckSystemPrompt(DEFAULT_DECK_PROMPT);
        setQuizSystemPrompt(DEFAULT_QUIZ_PROMPT);
        setShortsSystemPrompt(DEFAULT_SHORTS_PROMPT);
        setPodcastSystemPrompt(DEFAULT_PODCAST_PROMPT);
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
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <BrainCircuit className="w-24 h-24 text-emerald-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">API Health</h3>
        <div className="text-4xl font-bold text-emerald-400 mt-2">99.8%</div>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Users className="w-24 h-24 text-blue-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Users</h3>
        <div className="text-4xl font-bold text-white mt-2">{users.length > 0 ? users.length : '8,420'}</div>
      </div>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <ShoppingBag className="w-24 h-24 text-amber-500" />
        </div>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Shop Sales</h3>
        <div className="text-4xl font-bold text-white mt-2">$4,250</div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in">
       {loadingUsers ? (
         <div className="p-8 text-center text-slate-400">Loading user data...</div>
       ) : (
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">User</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Role</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Status</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Last Active</th>
                  <th className="p-4 text-sm font-bold text-slate-400 uppercase">Actions</th>
               </tr>
            </thead>
            <tbody>
               {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                     <td className="p-4 font-bold text-white">
                       <div>{u.displayName || 'No Name'}</div>
                       <div className="text-xs text-slate-500 font-normal">{u.email}</div>
                     </td>
                     <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-900 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>{u.role || 'User'}</span>
                     </td>
                     <td className="p-4">
                        <span className={`flex items-center gap-1.5 text-sm ${u.status === 'Active' ? 'text-emerald-400' : 'text-red-400'}`}>
                           <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                           {u.status || 'Active'}
                        </span>
                     </td>
                     <td className="p-4 text-slate-300 text-sm">
                       {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Unknown'}
                     </td>
                     <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => handleBanUser(u.id, u.status)}
                          className="p-2 bg-slate-900 hover:bg-red-900/50 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title={u.status === 'Banned' ? "Unban User" : "Ban User"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-slate-900 hover:bg-blue-900/50 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"><Search className="w-4 h-4" /></button>
                     </td>
                  </tr>
               ))}
               {users.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">No users found. Login with an account to populate data.</td>
                 </tr>
               )}
            </tbody>
         </table>
       )}
    </div>
  );

  const renderAiConfig = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in relative pb-20">
       <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
             <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                   <Terminal className="w-5 h-5 text-purple-500" /> System Prompts
                </h3>
                <div className="flex bg-slate-900 rounded-lg p-1 overflow-x-auto max-w-full">
                   {['core', 'article', 'deck', 'quiz', 'shorts', 'podcast', 'thumbnail'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActivePromptTab(t)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activePromptTab === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
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
                        className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-emerald-400 focus:border-purple-500 outline-none resize-none custom-scrollbar"
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
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-pink-300 focus:border-purple-500 outline-none resize-none custom-scrollbar"
                   />
                </div>
             )}

             {activePromptTab === 'article' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Article Generator Prompt</label>
                   <textarea 
                     value={articleSystemPrompt}
                     onChange={(e) => setArticleSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-blue-300 focus:border-purple-500 outline-none resize-none custom-scrollbar"
                   />
                </div>
             )}

             {activePromptTab === 'deck' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Presentation Deck Prompt</label>
                   <textarea 
                     value={visualDeckSystemPrompt}
                     onChange={(e) => setVisualDeckSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-orange-300 focus:border-purple-500 outline-none resize-none custom-scrollbar"
                   />
                </div>
             )}

             {activePromptTab === 'quiz' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Quiz Generation Prompt</label>
                   <textarea 
                     value={quizSystemPrompt}
                     onChange={(e) => setQuizSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-emerald-300 focus:border-purple-500 outline-none resize-none custom-scrollbar"
                   />
                </div>
             )}

             {activePromptTab === 'podcast' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Podcast Scripting Prompt</label>
                   <textarea 
                     value={podcastSystemPrompt}
                     onChange={(e) => setPodcastSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-purple-300 focus:border-purple-500 outline-none resize-none custom-scrollbar"
                   />
                </div>
             )}

             {activePromptTab === 'thumbnail' && (
                <div className="space-y-4 animate-fade-in">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Shop Thumbnail Style Prompt</label>
                   <textarea 
                     value={thumbnailSystemPrompt}
                     onChange={(e) => setThumbnailSystemPrompt(e.target.value)}
                     className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-rose-300 focus:border-purple-500 outline-none resize-none custom-scrollbar"
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
    <div className="space-y-8 animate-fade-in pb-20">
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
          <h3 className="font-bold text-white flex items-center gap-2 mb-6">
             <MonitorPlay className="w-5 h-5 text-pink-500" /> Global Slider Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Slider Height</label>
                <select 
                  value={sliderSettings.height}
                  onChange={(e) => setSliderSettings({...sliderSettings, height: e.target.value as any})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
                >
                   <option value="compact">Compact (Header)</option>
                   <option value="medium">Medium (Standard)</option>
                   <option value="large">Large (Showcase)</option>
                   <option value="cinematic">Cinematic (Hero)</option>
                </select>
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Slide Duration (ms)</label>
                <input 
                  type="number"
                  value={sliderSettings.duration}
                  onChange={(e) => setSliderSettings({...sliderSettings, duration: parseInt(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
                />
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Overlay Opacity (0-1)</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={sliderSettings.overlayOpacity}
                  onChange={(e) => setSliderSettings({...sliderSettings, overlayOpacity: parseFloat(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
                />
             </div>
             <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox"
                     checked={sliderSettings.fullWidth}
                     onChange={(e) => setSliderSettings({...sliderSettings, fullWidth: e.target.checked})}
                     className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-pink-600 focus:ring-pink-500"
                   />
                   <span className="text-sm font-bold text-slate-300">Full Width Mode</span>
                </label>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['landing', 'create', 'shop', 'learn'] as const).map((section) => (
             <div key={section} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-white capitalize">{section} Page Slider</h3>
                   <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Upload
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => handleSlideUpload(section, e.target.files)}
                      />
                   </label>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
                   {(!sliders[section] || sliders[section].length === 0) && (
                      <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl">
                         No slides uploaded. Using defaults.
                      </div>
                   )}
                   {sliders[section]?.map((slide) => (
                      <div key={slide.id} className="flex gap-3 bg-slate-900 p-2 rounded-lg border border-slate-700 group relative">
                         <img src={slide.url} className="w-16 h-10 object-cover rounded bg-slate-800" />
                         <div className="flex-1 min-w-0 flex items-center">
                            <span className="text-xs text-slate-400 truncate">{slide.id}</span>
                         </div>
                         <button 
                           onClick={() => removeSlide(section, slide.id)}
                           className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          ))}
       </div>

       <div className="sticky bottom-6 flex justify-center z-20">
          <button 
            onClick={handleSaveConfig} 
            disabled={savingConfig}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold shadow-xl flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-105"
          >
            {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save & Publish All Configs
          </button>
       </div>
    </div>
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















