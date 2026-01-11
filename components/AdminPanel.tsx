
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Image as ImageIcon, BrainCircuit, Activity, 
  Search, ShieldAlert, Trash2, Ban, Save, RefreshCw, 
  Terminal, Server, Lock, Globe, AlertTriangle, Cpu, ToggleLeft, ToggleRight, ShoppingBag, CheckCircle2,
  FileText, Film, Mic, Play, MonitorPlay, Plus, Upload, X, Zap, DollarSign, Calendar, TrendingUp, TrendingDown,
  CreditCard, PieChart, Sparkles, MoveHorizontal, Type, Link as LinkIcon, Wand2, Layout, Maximize, User, Eye, UserCircle,
  ArrowUpRight, ArrowDownRight, Briefcase, Download
} from 'lucide-react';
import { HistoryItem, ShopBundle, SystemConfig, Slide, SliderGlobalSettings, UserPurchaseRecord, AppUser } from '../src/types';
import { getSystemConfig, saveSystemConfig, getAllUsers, toggleUserBan, uploadImageToStorage, getUserHistory } from '../src/services/dbService';
import { AdminShopManager } from './AdminShopManager';
import { generateBannerImage, generateBannerText } from '../src/services/geminiService';
import { UniversalSlider } from './UniversalSlider';
import { UserProfile } from './UserProfile';

interface AdminPanelProps {
  onExit: () => void;
  onSaveShopBundle?: (bundle: ShopBundle) => void;
}

type Tab = 'site-performance' | 'users' | 'content' | 'ai-config' | 'system' | 'shop-manager' | 'slider-config' | 'finance';

// Font Presets
const BANNER_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 
  'Poppins', 'Playfair Display', 'Merriweather', 'Oswald', 'Raleway', 'Outfit'
];

// --- HARDCODED DEFAULTS (Populated Immediately) ---
const DEFAULT_PROMPT = `You are an expert Art Director for educational infographics.
Write a single, highly detailed image generation prompt for a text-to-image model.
Adhere to this Style: High-end, vector-art educational infographic. Flat design, clean lines, vibrant but professional color palette (Deep Blue, Teal, Gold, Soft White).
Typography should be legible, sans-serif, and hierarchical.`;

const DEFAULT_THUMBNAIL_PROMPT = `CRITICAL VISUAL REQUIREMENT:
- **FULLY COLORED BACKGROUND**: The entire image must have a rich, vibrant background color.
- **HIGH CONTRAST & SATURATION**: Colors must pop.
- **CENTERPIECE**: An abstract, 3D glossy composition representing the subject matter.
- Clean, modern, professional packaging style. No text.`;

const DEFAULT_ARTICLE_PROMPT = `Act as an engaging, expert teacher giving a masterclass.
STYLE GUIDE:
1. TONE: Highly conversational, warm, and confident. Use "we", "you", and natural transitions.
2. NO BOLDING: Do not use bold text, asterisks (**), or markdown bolding.
3. FORMATTING: Use Markdown Headers (###) for sections.
OUTPUT STRUCTURE:
[SUMMARY] (150 words hook)
[ARTICLE] (500 words comprehensive lesson)`;

const DEFAULT_DECK_PROMPT = `Act as an expert educational content creator and visual director.
CRITICAL INSTRUCTIONS:
1. **CONTENT**: Provide 4-5 detailed bullet points per slide. Factual and high value.
2. **SPEAKER NOTES**: Write a FULL SPEECH SCRIPT (60-80 words) for the presenter.
3. **VISUALS**: Provide a highly detailed AI image prompt for a background/diagram.`;

const DEFAULT_QUIZ_PROMPT = `Generate 10 multiple choice questions for the provided topic.
Ensure the questions challenge the student but are appropriate for the level.
Provide a clear explanation for the correct answer.
Return JSON Array: { id, question, options: string[], correctAnswerIndex: number, explanation: string }`;

const DEFAULT_SHORTS_PROMPT = `Analyze the topic provided.
Create a structured script for a 60s YouTube Short / TikTok video.
Break it down into exactly 5 distinct visual scenes.
Headlines max 5 words. Voice script 10-15s per scene.
Return JSON.`;

const DEFAULT_PODCAST_PROMPT = `Create a podcast script between two hosts (Host and Expert).
Keep it conversational, fun, and educational. Duration target: 2 minutes.
No sound effects text. Format: "Host: ..." and "Expert: ...".`;

