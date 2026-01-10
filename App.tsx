import React, { useState, useEffect } from 'react';
import { 
  AppStep, AppView, AppDepartment, CreationMode, SUBJECTS, LEVELS, ASPECT_RATIOS, Topic, AspectRatio,
  InfographicFormat, ImageResolution, FORMATS, RESOLUTIONS, HistoryItem, QrConfig, QrPosition,
  QR_POSITIONS, QuizQuestion, PresentationSlide, ShortsScene, ShopBundle, CartItem
} from './src/types';
import { 
  fetchCategories, fetchTopics, generateInfographicImage, fetchSingleTopic, generateArticle, 
  generatePodcast, generateQuiz, analyzeSourceMaterial
} from './src/services/geminiService';
import { useAuth } from './src/context/AuthContext';
import { 
  saveHistoryItemToDb, getUserHistory, deleteHistoryItemFromDb, updateHistoryItemInDb,
  saveShopBundleToDb, getShopBundlesFromDb
} from './src/services/dbService';
import { isFirebaseEnabled } from './src/services/firebase';
import { Dropdown } from './components/Dropdown';
import { StepWizard } from './components/StepWizard';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { ImageViewer } from './components/ImageViewer';
import { LoadingProgress } from './components/LoadingProgress';
import { Pricing } from './components/Pricing';
import { UserProfile } from './components/UserProfile';
import { Home } from './components/Home';
import { AdminPanel } from './components/AdminPanel';
import { QuizPlayer } from './components/QuizPlayer';
import { PresentationGenerator } from './components/PresentationGenerator';
import { ShortsGenerator } from './components/ShortsGenerator';
import { GlobalNavbar } from './components/GlobalNavbar';
import { LandingPage } from './components/LandingPage';
import { Shop } from './components/Shop';
import { ProductPage } from './components/ProductPage';
import { CartPage } from './components/CartPage';
import { AuthModal } from './components/AuthModal';
import { 
  RefreshCw, Download, ZoomIn, X, Wand2, Image as ImageIcon, Share2, 
  BookOpen, GraduationCap, Layers, LayoutTemplate, Monitor, Maximize, 
  FileText, Mic, Copy, Check, ChevronUp, ChevronDown, QrCode, FileBox, 
  Crown, PlayCircle, Film, Maximize2, Lightbulb, Link as LinkIcon, Youtube, CheckCircle2, Eraser, FileType, Upload
} from 'lucide-react';

const INITIAL_BUNDLES: ShopBundle[] = [
  {
    id: '1',
    title: 'The Solar System - Ultimate Pack',
    price: 9.99,
    originalPrice: 15.00,
    subject: 'Astronomy',
    level: 'Grade 4-6',
    format: 'Infographics',
    itemCount: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1614730341194-75c60740a073?w=800&auto=format&fit=crop&q=60',
    gallery: [],
    description: 'Complete visual guide to planets, moons, and asteroids.',
    features: ['12 High-Res PDFs', 'Print Ready', 'Teacher Notes included']
  }
];