const DEFAULT_BANNER_PROMPT = `You are a specialized UX Copywriter for high-conversion landing pages.
Generate a catchy header (title), a short subheader (subtitle), and a call-to-action button label (cta) for a website banner.
Tone: Professional, Inspiring, Innovative.
Keep title under 40 characters. Keep subtitle under 80 characters. Keep CTA under 20 characters.`;

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit, onSaveShopBundle }) => {
  const [activeTab, setActiveTab] = useState<Tab>('site-performance');
  
  // Real State for AI Config - Initialized with DEFAULTS immediately
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [thumbnailSystemPrompt, setThumbnailSystemPrompt] = useState(DEFAULT_THUMBNAIL_PROMPT);
  const [articleSystemPrompt, setArticleSystemPrompt] = useState(DEFAULT_ARTICLE_PROMPT);
  const [visualDeckSystemPrompt, setVisualDeckSystemPrompt] = useState(DEFAULT_DECK_PROMPT);
  const [quizSystemPrompt, setQuizSystemPrompt] = useState(DEFAULT_QUIZ_PROMPT);
  const [shortsSystemPrompt, setShortsSystemPrompt] = useState(DEFAULT_SHORTS_PROMPT);
  const [podcastSystemPrompt, setPodcastSystemPrompt] = useState(DEFAULT_PODCAST_PROMPT);
  const [bannerSystemPrompt, setBannerSystemPrompt] = useState(DEFAULT_BANNER_PROMPT); 
  
  const [activePromptTab, setActivePromptTab] = useState('core'); 

  const [temperature, setTemperature] = useState(0.7);
  const [safetyThreshold, setSafetyThreshold] = useState('BLOCK_ONLY_HIGH');
  const [modelType, setModelType] = useState('gemini-3-pro-image-preview');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Slider State
  const [sliderSettings, setSliderSettings] = useState<SliderGlobalSettings>({
    height: 'medium',
    duration: 5000,
    fullWidth: true,
    overlayOpacity: 0.3
  });
  const [sliders, setSliders] = useState<SystemConfig['sliders']>({
    landing: [],
    create: [],
    shop: [],
    learn: []
  });
  const [uploadingSlide, setUploadingSlide] = useState(false);

  // Banner Generator State
  const [genTargetSection, setGenTargetSection] = useState<keyof SystemConfig['sliders']>('landing');
  const [genPrompt, setGenPrompt] = useState('');
  const [genTitle, setGenTitle] = useState('');
  const [genSubtitle, setGenSubtitle] = useState('');
  const [genCtaLabel, setGenCtaLabel] = useState('');
  const [genCtaLink, setGenCtaLink] = useState('');
  const [genTextPosition, setGenTextPosition] = useState<'left' | 'center' | 'right'>('left');
  const [genFontFamily, setGenFontFamily] = useState('Inter');
  const [genFontSize, setGenFontSize] = useState<'small'|'medium'|'large'|'xl'>('medium');

  const [generatedBannerUrl, setGeneratedBannerUrl] = useState<string | null>(null);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [autoGenText, setAutoGenText] = useState(true);
  
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser & { purchases?: UserPurchaseRecord[] } | null>(null);
  const [viewingUserProfile, setViewingUserProfile] = useState<{ user: AppUser, history: HistoryItem[] } | null>(null);

  // Finance State (Mocked)
  const [financeData, setFinanceData] = useState({
    totalRevenue: 12450.50,
    apiCost: 142.30,
    netProfit: 12308.20,
    mrr: 2840.00,
    subscriptionsActive: 142,
    shopSalesTotal: 4250,
    subscriptionRevenue: 2400
  });

  useEffect(() => {
     if (activeTab === 'ai-config' || activeTab === 'slider-config') {
       loadConfig();
     }
     if (activeTab === 'users' || activeTab === 'finance') {
       loadUsers();
     }
  }, [activeTab]);

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const config = await getSystemConfig();
      if (config) {
        // Fallback to Defaults if key exists but string is empty
        setSystemPrompt(config.systemPrompt || DEFAULT_PROMPT);
        setThumbnailSystemPrompt(config.thumbnailSystemPrompt || DEFAULT_THUMBNAIL_PROMPT);
        setArticleSystemPrompt(config.articleSystemPrompt || DEFAULT_ARTICLE_PROMPT);
        setVisualDeckSystemPrompt(config.visualDeckSystemPrompt || DEFAULT_DECK_PROMPT);
        setQuizSystemPrompt(config.quizSystemPrompt || DEFAULT_QUIZ_PROMPT);
        setShortsSystemPrompt(config.shortsSystemPrompt || DEFAULT_SHORTS_PROMPT);
        setPodcastSystemPrompt(config.podcastSystemPrompt || DEFAULT_PODCAST_PROMPT);
        setBannerSystemPrompt(config.bannerSystemPrompt || DEFAULT_BANNER_PROMPT);

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
      // Enhance user data with mock stats if not present
      const enrichedUsers: AppUser[] = data.map((u: any) => ({
         ...u,
         visits: u.visits || Math.floor(Math.random() * 50) + 1,
         subscriptionTier: u.subscriptionTier || (Math.random() > 0.8 ? 'Pro' : Math.random() > 0.6 ? 'Basic' : 'Free'),
         subscriptionStatus: u.subscriptionStatus || (Math.random() > 0.8 ? 'Active' : 'Cancelled'),
         shopSpend: u.shopSpend ?? Math.floor(Math.random() * 150),
         subscriptionSpend: u.subscriptionSpend ?? (u.subscriptionTier !== 'Free' ? Math.floor(Math.random() * 100) + 20 : 0)
      }));
      setUsers(enrichedUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserClick = (user: AppUser) => {
     const count = Math.floor(Math.random() * 8);
     const mockPurchases: UserPurchaseRecord[] = Array(count).fill(0).map((_, i) => ({
        id: `ord_${Date.now()}_${i}`,
        date: Date.now() - (Math.random() * 10000000000),
        bundleTitle: i % 2 === 0 ? `Subscription Renewal (${user.subscriptionTier})` : `Shop Bundle: ${['Space', 'Biology', 'History'][i%3]}`,
        amount: parseFloat((Math.random() * 20 + 9.99).toFixed(2)),
        status: 'Completed',
        type: i % 2 === 0 ? 'Subscription' : 'Shop'
     }));
     setSelectedUser({ ...user, purchases: mockPurchases });
  };

  // --- NEW: Live Profile Tracking ---
  const handleViewProfile = async (user: AppUser, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const history = await getUserHistory(user.uid);
        setViewingUserProfile({ user, history });
    } catch (err) {
        alert("Could not load user history.");
    }
  };

  const handleBanUser = async (uid: string, currentStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'Banned' ? 'unban' : 'ban'} this user?`)) return;
    try {
      const newStatus = await toggleUserBan(uid, currentStatus || 'Active');
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
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
        bannerSystemPrompt,
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
        } catch(e) { console.warn("Upload failed", e); }
        newSlides.push({
           id: `slide_${Date.now()}_${i}`,
           type: 'image',
           url: url,
           textPosition: 'left'
        });
      }
      setSliders(prev => ({ ...prev, [section]: [...(prev[section] || []), ...newSlides] }));
    } catch (e) { console.error(e); } finally { setUploadingSlide(false); }
  };

  const handleGenerateBanner = async () => {
    if (!genPrompt) { alert("Please enter a visual description."); return; }
    setIsGeneratingBanner(true);
    try {
        const imageUrl = await generateBannerImage(genPrompt, "16:9");
        setGeneratedBannerUrl(imageUrl);
        if (autoGenText) {
            const textData = await generateBannerText(genPrompt, genTargetSection);
            setGenTitle(textData.title);
            setGenSubtitle(textData.subtitle);
            setGenCtaLabel(textData.cta);
        }
    } catch (e) { console.error(e); } finally { setIsGeneratingBanner(false); }
  };

  const handleSaveGeneratedBanner = async () => {
    if (!generatedBannerUrl) return;
    setUploadingSlide(true);
    try {
        let finalUrl = generatedBannerUrl;
        if (generatedBannerUrl.startsWith('data:')) {
             try {
                const res = await uploadImageToStorage('admin_system_assets', generatedBannerUrl, 'sliders');
                finalUrl = res.url;
             } catch(e) {}
        }
        const newSlide: Slide = {
            id: `gen_slide_${Date.now()}`,
            type: 'image',
            url: finalUrl,
            title: genTitle,
            subtitle: genSubtitle,
            ctaLabel: genCtaLabel,
            ctaLink: genCtaLink,
            textPosition: genTextPosition,
            fontFamily: genFontFamily, // New
            fontSize: genFontSize // New
        };
        setSliders(prev => ({ ...prev, [genTargetSection]: [...(prev[genTargetSection] || []), newSlide] }));
        setGeneratedBannerUrl(null); 
        setGenPrompt('');
    } catch(e) { console.error(e); } finally { setUploadingSlide(false); }
  };

  const removeSlide = (section: keyof SystemConfig['sliders'], slideId: string) => {
     setSliders(prev => ({ ...prev, [section]: prev[section]?.filter(s => s.id !== slideId) }));
  };

  // ... (Dashboard, Finance, ShopManager Renders same as before) ...
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
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in relative">
       {/* User List */}
       <table className="w-full text-left border-collapse">
          <thead>
             <tr className="bg-slate-900 border-b border-slate-700">
                <th className="p-4 text-sm font-bold text-slate-400 uppercase">User</th>
                <th className="p-4 text-sm font-bold text-slate-400 uppercase">Role</th>
                <th className="p-4 text-sm font-bold text-slate-400 uppercase">Tier</th>
                <th className="p-4 text-sm font-bold text-slate-400 uppercase">Visits</th>
                <th className="p-4 text-sm font-bold text-slate-400 uppercase">Lifetime Spend</th>
                <th className="p-4 text-sm font-bold text-slate-400 uppercase">Actions</th>
             </tr>
          </thead>
          <tbody>
             {users.map(u => (
                <tr key={u.uid} onClick={() => handleUserClick(u)} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer group">
                   <td className="p-4 font-bold text-white flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                        {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : u.displayName?.[0]}
                     </div>
                     <div>
                        <div>{u.displayName || 'No Name'}</div>
                        <div className="text-xs text-slate-500 font-normal">{u.email}</div>
                     </div>
                   </td>
                   <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-900 text-purple-300' : 'bg-slate-700 text-slate-300'}`}>{u.role || 'User'}</span>
                   </td>
                   <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                         u.subscriptionTier === 'Pro' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' : 
                         u.subscriptionTier === 'Basic' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}>
                         {u.subscriptionTier || 'Free'}
                      </span>
                   </td>
                   <td className="p-4 text-slate-300">{u.visits}</td>
                   <td className="p-4 font-mono text-emerald-400 font-bold">${((u.shopSpend || 0) + (u.subscriptionSpend || 0)).toFixed(2)}</td>
                   <td className="p-4 flex gap-2">
                      <button 
                        onClick={(e) => handleViewProfile(u, e)}
                        className="p-2 bg-slate-900 hover:bg-blue-600 hover:text-white rounded-lg text-slate-400 transition-colors"
                        title="View Live Profile"
                      >
                        <UserCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleBanUser(u.uid, u.status || 'Active'); }}
                        className="p-2 bg-slate-900 hover:bg-red-900/50 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        title={u.status === 'Banned' ? "Unban User" : "Ban User"}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                   </td>
                </tr>
             ))}
          </tbody>
       </table>

       {/* LIVE PROFILE MODAL */}
       {viewingUserProfile && (
          <div className="absolute inset-0 bg-slate-950 z-30 animate-zoom-in overflow-y-auto">
             <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <User className="w-5 h-5 text-blue-500" />
                   <span className="font-bold text-white">Viewing {viewingUserProfile.user.displayName}'s Live Profile</span>
                </div>
                <button onClick={() => setViewingUserProfile(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold text-xs flex items-center gap-2">
                   <X className="w-4 h-4" /> Close View
                </button>
             </div>
             {/* Render the full UserProfile component with admin flag */}
             <UserProfile 
                user={viewingUserProfile.user} 
                history={viewingUserProfile.history} 
                onLoadHistory={()=>{}} 
                onDeleteHistory={()=>{}}
                onSignOut={()=>{}}
                isPro={viewingUserProfile.user.subscriptionTier === 'Pro'}
                onOpenAdmin={()=>{}}
                isAdminView={true}
             />
          </div>
       )}

       {/* Enhanced User Detail Slide-over */}
       {selectedUser && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-20 flex justify-end animate-slide-left">
             <div className="w-full max-w-2xl bg-slate-800 h-full border-l border-slate-700 shadow-2xl flex flex-col">
                <div className="p-6 border-b border-slate-700 flex justify-between items-start bg-slate-850">
                   <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-500 shadow-lg">
                         {selectedUser.photoURL ? <img src={selectedUser.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold">{selectedUser.displayName?.[0]}</div>}
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold text-white">{selectedUser.displayName}</h2>
                         <div className="text-slate-400 text-sm flex gap-4 mt-1">
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> {selectedUser.status || 'Active'}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Joined {selectedUser.metadata?.creationTime ? new Date(selectedUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}</span>
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setSelectedUser(null)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                   
                   {/* Financial Stats Grid */}
                   <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                         <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Lifetime Value</div>
                         <div className="text-2xl font-bold text-white">${((selectedUser.shopSpend || 0) + (selectedUser.subscriptionSpend || 0)).toFixed(2)}</div>
                      </div>
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                         <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Sub Revenue</div>
                         <div className="text-xl font-bold text-blue-400">${selectedUser.subscriptionSpend || 0}</div>
                      </div>
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                         <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Shop Revenue</div>
                         <div className="text-xl font-bold text-emerald-400">${selectedUser.shopSpend || 0}</div>
                      </div>
                   </div>

                   {/* Purchase History */}
                   <div>
                      <h3 className="font-bold text-white mb-4 border-b border-slate-700 pb-2 flex justify-between items-center">
                         <span>Transaction Record</span>
                         <span className="text-xs text-slate-500 font-normal">{selectedUser.purchases?.length || 0} Records</span>
                      </h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                         {selectedUser.purchases?.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                               <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.type === 'Subscription' ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                                     {p.type === 'Subscription' ? <RefreshCw className="w-4 h-4"/> : <ShoppingBag className="w-4 h-4"/>}
                                  </div>
                                  <div>
                                     <div className="font-bold text-slate-200 text-sm">{p.bundleTitle}</div>
                                     <div className="text-[10px] text-slate-500">{new Date(p.date).toLocaleDateString()} • ID: {p.id.slice(-6)}</div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="font-bold text-white text-sm">${p.amount.toFixed(2)}</div>
                                  <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block ${p.status === 'Completed' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>{p.status}</div>
                               </div>
                            </div>
                         ))}
                         {(!selectedUser.purchases || selectedUser.purchases.length === 0) && (
                            <div className="text-center py-8 text-slate-500 bg-slate-900/50 rounded-lg border border-dashed border-slate-700">No transactions recorded.</div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );

  const renderFinanceManager = () => (
    <div className="space-y-8 animate-fade-in pb-20">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-24 h-24 text-emerald-500" /></div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Net Profit</h3>
             <div className="text-4xl font-black text-white flex items-end gap-2">
                ${financeData.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                <span className="text-sm font-bold text-emerald-400 mb-1 flex items-center bg-emerald-900/30 px-2 py-0.5 rounded-full"><TrendingUp className="w-3 h-3 mr-1"/> +12%</span>
             </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CreditCard className="w-24 h-24 text-blue-500" /></div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">MRR</h3>
             <div className="text-3xl font-bold text-white">${financeData.mrr.toLocaleString()}</div>
             <div className="text-xs text-slate-500 mt-2">Monthly Recurring Revenue</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-24 h-24 text-red-500" /></div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">API Costs</h3>
             <div className="text-3xl font-bold text-red-400">-${financeData.apiCost.toFixed(2)}</div>
             <div className="text-xs text-slate-500 mt-2">Gemini 3 Pro / Flash Usage</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-24 h-24 text-purple-500" /></div>
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active Subs</h3>
             <div className="text-3xl font-bold text-white">{financeData.subscriptionsActive}</div>
             <div className="text-xs text-slate-500 mt-2">Churn Rate: 1.2%</div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart Visual */}
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-500"/> Revenue Trend</h3>
                <div className="flex gap-2">
                   <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg">Last 30 Days</span>
                </div>
             </div>
             <div className="h-64 flex items-end justify-between gap-2 px-4 pb-2 border-b border-slate-700">
                {[40, 55, 35, 60, 75, 50, 80, 95, 70, 85, 100, 90, 65, 80, 55, 70, 85, 60, 45, 50, 75, 90, 80, 70, 85, 95, 100, 90, 85, 95].map((h, i) => (
                   <div key={i} className="w-full bg-indigo-600/30 hover:bg-indigo-500 rounded-t-sm relative group transition-all" style={{ height: `${h}%` }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                         ${(h * 15.5).toFixed(2)}
                      </div>
                   </div>
                ))}
             </div>
             <div className="flex justify-between mt-2 text-xs text-slate-500 px-4">
                <span>1 Nov</span>
                <span>15 Nov</span>
                <span>30 Nov</span>
             </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm flex flex-col">
             <h3 className="font-bold text-white mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500"/> Recent Transactions</h3>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[300px] pr-2">
                {users.slice(0, 10).map((u, i) => (
                   <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i % 3 === 0 ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                            {i % 3 === 0 ? <RefreshCw className="w-4 h-4"/> : <ShoppingBag className="w-4 h-4"/>}
                         </div>
                         <div>
                            <div className="text-sm font-bold text-slate-200">{i % 3 === 0 ? 'Subscription' : 'Bundle Purchase'}</div>
                            <div className="text-[10px] text-slate-500">{u.displayName || 'User'} • 2m ago</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="font-bold text-white text-sm">+${(Math.random() * 20 + 9).toFixed(2)}</div>
                         <div className="text-[9px] text-emerald-400 bg-emerald-900/30 px-1.5 rounded inline-block">Success</div>
                      </div>
                   </div>
                ))}
             </div>
             <button className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors">
                View All Transactions
             </button>
          </div>
       </div>
    </div>
  );

  const renderSliderConfig = () => (
    <div className="space-y-8 animate-fade-in pb-20">
       {/* (Slider Config Code Remains Same) */}
       {/* Global Settings */}
       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
          <h3 className="font-bold text-white flex items-center gap-2 mb-6">
             <MonitorPlay className="w-5 h-5 text-pink-500" /> Global Slider Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Overlay Opacity</label>
                <input type="range" min="0" max="1" step="0.1" value={sliderSettings.overlayOpacity} onChange={(e)=>setSliderSettings({...sliderSettings, overlayOpacity: parseFloat(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg accent-pink-500" />
                <div className="text-xs text-slate-400 mt-1 text-right">{sliderSettings.overlayOpacity}</div>
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Duration (ms)</label>
                <input type="number" value={sliderSettings.duration} onChange={(e)=>setSliderSettings({...sliderSettings, duration: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white" />
             </div>
          </div>
       </div>

       {/* NEW: AI Banner Generator */}
       <div className="bg-slate-900 p-6 rounded-2xl border-2 border-indigo-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles className="w-32 h-32 text-indigo-500" /></div>
          
          <h3 className="font-bold text-white flex items-center gap-2 mb-6 text-xl relative z-10">
             <BrainCircuit className="w-6 h-6 text-indigo-400" /> AI Banner Studio
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
             <div className="space-y-4">
                
                {/* 1. Layout & Target Controls */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1"><Layout className="w-3 h-3" /> Target Page</label>
                      <select 
                        value={genTargetSection}
                        onChange={(e) => setGenTargetSection(e.target.value as any)}
                        className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 text-xs"
                      >
                         <option value="landing">Main Landing</option>
                         <option value="create">Create Page</option>
                         <option value="shop">Shop</option>
                         <option value="learn">Learn Hub</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1"><Maximize className="w-3 h-3" /> Height</label>
                      <select 
                        value={sliderSettings.height}
                        onChange={(e) => setSliderSettings({...sliderSettings, height: e.target.value as any})}
                        className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 text-xs"
                      >
                         <option value="compact">Compact (Header)</option>
                         <option value="medium">Medium (Standard)</option>
                         <option value="large">Large (Showcase)</option>
                         <option value="cinematic">Cinematic (Hero)</option>
                      </select>
                   </div>
                   <div className="col-span-2">
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-800 p-2 rounded-lg border border-slate-700 hover:bg-slate-750 transition-colors">
                         <input type="checkbox" checked={sliderSettings.fullWidth} onChange={(e)=>setSliderSettings({...sliderSettings, fullWidth: e.target.checked})} className="rounded bg-slate-700 border-slate-500 accent-indigo-500" />
                         <span className="text-xs font-bold uppercase">Full Width Layout</span>
                      </label>
                   </div>
                </div>

                {/* 2. Generation Prompt */}
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Visual Description</label>
                   <textarea 
                     value={genPrompt}
                     onChange={(e) => setGenPrompt(e.target.value)}
                     placeholder="E.g. A futuristic digital classroom with holograms of planets..."
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm min-h-[80px]"
                   />
                </div>

                {/* 3. Text & CTA Controls */}
                <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Text Overlay & Typography</label>
                      <label className="flex items-center gap-2 text-xs text-indigo-400 cursor-pointer">
                         <input type="checkbox" checked={autoGenText} onChange={(e)=>setAutoGenText(e.target.checked)} className="rounded bg-slate-700 border-slate-500 accent-indigo-500" />
                         Auto-Generate Content
                      </label>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Font Family</label>
                         <select value={genFontFamily} onChange={e=>setGenFontFamily(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs text-white">
                            {BANNER_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Text Scale</label>
                         <select value={genFontSize} onChange={e=>setGenFontSize(e.target.value as any)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs text-white">
                            <option value="small">Small / Modern</option>
                            <option value="medium">Medium (Default)</option>
                            <option value="large">Large / Hero</option>
                            <option value="xl">Extra Large</option>
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Title" value={genTitle} onChange={e=>setGenTitle(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white" disabled={autoGenText && !generatedBannerUrl} />
                      <input type="text" placeholder="Subtitle" value={genSubtitle} onChange={e=>setGenSubtitle(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white" disabled={autoGenText && !generatedBannerUrl} />
                   </div>
                   
                   <div className="border-t border-slate-700/50 my-2 pt-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Call to Action Button</label>
                      <div className="grid grid-cols-2 gap-3">
                         <input type="text" placeholder="Button Label (e.g. 'Get Started')" value={genCtaLabel} onChange={e=>setGenCtaLabel(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white" />
                         <input type="text" placeholder="Link URL (e.g. /#shop)" value={genCtaLink} onChange={e=>setGenCtaLink(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white" />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Alignment</label>
                      <select value={genTextPosition} onChange={e=>setGenTextPosition(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white">
                         <option value="left">Left Align</option>
                         <option value="center">Center Align</option>
                         <option value="right">Right Align</option>
                      </select>
                   </div>
                </div>

                <button 
                  onClick={handleGenerateBanner}
                  disabled={isGeneratingBanner || !genPrompt}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
                >
                   {isGeneratingBanner ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                   Generate Banner
                </button>
             </div>

             {/* Preview Area */}
             <div className="bg-black/40 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden min-h-[400px]">
                {generatedBannerUrl ? (
                   <div className="w-full h-full relative group flex flex-col">
                      <div className="flex-1 relative w-full overflow-hidden">
                          {/* Using Universal Slider as Preview with isPreview prop */}
                          <UniversalSlider 
                             slides={[{
                                id: 'preview', 
                                type: 'image', 
                                url: generatedBannerUrl, 
                                title: genTitle, 
                                subtitle: genSubtitle, 
                                ctaLabel: genCtaLabel, 
                                ctaLink: genCtaLink,
                                textPosition: genTextPosition,
                                fontFamily: genFontFamily,
                                fontSize: genFontSize
                             }]}
                             settings={{...sliderSettings, fullWidth: true}}
                             className="h-full"
                             isPreview={true} // Triggers scaling logic
                          />
                      </div>
                      
                      <div className="absolute bottom-4 right-4 flex gap-2 z-50">
                         <button 
                           onClick={() => setGeneratedBannerUrl(null)}
                           className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-600"
                         >
                            Discard
                         </button>
                         <button 
                           onClick={handleSaveGeneratedBanner}
                           className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold text-xs flex items-center gap-2 shadow-lg border border-emerald-500"
                         >
                            <Save className="w-4 h-4" /> Save to {genTargetSection}
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="text-center text-slate-500 p-8">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Banner Preview</p>
                      <p className="text-xs mt-2 max-w-xs mx-auto">Adjust settings on the left and click Generate to see the result.</p>
                   </div>
                )}
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['landing', 'create', 'shop', 'learn'] as const).map((section) => (
             <div key={section} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-white capitalize">{section} Page Slider</h3>
                   <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Upload
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleSlideUpload(section, e.target.files)} />
                   </label>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
                   {sliders[section]?.map((slide) => (
                      <div key={slide.id} className="flex gap-3 bg-slate-900 p-2 rounded-lg border border-slate-700 group relative items-center">
                         <img src={slide.url} className="w-16 h-10 object-cover rounded bg-slate-800" />
                         <div className="flex-1 min-w-0">
                            <div className="text-xs text-white font-bold truncate">{slide.title || 'Untitled Slide'}</div>
                            <div className="text-[10px] text-slate-500 truncate">{slide.subtitle || 'No subtitle'}</div>
                         </div>
                         <button onClick={() => removeSlide(section, slide.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   ))}
                   {(!sliders[section] || sliders[section]?.length === 0) && (
                      <div className="text-center text-xs text-slate-500 py-4">No slides uploaded.</div>
                   )}
                </div>
             </div>
          ))}
       </div>
       <div className="sticky bottom-6 flex justify-center z-20">
          <button onClick={handleSaveConfig} disabled={savingConfig} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold shadow-xl flex items-center gap-2 transition-all">
            {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save & Publish
          </button>
       </div>
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
                   {['core', 'article', 'deck', 'quiz', 'shorts', 'podcast', 'thumbnail', 'banner'].map(t => (
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
             {activePromptTab === 'article' && <textarea value={articleSystemPrompt} onChange={e=>setArticleSystemPrompt(e.target.value)} className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-blue-300 focus:border-purple-500 outline-none resize-none custom-scrollbar" />}
             {activePromptTab === 'deck' && <textarea value={visualDeckSystemPrompt} onChange={e=>setVisualDeckSystemPrompt(e.target.value)} className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-yellow-300 focus:border-purple-500 outline-none resize-none custom-scrollbar" />}
             {activePromptTab === 'quiz' && <textarea value={quizSystemPrompt} onChange={e=>setQuizSystemPrompt(e.target.value)} className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-orange-300 focus:border-purple-500 outline-none resize-none custom-scrollbar" />}
             {activePromptTab === 'shorts' && <textarea value={shortsSystemPrompt} onChange={e=>setShortsSystemPrompt(e.target.value)} className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-pink-300 focus:border-purple-500 outline-none resize-none custom-scrollbar" />}
             {activePromptTab === 'podcast' && <textarea value={podcastSystemPrompt} onChange={e=>setPodcastSystemPrompt(e.target.value)} className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-indigo-300 focus:border-purple-500 outline-none resize-none custom-scrollbar" />}
             {activePromptTab === 'thumbnail' && <textarea value={thumbnailSystemPrompt} onChange={e=>setThumbnailSystemPrompt(e.target.value)} className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-cyan-300 focus:border-purple-500 outline-none resize-none custom-scrollbar" />}
             {activePromptTab === 'banner' && <textarea value={bannerSystemPrompt} onChange={e=>setBannerSystemPrompt(e.target.value)} className="w-full h-96 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-teal-300 focus:border-purple-500 outline-none resize-none custom-scrollbar" />}
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
                   <select value={modelType} onChange={(e) => setModelType(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none">
                      <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (Best Quality)</option>
                      <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fastest)</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Safety Filter</label>
                   <select value={safetyThreshold} onChange={(e) => setSafetyThreshold(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none">
                      <option value="BLOCK_ONLY_HIGH">Block Only High</option>
                      <option value="BLOCK_NONE">Block None</option>
                   </select>
                </div>
             </div>
             <div className="mt-8 pt-6 border-t border-slate-700">
                <button onClick={handleSaveConfig} disabled={savingConfig} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Deploy Configuration
                </button>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <Lock className="w-5 h-5 text-rose-500 mr-2" />
           <span className="font-bold text-lg tracking-tight text-white">ADMIN<span className="text-slate-500">PANEL</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('site-performance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'site-performance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <LayoutDashboard className="w-5 h-5" /> Site Performance
          </button>
          <button onClick={() => setActiveTab('finance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'finance' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
             <DollarSign className="w-5 h-5" /> Finance Manager
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

      <div className="flex-1 overflow-auto bg-slate-950">
         <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
            <h2 className="text-xl font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">AD</div>
            </div>
         </header>
         
         <div className="p-8">
            {activeTab === 'site-performance' && renderDashboard()}
            {activeTab === 'finance' && renderFinanceManager()}
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





