const MarkdownRenderer: React.FC<{ content: string; isDarkBg?: boolean }> = ({ content }) => {
  if (!content) return null;
  const paragraphs = content.replace(/\*{4,}/g, '').split(/\n\n+/);
  return (
    <div className="space-y-4 text-slate-300 text-base leading-relaxed">
      {paragraphs.map((para, i) => {
        let trimmed = para.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('#')) {
          const level = trimmed.match(/^#+/)?.[0].length || 0;
          const text = trimmed.replace(/^#+\s*/, '');
          if (level === 1) return <h2 key={i} className="text-2xl font-bold text-white mt-6 mb-3 border-b border-slate-700 pb-2">{text}</h2>;
          return <h3 key={i} className="text-xl font-bold text-white mt-5 mb-2">{text}</h3>;
        }
        return <p key={i} className="mb-2">{trimmed}</p>;
      })}
    </div>
  );
};

const App: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [currentDept, setCurrentDept] = useState<AppDepartment>(AppDepartment.LANDING);
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [shopBundles, setShopBundles] = useState<ShopBundle[]>(INITIAL_BUNDLES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ShopBundle | null>(null);

  useEffect(() => {
    const loadBundles = async () => {
      if (isFirebaseEnabled) {
         const cloudBundles = await getShopBundlesFromDb();
         if (cloudBundles.length > 0) setShopBundles([...cloudBundles, ...INITIAL_BUNDLES]);
      }
    };
    loadBundles();
  }, []);

  useEffect(() => {
    const processHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'shop') setCurrentDept(AppDepartment.SHOP);
      else if (hash === 'learn') setCurrentDept(AppDepartment.LEARN);
      else if (hash === 'create') { setCurrentDept(AppDepartment.CREATE); setCurrentView(AppView.HOME); }
      else if (hash === 'generator') { setCurrentDept(AppDepartment.CREATE); setCurrentView(AppView.GENERATOR); }
      else if (hash === 'admin') setCurrentView(AppView.ADMIN);
      else if (hash === 'landing' || hash === '') setCurrentDept(AppDepartment.LANDING);
    };
    processHash();
    window.addEventListener('hashchange', processHash);
    return () => window.removeEventListener('hashchange', processHash);
  }, []);

  const handleNavigate = (dept: AppDepartment, view: AppView = AppView.HOME) => {
    setCurrentDept(dept);
    setCurrentView(view);
    if (dept !== AppDepartment.SHOP) setSelectedProduct(null);
  };

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 6000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- GENERATOR STATE ---
  const [creationMode, setCreationMode] = useState<CreationMode>(CreationMode.EXPLORER);
  const [subject, setSubject] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [transformerTab, setTransformerTab] = useState<'text' | 'image' | 'idea' | 'url'>('url');
  const [sourceText, setSourceText] = useState('');
  const [sourceIdea, setSourceIdea] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [format, setFormat] = useState<InfographicFormat>(InfographicFormat.STANDARD);
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_1K);
  const [isPro, setIsPro] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'basic' | 'pro'>('free');
  const [qrConfig, setQrConfig] = useState<QrConfig>({ enabled: false, url: '', footnote: '', position: QrPosition.BOTTOM_RIGHT });
  const [step, setStep] = useState<AppStep>(AppStep.CONFIG);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [generationPrompt, setGenerationPrompt] = useState<string>('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [articleData, setArticleData] = useState<{summary: string, article: string} | null>(null);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);
  const [presentationData, setPresentationData] = useState<PresentationSlide[] | null>(null);
  const [shortsData, setShortsData] = useState<ShortsScene[] | null>(null);
  const [showShortsGenerator, setShowShortsGenerator] = useState(false);
  const [shortsMinimized, setShortsMinimized] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && isFirebaseEnabled) {
      getUserHistory(user.uid).then(setHistory).catch(e => console.error(e));
    } else {
      setHistory([]);
    }
  }, [user]);

  const saveOrUpdateHistory = async (itemData: Partial<HistoryItem>, base64ToUpload?: string) => {
    if (!selectedTopic || !user) return;
    const finalQrConfig = qrConfig.enabled ? qrConfig : undefined;
    const currentItemObj: Omit<HistoryItem, 'id' | 'userId'> = {
      topic: selectedTopic,
      subject: subject || 'Custom Topic',
      level: level || 'General',
      imageUrl: base64ToUpload || generatedImage || '', 
      prompt: generationPrompt,
      timestamp: Date.now(),
      format: format,
      qrConfig: finalQrConfig,
      ...itemData
    };

    setIsSaving(true);
    try {
      if (activeHistoryId) {
        await updateHistoryItemInDb(activeHistoryId, itemData);
        setHistory(prev => prev.map(h => h.id === activeHistoryId ? { ...h, ...itemData } : h));
      } else {
        const newItem = await saveHistoryItemToDb(user.uid, currentItemObj, base64ToUpload);
        setActiveHistoryId(newItem.id);
        setHistory(prev => [newItem, ...prev]);
      }
    } catch (err: any) {
      addToast(`Save failed: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTopics = async () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    setTopicsLoading(true);
    try {
      if (creationMode === CreationMode.EXPLORER) {
          const results = await fetchTopics(subject, level, category, 6);
          setTopics(results);
          setStep(AppStep.TOPICS);
      } else {
          const topic = await analyzeSourceMaterial({ text: sourceText, image: sourceImage || undefined, url: sourceUrl, idea: sourceIdea });
          setTopics([topic]); setSelectedTopic(topic); setStep(AppStep.TOPICS);
      }
    } catch (err: any) { addToast(`Failed: ${err.message}`, "error"); } finally { setTopicsLoading(false); }
  };

  const handleGenerateImage = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true); setStep(AppStep.RESULT); setGeneratedImage(null);
    try {
      const result = await generateInfographicImage(selectedTopic, subject || 'General', level || 'General', aspectRatio, format, resolution, qrConfig.enabled ? qrConfig : undefined);
      setGeneratedImage(result.base64Image); setGenerationPrompt(result.refinedPrompt);
      saveOrUpdateHistory({ prompt: result.refinedPrompt }, result.base64Image);
      addToast("Created!", "success");
    } catch (err: any) { addToast(`Failed: ${err.message}`, "error"); setStep(AppStep.TOPICS); } finally { setIsGenerating(false); }
  };

  const handleCreateArticle = async () => {
    if (!selectedTopic) return;
    setIsGeneratingArticle(true);
    try {
      const data = await generateArticle(selectedTopic, subject || "General", level || "General");
      setArticleData(data); saveOrUpdateHistory({ articleData: data });
    } catch (e) { addToast("Article failed", "error"); } finally { setIsGeneratingArticle(false); }
  };

  const handleReset = () => { setStep(AppStep.CONFIG); setGeneratedImage(null); setActiveHistoryId(null); setTopics([]); setSelectedTopic(null); };

  const renderConfigStep = () => (
    <div className="bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 space-y-8 animate-fade-in">
      <div className="bg-slate-900 p-1.5 rounded-xl flex">
         <button onClick={() => setCreationMode(CreationMode.EXPLORER)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${creationMode === CreationMode.EXPLORER ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Explorer</button>
         <button onClick={() => setCreationMode(CreationMode.TRANSFORMER)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${creationMode === CreationMode.TRANSFORMER ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Transformer</button>
      </div>

      {creationMode === CreationMode.EXPLORER ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Dropdown label="Subject" value={subject} onChange={setSubject} options={SUBJECTS} />
          <Dropdown label="Level" value={level} onChange={setLevel} options={LEVELS} />
          <Dropdown label="Category" value={category} onChange={setCategory} options={categories} loading={categoriesLoading} />
        </div>
      ) : (
        <div className="space-y-4">
           <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="Paste text here..." className="w-full h-40 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none" />
           <div className="grid grid-cols-2 gap-4">
              <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Web Link" className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" />
              <input type="text" value={sourceIdea} onChange={e => setSourceIdea(e.target.value)} placeholder="Specific Idea" className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" />
           </div>
        </div>
      )}

      <div className="pt-6 flex justify-end">
        <button onClick={handleGenerateTopics} disabled={topicsLoading} className="px-8 py-4 bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2">
          {topicsLoading ? <RefreshCw className="animate-spin" /> : <Lightbulb />} {creationMode === CreationMode.TRANSFORMER ? "Analyze" : "Generate Topics"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        
        {showQuizPlayer && quizData && selectedTopic && <QuizPlayer quizData={quizData} topicTitle={selectedTopic.title} onClose={() => setShowQuizPlayer(false)} />}
        {showShortsGenerator && selectedTopic && <ShortsGenerator topic={selectedTopic} subject={subject || 'Custom'} level={level || 'General'} onSave={(data) => { setShortsData(data); saveOrUpdateHistory({ shortsData: data }); }} onClose={() => setShowShortsGenerator(false)} isMinimized={shortsMinimized} onMinimize={setShortsMinimized} initialData={shortsData} />}

        <GlobalNavbar 
           currentDept={currentDept} onNavigate={handleNavigate} user={user}
           onOpenAuth={() => setIsAuthModalOpen(true)}
           signOut={() => { signOut(); handleNavigate(AppDepartment.LANDING); }}
           onOpenProfile={() => handleNavigate(AppDepartment.CREATE, AppView.PROFILE)}
           isPro={isPro} cartCount={cart.length}
        />

        <main className="pt-8 pb-20 px-4">
           {currentDept === AppDepartment.LANDING && <LandingPage onNavigate={handleNavigate} />}
           {currentDept === AppDepartment.CREATE && (
              <div className="max-w-7xl mx-auto">
                 {currentView === AppView.HOME && <Home onStartCreate={() => handleNavigate(AppDepartment.CREATE, AppView.GENERATOR)} />}
                 {currentView === AppView.GENERATOR && (
                    <>
                       <StepWizard currentStep={step} />
                       <div className="mt-8">
                          {step === AppStep.CONFIG && renderConfigStep()}
                          {step === AppStep.TOPICS && (
                            <div className="space-y-6">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {topics.map(t => <div key={t.id} onClick={() => setSelectedTopic(t)} className={`p-6 rounded-xl border-2 cursor-pointer ${selectedTopic?.id === t.id ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-800'}`}>{t.title}</div>)}
                               </div>
                               {selectedTopic && <button onClick={handleGenerateImage} className="mx-auto block px-8 py-4 bg-blue-700 rounded-full font-bold">Generate Visual</button>}
                            </div>
                          )}
                          {step === AppStep.RESULT && (
                             <div className="space-y-8 max-w-4xl mx-auto">
                                {isGenerating ? <LoadingProgress /> : generatedImage && <img src={generatedImage} className="w-full rounded-2xl shadow-2xl" />}
                                <div className="flex gap-4 justify-center">
                                   <button onClick={handleReset} className="px-6 py-2 bg-slate-700 rounded-lg">New</button>
                                   <button onClick={handleCreateArticle} className="px-6 py-2 bg-blue-600 rounded-lg">Article</button>
                                </div>
                                {articleData && <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700"><MarkdownRenderer content={articleData.article} /></div>}
                             </div>
                          )}
                       </div>
                    </>
                 )}
                 {currentView === AppView.PROFILE && <UserProfile user={user} history={history} onLoadHistory={(i) => { setSelectedTopic(i.topic); setGeneratedImage(i.imageUrl); setStep(AppStep.RESULT); handleNavigate(AppDepartment.CREATE, AppView.GENERATOR); }} onDeleteHistory={async (id) => { await deleteHistoryItemFromDb(id); setHistory(h => h.filter(x => x.id !== id)); }} onSignOut={() => { signOut(); handleNavigate(AppDepartment.LANDING); }} isPro={isPro} onOpenAdmin={() => {}} />}
              </div>
           )}
        </main>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;



























