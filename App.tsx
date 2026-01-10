
import React, { useState, useEffect } from 'react';
import { 
  AppStep, 
  AppView,
  AppDepartment,
  CreationMode, 
  SUBJECTS, 
  SUBJECT_GROUPS,
  LEVELS, 
  ASPECT_RATIOS, 
  Topic, 
  AspectRatio,
  InfographicFormat,
  ImageResolution,
  FORMATS,
  RESOLUTIONS,
  HistoryItem,
  QrConfig, 
  QrPosition,
  QR_POSITIONS,
  QuizQuestion,
  PresentationSlide,
  ShortsScene,
  AppUser,
  ShopBundle,
  CartItem
} from './src/types';
import { 
  fetchCategories, 
  fetchTopics, 
  generateInfographicImage, 
  fetchSingleTopic, 
  generateArticle, 
  generatePodcast, 
  generateQuiz,
  analyzeSourceMaterial
} from './src/services/geminiService';
import { useAuth } from './src/context/AuthContext';
import { 
  saveHistoryItemToDb, 
  getUserHistory, 
  deleteHistoryItemFromDb, 
  updateHistoryItemInDb,
  saveShopBundleToDb,    // CLOUD SAVE
  getShopBundlesFromDb,   // CLOUD FETCH
  uploadImageToStorage
} from './src/services/dbService';
import { isFirebaseEnabled } from './src/services/firebase';
import { Dropdown } from './components/Dropdown';
import { StepWizard } from './components/StepWizard';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { ImageViewer } from './components/ImageViewer';
import { LoadingProgress } from './components/LoadingProgress';
import { Pricing } from './components/Pricing';
import { UserProfile } from './components/UserProfile';
// Home component removed as requested
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
  Crown, PlayCircle, Film, Maximize2, Lightbulb, Link as LinkIcon, Youtube, CheckCircle2, Eraser, FileType, Upload,
  Volume2
} from 'lucide-react';

// --- INITIAL MOCK DATA FOR SHOP ---
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
  },
  {
    id: '2',
    title: 'Human Anatomy - Skeletal System',
    price: 12.99,
    subject: 'Biology',
    level: 'High School',
    format: 'Infographics',
    itemCount: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&auto=format&fit=crop&q=60',
    gallery: [],
    description: 'Detailed vector diagrams of the human skeletal system.',
    features: ['Vector SVG Source', '2K Resolution', 'Quiz Included']
  }
];

// --- Markdown Renderer ---
const MarkdownRenderer: React.FC<{ content: string; isDarkBg?: boolean }> = ({ content, isDarkBg = false }) => {
  if (!content) return null;
  const cleanContent = content
    .replace(/\*{4,}/g, '') 
    .replace(/\\/g, '')     
    .replace(/^(\s*)\*\*(.*)\*\*(\s*)$/gm, '$1$2$3');

  const paragraphs = cleanContent.split(/\n\n+/);
  const textColor = "text-slate-300"; 
  const boldColor = "text-slate-100";
  const headerColor = "text-white";

  return (
    <div className={`space-y-4 ${textColor} text-base leading-relaxed font-normal`}>
      {paragraphs.map((para, i) => {
        let trimmed = para.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('#')) {
          const level = trimmed.match(/^#+/)?.[0].length || 0;
          const text = trimmed.replace(/^#+\s*/, '');
          if (level === 1) return <h2 key={i} className={`text-2xl font-bold ${headerColor} mt-6 mb-3 border-b border-slate-700 pb-2`}>{renderFormattedText(text, boldColor)}</h2>;
          if (level === 2) return <h3 key={i} className={`text-xl font-bold ${headerColor} mt-5 mb-2`}>{renderFormattedText(text, boldColor)}</h3>;
          if (level >= 3) return <h4 key={i} className={`text-lg font-bold ${headerColor} mt-4 mb-2 uppercase tracking-wide`}>{renderFormattedText(text, boldColor)}</h4>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
             <ul key={i} className="list-disc pl-5 space-y-1 my-2">
                {trimmed.split('\n').map((item, j) => (
                  <li key={j}>{renderFormattedText(item.replace(/^[-*]\s+/, ''), boldColor)}</li>
                ))}
             </ul>
          );
        }
        return <p key={i} className="mb-2">{renderFormattedText(trimmed, boldColor)}</p>;
      })}
    </div>
  );
};

const renderFormattedText = (text: string, boldColorClass: string) => {
  if (!text) return null;
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      if (!part.trim()) return null; 
      return <strong key={index} className={`font-bold ${boldColorClass}`}>{part}</strong>;
    }
    const italicParts = part.split('*');
    if (italicParts.length > 1) {
       return (
         <span key={index}>
            {italicParts.map((subPart, subIndex) => {
               if (subIndex % 2 === 1) return <em key={subIndex} className="italic">{subPart}</em>;
               return <span key={subIndex}>{subPart}</span>;
            })}
         </span>
       );
    }
    return <span key={index}>{part}</span>;
  });
};

function dataURItoBlob(dataURI: string) {
  try {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
  } catch (e) {
    console.error("Blob conversion failed", e);
    return null;
  }
}

const App: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigation State
  const [currentDept, setCurrentDept] = useState<AppDepartment>(AppDepartment.LANDING);
  const [currentView, setCurrentView] = useState<AppView>(AppView.GENERATOR);

  // --- SHOP STATE ---
  // Start with default mock bundles, then merge with Cloud bundles
  const [shopBundles, setShopBundles] = useState<ShopBundle[]>(INITIAL_BUNDLES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ShopBundle | null>(null);

  // Load persistence logic - SWITCHED TO CLOUD DB
  useEffect(() => {
    const loadBundles = async () => {
      try {
        if (isFirebaseEnabled) {
           const cloudBundles = await getShopBundlesFromDb();
           if (cloudBundles.length > 0) {
             setShopBundles([...cloudBundles, ...INITIAL_BUNDLES]);
           }
        }
      } catch (e) {
        console.error("Failed to load shop bundles", e);
      }
    };
    loadBundles();
  }, []);

  // --- HASH ROUTER SYNC ---
  useEffect(() => {
    const processHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'shop') setCurrentDept(AppDepartment.SHOP);
      else if (hash === 'learn') setCurrentDept(AppDepartment.LEARN);
      else if (hash === 'create') { setCurrentDept(AppDepartment.CREATE); setCurrentView(AppView.GENERATOR); }
      else if (hash === 'generator') { setCurrentDept(AppDepartment.CREATE); setCurrentView(AppView.GENERATOR); }
      else if (hash === 'admin') { setCurrentView(AppView.ADMIN); }
      else if (hash === 'landing' || hash === '') { setCurrentDept(AppDepartment.LANDING); }
    };

    processHash(); // Initial check
    window.addEventListener('hashchange', processHash);
    return () => window.removeEventListener('hashchange', processHash);
  }, []);

  const handleNavigate = (dept: AppDepartment, view: AppView = AppView.GENERATOR) => {
    setCurrentDept(dept);
    
    // Default Create to Generator, skipping old Home/Slider
    if (dept === AppDepartment.CREATE && view === AppView.HOME) {
        setCurrentView(AppView.GENERATOR);
    } else {
        setCurrentView(view);
    }
    
    // Clear selected product when moving away from shop or to shop home
    if (dept !== AppDepartment.SHOP) setSelectedProduct(null);
    if (dept === AppDepartment.SHOP && view === AppView.HOME) setSelectedProduct(null);

    // Update URL hash without reloading
    let hash = '';
    if (view === AppView.ADMIN) hash = 'admin';
    else if (dept === AppDepartment.SHOP) hash = 'shop';
    else if (dept === AppDepartment.LEARN) hash = 'learn';
    else if (dept === AppDepartment.CREATE) {
        hash = 'create';
    }
    else hash = ''; // Landing
    
    if (hash) window.history.pushState(null, '', `#${hash}`);
    else window.history.pushState(null, '', window.location.pathname);
  };

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const handleAddToCart = (product: ShopBundle) => {
    setCart(prev => {
        const existing = prev.find(item => item.bundle.id === product.id);
        if (existing) {
            return prev.map(item => item.bundle.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { bundle: product, quantity: 1 }];
    });
    addToast(`${product.title} added to cart`, 'success');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.bundle.id !== id));
  };

  const handleShopSelectProduct = (product: ShopBundle) => {
    setSelectedProduct(product);
    handleNavigate(AppDepartment.SHOP, AppView.PRODUCT);
  };

  const handleAdminSaveBundle = async (bundle: ShopBundle) => {
    // 1. Optimistic Update (Immediate Feedback)
    setShopBundles(prev => [bundle, ...prev]);
    
    // 2. Persistent Save to Cloud (Background)
    try {
      if (isFirebaseEnabled) {
         addToast("Uploading to Cloud Shop...", 'info');
         await saveShopBundleToDb(bundle);
         addToast("Bundle published globally!", 'success');
      } else {
         addToast("Firebase Offline: Bundle not synced.", 'error');
      }
    } catch (e) {
      console.error("Failed to save bundle persistent", e);
      addToast("Failed to upload bundle", 'error');
    }
  };

  // State: Configuration
  const [creationMode, setCreationMode] = useState<CreationMode>(CreationMode.EXPLORER);
  // ... (Keep existing state)
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
  const [qrConfig, setQrConfig] = useState<QrConfig>({
    enabled: false,
    url: '',
    footnote: '',
    position: QrPosition.BOTTOM_RIGHT
  });
  
  const [step, setStep] = useState<AppStep>(AppStep.CONFIG);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [regeneratingTopicId, setRegeneratingTopicId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [generationPrompt, setGenerationPrompt] = useState<string>('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [articleData, setArticleData] = useState<{summary: string, article: string} | null>(null);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [copiedArticle, setCopiedArticle] = useState(false);
  
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);

  const [presentationData, setPresentationData] = useState<PresentationSlide[] | null>(null);

  const [shortsData, setShortsData] = useState<ShortsScene[] | null>(null);
  const [showShortsGenerator, setShowShortsGenerator] = useState(false);
  const [shortsMinimized, setShortsMinimized] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const key = process.env.API_KEY;
    if (!key || key.trim() === "") setIsApiKeyMissing(true);
    else setIsApiKeyMissing(false);
  }, []);

  // --- HISTORY MIGRATION LOGIC ---
  useEffect(() => {
    const syncHistory = async () => {
      if (user && isFirebaseEnabled) {
        let cloudHistory = await getUserHistory(user.uid);
        const localHistoryStr = localStorage.getItem('infographai_history_local');
        if (localHistoryStr) {
           try {
             const localHistory: HistoryItem[] = JSON.parse(localHistoryStr);
             if (localHistory.length > 0) {
                let migratedCount = 0;
                for (const item of localHistory) {
                   const exists = cloudHistory.some(ch => ch.timestamp === item.timestamp && ch.topic.title === item.topic.title);
                   if (!exists) {
                      const { id, userId, ...cleanItem } = item; 
                      await saveHistoryItemToDb(user.uid, cleanItem as any);
                      migratedCount++;
                   }
                }
                localStorage.removeItem('infographai_history_local');
                if (migratedCount > 0) {
                   cloudHistory = await getUserHistory(user.uid);
                   addToast(`Synced ${migratedCount} items to cloud`, "success");
                }
             }
           } catch (e) {
             console.error("Migration failed", e);
           }
        }
        setHistory(cloudHistory);
      } else {
        const saved = localStorage.getItem('infographai_history_local');
        if (saved) {
          try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
        } else {
          setHistory([]);
        }
      }
    };

    syncHistory();
  }, [user]);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handlePlanChange = (plan: 'free' | 'basic' | 'pro') => {
    setCurrentPlan(plan);
    if (plan === 'free') {
      setIsPro(false);
      setQrConfig(prev => ({...prev, enabled: false}));
      addToast("Plan set to Explorer (Free)", "info");
    } else {
      setIsPro(true);
      addToast(`Plan upgraded to ${plan === 'basic' ? 'Scholar' : 'Visionary'}!`, "success");
    }
    handleNavigate(AppDepartment.CREATE, AppView.GENERATOR);
  };

  const handleFormatChange = (val: string) => {
    const selected = val as InfographicFormat;
    if (selected !== InfographicFormat.STANDARD && !isPro) {
      addToast("Pro Plan required. Switching back to Standard.", "info");
      setFormat(InfographicFormat.STANDARD);
    } else {
      setFormat(selected);
    }
  };

  const handleResolutionChange = (val: string) => {
    const selected = val as ImageResolution;
    if (selected !== ImageResolution.RES_1K && !isPro) {
      addToast("Pro Plan required. Switching back to 1K.", "info");
      setResolution(ImageResolution.RES_1K);
    } else {
      setResolution(selected);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToLocalStorage = (itemObj: Omit<HistoryItem, 'id' | 'userId'> & { id?: string }) => {
     let newHistory = [...history];
     if (activeHistoryId) {
        const idx = newHistory.findIndex(h => h.id === activeHistoryId);
        if (idx >= 0) newHistory[idx] = { ...newHistory[idx], ...itemObj } as HistoryItem;
     } else {
        const tempId = Date.now().toString();
        setActiveHistoryId(tempId);
        const newItem: HistoryItem = { id: tempId, ...itemObj as HistoryItem };
        newHistory = [newItem, ...newHistory].slice(0, 10); 
     }
     setHistory(newHistory);
     try {
       localStorage.setItem('infographai_history_local', JSON.stringify(newHistory));
     } catch (e) {
       console.warn("History storage full", e);
       addToast("History full - item saved to session only", "error");
     }
  };

  const saveOrUpdateHistory = async (itemData: Partial<HistoryItem>, base64ToUpload?: string) => {
    if (!selectedTopic) return;
    setIsSaving(true);
    
    try {
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

        if (user && isFirebaseEnabled) {
            if (activeHistoryId) {
                await updateHistoryItemInDb(activeHistoryId, itemData);
                setHistory(prev => prev.map(h =>
                    h.id === activeHistoryId ? { ...h, ...itemData } : h
                ));
            } else {
                const newItem = await saveHistoryItemToDb(user.uid, currentItemObj, base64ToUpload);
                setActiveHistoryId(newItem.id);
                setHistory(prev => [newItem, ...prev]);
            }
        } else {
            saveToLocalStorage(currentItemObj);
        }

    } catch (err: any) {
        addToast(`Cloud save failed: ${err.message}`, "error");
        const fallbackItemObj = {
            ...itemData,
            topic: selectedTopic,
            subject: subject || 'Custom Topic',
            level: level || 'General',
            imageUrl: base64ToUpload || generatedImage || '',
            prompt: generationPrompt,
            timestamp: Date.now(),
            format: format,
            qrConfig: qrConfig.enabled ? qrConfig : undefined
        };
        saveToLocalStorage(fallbackItemObj);
    } finally {
        setIsSaving(false);
    }
  };

  const deleteHistoryItem = async (id: string, storagePath: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this infographic?")) {
      if (user && isFirebaseEnabled) {
        await deleteHistoryItemFromDb(id, storagePath);
        setHistory(prev => prev.filter(h => h.id !== id));
      } else {
        const newHistory = history.filter(h => h.id !== id);
        setHistory(newHistory);
        localStorage.setItem('infographai_history_local', JSON.stringify(newHistory));
      }
      addToast("Deleted", "info");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear ALL history? This cannot be undone.")) return;
    
    if (user && isFirebaseEnabled) {
       addToast("Cloud history cleared from view. Refresh to re-sync if needed.", "info");
       setHistory([]);
    } else {
       localStorage.removeItem('infographai_history_local');
       setHistory([]);
       addToast("Local history cleared", "success");
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setSubject(item.subject);
    setLevel(item.level);
    setSelectedTopic(item.topic);
    setGeneratedImage(item.imageUrl); 
    setGenerationPrompt(item.prompt);
    setFormat(item.format || InfographicFormat.STANDARD);
    setActiveHistoryId(item.id);
    if (item.qrConfig) setQrConfig(item.qrConfig);
    else setQrConfig(prev => ({...prev, enabled: false}));

    setArticleData(null);
    setShowArticle(false);
    setPodcastScript(null);
    setAudioUrl(null); 
    setQuizData(null);
    setPresentationData(null);
    setShortsData(null);

    if (item.topic.sourceContent) {
        setCreationMode(CreationMode.TRANSFORMER);
    } else {
        setCreationMode(CreationMode.EXPLORER);
    }

    handleNavigate(AppDepartment.CREATE, AppView.GENERATOR);
    setStep(AppStep.RESULT);
  };

  useEffect(() => {
    if (creationMode === CreationMode.EXPLORER && subject && level) {
      const loadCategories = async () => {
        setCategoriesLoading(true);
        setCategory('');
        try {
          const cats = await fetchCategories(subject, level);
          setCategories(cats);
        } catch (err) {
          console.error(err);
          addToast("Failed to load categories", "error");
        } finally {
          setCategoriesLoading(false);
        }
      };
      const timer = setTimeout(loadCategories, 500);
      return () => clearTimeout(timer);
    } else {
      setCategories([]);
    }
  }, [subject, level, creationMode]);

  const handleGenerateTopics = async () => {
    if (creationMode === CreationMode.EXPLORER) {
        if (!subject || !level || !category) return;
        setTopicsLoading(true);
        setTopics([]);
        try {
          const results = await fetchTopics(subject, level, category, 6);
          setTopics(results);
          setStep(AppStep.TOPICS);
        } catch (err: any) {
          addToast(`Failed to generate topics: ${err.message || 'Unknown error'}`, "error");
        } finally {
          setTopicsLoading(false);
        }
    } else {
        const inputs = { text: sourceText, image: sourceImage || undefined, url: sourceUrl, idea: sourceIdea };
        const hasContent = inputs.text || inputs.image || inputs.url || inputs.idea;
        if (!hasContent) {
            addToast("Please provide at least one source of content.", "error");
            return;
        }
        setTopicsLoading(true);
        try {
            const topic = await analyzeSourceMaterial(inputs);
            setTopics([topic]); 
            setSelectedTopic(topic); 
            setStep(AppStep.TOPICS);
        } catch (err: any) {
            addToast(`Analysis failed: ${err.message}`, "error");
        } finally {
            setTopicsLoading(false);
        }
    }
  };

  const handleRegenerateSingleTopic = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation(); 
    if (!subject || !level || !category) return;
    setRegeneratingTopicId(topicId);
    try {
      const existingTitles = topics.map(t => t.title);
      const newTopic = await fetchSingleTopic(subject, level, category, existingTitles);
      setTopics(prev => prev.map(t => t.id === topicId ? { ...newTopic, id: t.id } : t));
      addToast("Topic refreshed!", "success");
    } catch (err) {
      addToast("Failed to refresh topic.", "error");
    } finally {
      setRegeneratingTopicId(null);
    }
  };

  const handleRegenerateAnalysis = async () => {
      if (!selectedTopic) return;
      const inputs = { text: sourceText, image: sourceImage || undefined, url: sourceUrl, idea: sourceIdea };
      const hasContent = inputs.text || inputs.image || inputs.url || inputs.idea;
      if (!hasContent) return;
      setRegeneratingTopicId('custom'); 
      try {
          const newTopic = await analyzeSourceMaterial(inputs);
          setSelectedTopic(newTopic);
          setTopics([newTopic]);
          addToast("Analysis regenerated!", "success");
      } catch (err: any) {
          addToast(`Regeneration failed: ${err.message}`, "error");
      } finally {
          setRegeneratingTopicId(null);
      }
  };

  const handleGenerateImage = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true);
    setStep(AppStep.RESULT);
    setGeneratedImage(null);
    setActiveHistoryId(null); 
    setArticleData(null);
    setAudioUrl(null);
    setQuizData(null);
    setPresentationData(null);
    setShortsData(null);
    setShowArticle(false); 

    try {
      const activeSubject = subject || 'General Knowledge';
      const activeLevel = level || 'General Audience';
      const result = await generateInfographicImage(
        selectedTopic, activeSubject, activeLevel, aspectRatio, format, resolution,
        qrConfig.enabled ? qrConfig : undefined
      );
      setGeneratedImage(result.base64Image); 
      setGenerationPrompt(result.refinedPrompt);
      saveOrUpdateHistory({ prompt: result.refinedPrompt, subject: activeSubject, level: activeLevel }, result.base64Image);
      addToast("Infographic created successfully!", "success");
    } catch (err: any) {
      addToast(`Image generation failed: ${err.message}`, "error");
      setStep(AppStep.TOPICS); 
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!selectedTopic) return;
    setIsGeneratingArticle(true);
    setCopiedArticle(false);
    try {
      const data = await generateArticle(selectedTopic, subject || "General", level || "General");
      setArticleData(data);
      setShowArticle(false); 
      addToast("Article generated!", "success");
    } catch (e) {
      addToast("Failed to generate article", "error");
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  const handleCreatePodcast = async () => {
    if (!selectedTopic) return;
    setIsGeneratingAudio(true);
    try {
      const result = await generatePodcast(selectedTopic, subject || "General", level || "General");
      setAudioUrl(result.audioUrl);
      setPodcastScript(result.script);
      addToast("Podcast generated!", "success");
    } catch (e) {
      addToast("Failed to generate podcast", "error");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedTopic) return;
    setIsGeneratingQuiz(true);
    try {
      const questions = await generateQuiz(selectedTopic, subject || "General", level || "General");
      setQuizData(questions);
      addToast("Video Quiz ready to play!", "success");
      setShowQuizPlayer(true); 
    } catch (e) {
      addToast("Failed to generate quiz", "error");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleCopyText = () => {
    if (!articleData) return;
    const fullText = `TITLE: ${selectedTopic?.title}\n\nSUMMARY:\n${articleData.summary}\n\nARTICLE:\n${articleData.article}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedArticle(true);
      setTimeout(() => setCopiedArticle(false), 3000);
      addToast("Article copied to clipboard", "success");
    });
  };

  const handleDownloadDoc = () => {
    if (!articleData) return;
    const processContentForDoc = (text: string) => {
       let processed = text;
       processed = processed.replace(/^\s*\*\*(.*)\*\*\s*$/gm, '$1');
       processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
       processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
       processed = processed.replace(/^### (.*$)/gm, '<h3>$1</h3>');
       processed = processed.replace(/^## (.*$)/gm, '<h2>$1</h2>');
       processed = processed.replace(/^# (.*$)/gm, '<h1>$1</h1>');
       processed = processed.replace(/^- (.*$)/gm, '<li>$1</li>');
       processed = processed.replace(/\n\n/g, '<p>').replace(/\n/g, '<br>');
       return processed;
    };

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${selectedTopic?.title}</title>
      </head>
      <body>
        <h1>${selectedTopic?.title}</h1>
        <div class="summary-box">
          <div class="summary-title">Executive Summary</div>
          <p>${processContentForDoc(articleData.summary)}</p>
        </div>
        <div class="article">${processContentForDoc(articleData.article)}</div>
      </body></html>`;
      
    const blob = new Blob([docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTopic?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTranscript = () => {
    if (!podcastScript) return;
    const blob = new Blob([podcastScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${selectedTopic?.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    const blob = dataURItoBlob(generatedImage);
    if (!blob) { addToast("Download failed: Invalid image data", "error"); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = selectedTopic?.title ? selectedTopic.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'infographic';
    link.download = `${safeTitle}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Download started", "success");
  };

  const handleShare = async () => {
    if (!generatedImage || isSharing) return;
    setIsSharing(true);
    try {
       await new Promise(resolve => setTimeout(resolve, 800)); 
       if (navigator.share) {
         let blob;
         if (generatedImage.startsWith('data:')) {
           const res = await fetch(generatedImage);
           blob = await res.blob();
         } else {
           if (navigator.canShare && navigator.canShare({ url: generatedImage })) {
              await navigator.share({ title: selectedTopic?.title, url: generatedImage });
              return;
           }
           const res = await fetch(generatedImage, { mode: 'cors' });
           blob = await res.blob();
         }
         const file = new File([blob], "infographic.png", { type: "image/png" });
         await navigator.share({ title: selectedTopic?.title, files: [file] });
       }
       addToast("Shared successfully!", "success");
    } catch (err) {
      addToast("Share failed or not supported", "error");
    } finally {
      setIsSharing(false);
    }
  };

  const handleReset = () => {
    setStep(AppStep.CONFIG);
    setGeneratedImage(null);
    setActiveHistoryId(null);
    setTopics([]);
    setSelectedTopic(null);
    setQrConfig(prev => ({...prev, enabled: false}));
  };

  const renderInputForm = (type: 'text' | 'image' | 'idea' | 'url') => {
    // ... (Keep implementation)
    if (type === 'url') {
        return (
          <div className="space-y-6 h-full flex flex-col justify-center animate-fade-in">
             <div className="flex flex-wrap justify-center gap-4 mb-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-slate-300">YouTube Video</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-slate-300">Web Article</span>
                 </div>
             </div>
             <div className="relative">
                <input 
                  type="url"
                  className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl p-4 pl-12 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm text-base"
                  placeholder="Paste link here"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                {sourceUrl && (
                   <button onClick={() => setSourceUrl('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                      <X className="w-5 h-5" />
                   </button>
                )}
             </div>
          </div>
        );
      }
  
      if (type === 'text') {
        return (
          <div className="h-full flex flex-col animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-slate-300">Content / Notes</label>
                {sourceText && (
                   <button onClick={() => setSourceText('')} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <Eraser className="w-3 h-3" /> Clear
                   </button>
                )}
             </div>
             <textarea 
               className="flex-1 w-full min-h-[200px] bg-slate-800 border-2 border-slate-600 rounded-xl p-4 text-slate-300 text-sm focus:border-blue-500 focus:outline-none resize-none shadow-sm transition-all"
               placeholder="Paste your article text, meeting notes, or lesson plan here..."
               value={sourceText}
               onChange={(e) => setSourceText(e.target.value)}
             />
          </div>
        );
      }
  
      if (type === 'image') {
        const isPdf = sourceImage?.startsWith('data:application/pdf');
        return (
          <div className="h-full flex flex-col justify-center animate-fade-in">
              <label className={`
                 flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-slate-800
                 ${sourceImage ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-600 hover:border-blue-500 hover:bg-blue-900/10'}
              `}>
                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {sourceImage ? (
                       <div className="relative group flex flex-col items-center">
                          {isPdf ? (
                             <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-xl">
                                <FileType className="w-16 h-16 text-red-500" />
                                <span className="font-bold text-slate-200">PDF Document Ready</span>
                             </div>
                          ) : (
                             <img src={sourceImage} alt="Preview" className="h-48 object-contain rounded-lg shadow-md" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                             <p className="text-white font-bold">Click to Change</p>
                          </div>
                       </div>
                    ) : (
                       <>
                          <div className="p-4 bg-slate-700 rounded-full mb-4">
                             <Upload className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="mb-2 text-sm text-slate-400"><span className="font-bold text-slate-200">Upload Image or PDF</span></p>
                          <p className="text-xs text-slate-500">PNG, JPG, PDF (MAX. 10MB)</p>
                       </>
                    )}
                 </div>
                 <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleImageUpload} />
              </label>
              {sourceImage && (
                 <div className="text-center mt-4">
                    <button onClick={(e) => { e.preventDefault(); setSourceImage(null); }} className="text-sm text-red-500 hover:text-red-600 underline">Remove File</button>
                 </div>
              )}
          </div>
        );
      }
  
      if (type === 'idea') {
        return (
          <div className="h-full flex flex-col animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-slate-300">Creative Direction</label>
                {sourceIdea && (
                   <button onClick={() => setSourceIdea('')} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <Eraser className="w-3 h-3" /> Clear
                   </button>
                )}
             </div>
             <textarea 
               className="flex-1 w-full min-h-[200px] bg-slate-800 border-2 border-slate-600 rounded-xl p-4 text-slate-300 text-sm focus:border-amber-500 focus:outline-none resize-none shadow-sm transition-all"
               placeholder="E.g., Visualize the water cycle with the sun at the top right. Use blue arrows for water flow..."
               value={sourceIdea}
               onChange={(e) => setSourceIdea(e.target.value)}
             />
          </div>
        );
      }
      return null;
  };

  const renderConfigStep = () => (
    // ... (Keep existing)
    <div className="bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 space-y-8 animate-fade-in relative z-10">
      <div className="bg-slate-900 p-1.5 rounded-xl flex">
         <button 
           onClick={() => setCreationMode(CreationMode.EXPLORER)}
           className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${creationMode === CreationMode.EXPLORER ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <Lightbulb className="w-5 h-5 hidden md:block" /> Discover Topics
         </button>
         <button 
           onClick={() => setCreationMode(CreationMode.TRANSFORMER)}
           className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${creationMode === CreationMode.TRANSFORMER ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <Wand2 className="w-5 h-5 hidden md:block" /> Transform Content
         </button>
      </div>

      {creationMode === CreationMode.EXPLORER ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <Dropdown 
            label={<div className="flex items-center gap-2 text-base font-semibold text-slate-100"><BookOpen className="w-4 h-4 text-blue-500" /> Subject</div>} 
            value={subject} 
            onChange={setSubject} 
            options={SUBJECT_GROUPS} 
          />
          <Dropdown 
            label={<div className="flex items-center gap-2 text-base font-semibold text-slate-100"><GraduationCap className="w-4 h-4 text-blue-500" /> Target Level</div>} 
            value={level} 
            onChange={setLevel} 
            options={LEVELS} 
          />
          <Dropdown 
            label={<div className="flex items-center gap-2 text-base font-semibold text-slate-100"><Layers className="w-4 h-4 text-blue-500" /> Category</div>} 
            value={category} 
            onChange={setCategory} 
            options={categories} 
            loading={categoriesLoading} 
            disabled={!subject || !level} 
            placeholder={!subject || !level ? "Select Subject & Level first" : "Select a category"} 
          />
        </div>
      ) : (
        <div className="animate-fade-in mt-6 mb-10"> 
          <div className="flex flex-col gap-3 md:hidden">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
               Provide at least one of the inputs
             </h3>
             {[
                { id: 'url', icon: LinkIcon, label: "Web Link / YouTube", hasContent: !!sourceUrl },
                { id: 'text', icon: FileText, label: "Paste Text / Notes", hasContent: !!sourceText },
                { id: 'image', icon: ImageIcon, label: "Upload Image", hasContent: !!sourceImage },
                { id: 'idea', icon: Lightbulb, label: "Specific Instructions", hasContent: !!sourceIdea }
             ].map((item) => (
                <div key={item.id} className="w-full">
                   <button
                      onClick={() => setTransformerTab(item.id as any)}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 text-left
                        ${transformerTab === item.id 
                          ? 'border-blue-500 bg-blue-900/20 text-blue-300 shadow-md' 
                          : 'border-transparent bg-slate-800 text-slate-400 hover:bg-slate-700'}
                      `}
                   >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg transition-colors ${transformerTab === item.id ? 'bg-blue-800 text-white' : 'bg-slate-900 text-slate-400'}`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">{item.label}</span>
                      </div>
                      {item.hasContent && (
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                      )}
                   </button>
                   
                   {transformerTab === item.id && (
                      <div className="mt-3 p-4 bg-slate-900 rounded-xl border-2 border-slate-700 animate-slide-down shadow-inner">
                         {renderInputForm(item.id as any)}
                      </div>
                   )}
                </div>
             ))}
          </div>

          <div className="hidden md:grid grid-cols-12 gap-6 min-h-[450px]">
            <div className="col-span-4 flex flex-col h-full">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                 Provide at least one of the inputs
               </h3>
               
               <div className="flex flex-col space-y-3">
                  {[
                    { id: 'url', icon: LinkIcon, label: "Web Link / YouTube", hasContent: !!sourceUrl },
                    { id: 'text', icon: FileText, label: "Paste Text / Notes", hasContent: !!sourceText },
                    { id: 'image', icon: ImageIcon, label: "Upload Image", hasContent: !!sourceImage },
                    { id: 'idea', icon: Lightbulb, label: "Specific Instructions", hasContent: !!sourceIdea }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTransformerTab(item.id as any)}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 text-left group
                        ${transformerTab === item.id 
                          ? 'border-blue-500 bg-blue-900/20 text-blue-300 shadow-md transform scale-[1.02]' 
                          : 'border-transparent bg-slate-800 text-slate-400 hover:bg-slate-700'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg transition-colors ${transformerTab === item.id ? 'bg-blue-800 text-white' : 'bg-slate-900 text-slate-400'}`}>
                          <item.icon className="w-6 h-6" /> 
                        </div>
                        <span className="font-bold text-lg">{item.label}</span> 
                      </div>
                      {item.hasContent && (
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                      )}
                    </button>
                  ))}
               </div>
            </div>

            <div className="col-span-8 bg-slate-900 rounded-3xl border-2 border-slate-700 p-6 relative flex flex-col shadow-inner">
               <div className="flex-1 relative h-full">
                  {renderInputForm(transformerTab)}
               </div>
               
               <div className="mt-auto pt-4 flex items-center justify-end border-t border-slate-800">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4" />
                    Auto-saved
                  </span>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-700">
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-100"><LayoutTemplate className="w-4 h-4 text-blue-500" /> Format</div>} 
          value={format} 
          onChange={handleFormatChange} 
          options={FORMATS} 
        />
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-100"><Maximize className="w-4 h-4 text-blue-500" /> Resolution</div>} 
          value={resolution} 
          onChange={handleResolutionChange} 
          options={RESOLUTIONS} 
        />
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-100"><Monitor className="w-4 h-4 text-blue-500" /> Aspect Ratio</div>} 
          value={aspectRatio} 
          onChange={(val) => setAspectRatio(val as AspectRatio)} 
          options={ASPECT_RATIOS} 
        />
      </div>
        
      <div className="flex flex-col md:flex-row gap-6">
        <div className={`flex-1 bg-slate-700/30 p-4 rounded-xl border border-slate-700 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <QrCode className="w-5 h-5 text-indigo-500" /> Smart QR Embed
                {!isPro && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">PRO</span>}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={qrConfig.enabled} onChange={e => setQrConfig({...qrConfig, enabled: e.target.checked})} className="sr-only peer" disabled={!isPro} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {qrConfig.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target URL</label>
                  <input type="text" value={qrConfig.url} onChange={e => setQrConfig({...qrConfig, url: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Position</label>
                  <select value={qrConfig.position} onChange={e => setQrConfig({...qrConfig, position: e.target.value as QrPosition})} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm">
                    {QR_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
            )}
        </div>

        {!isPro && (
           <div className="w-full md:w-48 flex items-center">
              <button 
                onClick={() => handleNavigate(AppDepartment.CREATE, AppView.PRICING)}
                className="w-full h-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold shadow-lg flex flex-col items-center justify-center gap-1 transition-all hover:scale-105"
              >
                 <span className="flex items-center gap-2"><Crown className="w-5 h-5"/> Upgrade</span>
                 <span className="text-xs text-amber-100 font-normal">Unlock 4K & Tools</span>
              </button>
           </div>
        )}
      </div>

      <div className="pt-6 flex justify-end">
        <button 
          onClick={handleGenerateTopics} 
          disabled={
            topicsLoading || isApiKeyMissing || 
            (creationMode === CreationMode.EXPLORER && !category) || 
            (creationMode === CreationMode.TRANSFORMER && !sourceText && !sourceImage && !sourceIdea && !sourceUrl)
          } 
          className="flex items-center gap-3 px-8 py-4 bg-blue-700 text-white rounded-xl font-bold text-lg hover:bg-blue-800 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {topicsLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : creationMode === CreationMode.TRANSFORMER ? <Wand2 className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />} 
          {isApiKeyMissing ? "Missing API Key" : creationMode === CreationMode.TRANSFORMER ? "Analyze & Design" : "Generate Topics"}
        </button>
      </div>
    </div>
  );

  const renderTopicsStep = () => (
    // ... (Keep existing)
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-300 flex items-center gap-2">
           {creationMode === CreationMode.TRANSFORMER ? <Check className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
           {creationMode === CreationMode.TRANSFORMER ? "Review Concept" : "Choose a Topic"}
        </h2>
        <button onClick={() => setStep(AppStep.CONFIG)} className="text-slate-500 hover:text-blue-600">← Back to Config</button>
      </div>

      {creationMode === CreationMode.EXPLORER ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((t) => (
            <div key={t.id} onClick={() => setSelectedTopic(t)} className={`relative group cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-xl hover:scale-[1.02] ${selectedTopic?.id === t.id ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-800'}`}>
              <h3 className="font-bold text-slate-100 mb-3 pr-8 text-lg">{t.title}</h3>
              <p className="text-sm text-slate-400">{t.description}</p>
              <button onClick={(e) => handleRegenerateSingleTopic(e, t.id)} disabled={regeneratingTopicId === t.id} className={`absolute top-3 right-3 p-2 rounded-full bg-slate-800 border ${regeneratingTopicId === t.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <RefreshCw className={`w-4 h-4 ${regeneratingTopicId === t.id ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-700">
           {selectedTopic && (
              <div className="space-y-6">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Title (Editable)</label>
                    <input 
                      type="text" 
                      value={selectedTopic.title} 
                      onChange={(e) => setSelectedTopic({...selectedTopic, title: e.target.value})} 
                      className="w-full bg-transparent border-b border-slate-700 text-2xl font-bold text-white py-2 focus:outline-none focus:border-blue-500"
                    />
                 </div>
                 
                 <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-slate-300 mb-2 text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> AI Analysis Summary</h4>
                    <p className="text-slate-400 text-sm">{selectedTopic.description}</p>
                 </div>

                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-xs font-bold text-slate-500 uppercase block">Extracted Content Context (Editable)</label>
                       <button 
                         onClick={handleRegenerateAnalysis} 
                         disabled={regeneratingTopicId === 'custom'}
                         className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-500 disabled:opacity-50"
                       >
                          <RefreshCw className={`w-3 h-3 ${regeneratingTopicId === 'custom' ? 'animate-spin' : ''}`} /> Regenerate from Inputs
                       </button>
                    </div>
                    <textarea 
                       value={selectedTopic.sourceContent || ''}
                       onChange={(e) => setSelectedTopic({...selectedTopic, sourceContent: e.target.value})}
                       className="w-full h-48 p-4 bg-slate-900/50 rounded-xl text-sm font-mono text-slate-400 border border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                       * This extracted context will be used to ensure the infographic, quiz, and videos match your source material exactly. Feel free to refine it.
                    </p>
                 </div>
              </div>
           )}
        </div>
      )}

      {selectedTopic && (
        <div className="flex justify-center mt-10">
          <button onClick={handleGenerateImage} className="flex items-center gap-3 px-8 py-4 bg-blue-700 text-white rounded-full font-bold text-xl shadow-2xl hover:scale-105 border-4 border-blue-200">
            <ImageIcon className="w-7 h-7" /> Generate Infographic
          </button>
        </div>
      )}
    </div>
  );

  const renderResultStep = () => (
    // ... (Keep existing)
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in pb-10">
      {isGenerating ? (
        <LoadingProgress duration={resolution === ImageResolution.RES_4K ? 12000 : 8000} label={`Crafting your ${format} ✨`} />
      ) : generatedImage ? (
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
             <h2 className="text-xl md:text-3xl font-bold text-blue-300">{selectedTopic?.title}</h2>
             <div className="flex justify-center gap-2 text-sm">
                <span className="bg-slate-700 text-white font-medium px-3 py-1 rounded-full">{subject || 'Custom'}</span>
                <span className="bg-slate-700 text-white font-medium px-3 py-1 rounded-full">{level || 'General'}</span>
                {isSaving && <span className="flex items-center gap-1 text-slate-500 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin"/> Saving to cloud...</span>}
             </div>
          </div>

          <div className="relative group rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-800 cursor-zoom-in" onClick={() => setShowLightbox(true)}>
            <img src={generatedImage} alt="Infographic" className="w-full h-auto object-contain max-h-[70vh] mx-auto" />
            <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 opacity-80 group-hover:opacity-100"><ZoomIn className="w-3 h-3" /> Click & Zoom</div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:flex-wrap md:justify-center md:gap-3">
             <button onClick={handleReset} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"><RefreshCw className="w-4 h-4" /> Start Over</button>
             <button onClick={handleGenerateImage} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"><RefreshCw className="w-4 h-4" /> Regenerate</button>
             <button onClick={handleShare} disabled={isSharing} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">{isSharing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Share2 className="w-4 h-4"/>} Share</button>
             <button onClick={handleDownload} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"><Download className="w-4 h-4" /> Download</button>
          </div>

          <hr className="border-slate-800" />

          <div className="flex flex-col gap-6 mt-6 w-full">
            
            <div className="flex flex-col w-full space-y-4">
              <button onClick={handleCreateArticle} disabled={isGeneratingArticle} className="flex items-center gap-3 px-6 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-900/20 transition-all text-left group shadow-sm w-full">
                <div className="flex-shrink-0 p-3 bg-blue-900/50 rounded-full text-blue-400 group-hover:scale-110 transition-transform">
                  {isGeneratingArticle ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-200 text-lg">Create Summary & Article</h4>
                  <p className="text-sm text-slate-400">Generate a 500-word educational guide.</p>
                </div>
              </button>
              
              {articleData && (
                <div className="w-full bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 gap-4">
                     <div className="flex items-center gap-2 font-bold text-slate-200"><FileText className="w-5 h-5 text-blue-600" /> Generated Article</div>
                     <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={handleDownloadDoc} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md"><FileBox className="w-4 h-4"/> Doc</button>
                        <button onClick={handleCopyText} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md">{copiedArticle ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>} Copy</button>
                        <button onClick={() => setShowArticle(!showArticle)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md">
                          {showArticle ? "Fold" : "Read"}
                          {showArticle ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        </button>
                     </div>
                  </div>
                  {showArticle && (
                    <div className="p-6 space-y-6 animate-slide-down">
                      <h1 className="text-xl font-bold text-center pb-2 border-b border-slate-700 text-white">{selectedTopic?.title}</h1>
                      <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-800">
                        <h4 className="font-bold text-blue-300 mb-2 text-xl uppercase tracking-wide">Summary</h4>
                        <MarkdownRenderer content={articleData.summary} isDarkBg={true} />
                      </div>
                      <MarkdownRenderer content={articleData.article} isDarkBg={true} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col w-full space-y-4">
               {selectedTopic && (
                 <PresentationGenerator 
                    topic={selectedTopic}
                    subject={subject || 'Topic'}
                    level={level || 'General'}
                    generatedImage={generatedImage}
                    onSave={(data) => {
                       setPresentationData(data);
                    }}
                    initialData={presentationData}
                 />
               )}
            </div>

            <div className="flex flex-col w-full space-y-4">
              <button 
                onClick={quizData ? () => setShowQuizPlayer(true) : handleCreateQuiz} 
                disabled={isGeneratingQuiz} 
                className="flex items-center gap-3 px-6 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-900/20 transition-all text-left group shadow-sm w-full"
              >
                <div className="flex-shrink-0 p-3 bg-emerald-900/50 rounded-full text-emerald-400 group-hover:scale-110 transition-transform">
                  {isGeneratingQuiz ? <RefreshCw className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-200 text-lg">
                    {quizData ? "Play Classroom Video Quiz" : "Create Classroom Quiz"}
                  </h4>
                  <p className="text-sm text-slate-400">
                    {quizData ? "Ready to launch! Click to start." : "Generate a 10-question video quiz."}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex flex-col w-full space-y-4">
              <button 
                onClick={() => setShowShortsGenerator(true)}
                className="flex items-center gap-3 px-6 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl hover:border-pink-500 hover:bg-pink-900/20 transition-all text-left group shadow-sm w-full"
              >
                <div className="flex-shrink-0 p-3 bg-pink-900/50 rounded-full text-pink-400 group-hover:scale-110 transition-transform">
                  <Film className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-200 text-lg">Cinematic Shorts Studio</h4>
                  <p className="text-sm text-slate-400">
                     {shortsData ? "Watch, Edit or Download your Video." : "Create a 60s/90s deep-dive video."}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex flex-col w-full space-y-4">
              <button onClick={handleCreatePodcast} disabled={isGeneratingAudio} className="flex items-center gap-3 px-6 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl hover:border-purple-500 hover:bg-purple-900/20 transition-all text-left group shadow-sm w-full"
              >
                <div className="flex-shrink-0 p-3 bg-purple-900/50 rounded-full text-purple-400 group-hover:scale-110 transition-transform">
                  {isGeneratingAudio ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-200 text-lg">Create Audio Podcast</h4>
                  <p className="text-sm text-slate-400">Listen to a 2-person discussion.</p>
                </div>
              </button>

              {audioUrl && (
                <div className="w-full bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl animate-fade-in flex flex-col items-center text-center space-y-6">
                   <div>
                      <h3 className="text-xl font-bold text-purple-600 flex items-center justify-center gap-2"><Mic className="w-5 h-5" /> Audio Podcast</h3>
                      <p className="text-sm text-slate-500 mt-1">Between our AI hosts.</p>
                   </div>
                   <audio controls src={audioUrl} className="w-full max-w-md" />
                   {podcastScript && (
                     <div className="w-full max-w-md bg-slate-900 border border-slate-200 p-4 text-left h-48 overflow-y-auto custom-scrollbar rounded-lg">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Transcript</h4>
                        <div className="text-sm"><MarkdownRenderer content={podcastScript} isDarkBg={true} /></div>
                     </div>
                   )}
                   <div className="flex gap-4">
                      <a href={audioUrl} download="podcast.wav" className="text-sm text-slate-400 hover:text-purple-400 underline flex gap-1"><Download className="w-3 h-3" /> Audio</a>
                      {podcastScript && <button onClick={handleDownloadTranscript} className="text-sm text-slate-400 hover:text-purple-400 underline flex gap-1"><FileText className="w-3 h-3" /> Transcript</button>}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
           <p className="text-red-500">Something went wrong.</p>
           <button onClick={() => setStep(AppStep.TOPICS)} className="mt-4 text-blue-600 underline">Back to Topics</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans transition-colors duration-300 relative selection:bg-indigo-500 selection:text-white pb-20 md:pb-0">
        
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        {/* ... (Shorts Minimized, Quiz Player, etc.) ... */}
        {shortsMinimized && selectedTopic && (
           <div 
             onClick={() => { setShortsMinimized(false); setShowShortsGenerator(true); }}
             className="fixed bottom-24 md:bottom-6 right-6 z-[90] bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 cursor-pointer hover:scale-105 transition-transform flex items-center gap-3 animate-slide-up"
           >
              <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                 <div className="relative w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Film className="w-5 h-5" />
                 </div>
              </div>
              <div>
                 <div className="font-bold text-sm">Generating Video...</div>
                 <div className="text-xs text-slate-400">Click to expand</div>
              </div>
              <Maximize2 className="w-4 h-4 text-slate-500" />
           </div>
        )}

        {showQuizPlayer && quizData && selectedTopic && (
           <QuizPlayer 
             quizData={quizData} 
             topicTitle={selectedTopic.title} 
             onClose={() => setShowQuizPlayer(false)} 
           />
        )}

        {showShortsGenerator && selectedTopic && (
           <ShortsGenerator
             topic={selectedTopic}
             subject={subject || 'Custom'}
             level={level || 'General'}
             onSave={(data) => {
                setShortsData(data);
             }}
             onClose={() => setShowShortsGenerator(false)}
             isMinimized={shortsMinimized}
             onMinimize={setShortsMinimized}
             initialData={shortsData}
           />
        )}

        {currentView === AppView.ADMIN ? (
           <AdminPanel 
             onExit={() => handleNavigate(AppDepartment.LANDING)} 
             onSaveShopBundle={handleAdminSaveBundle} 
           />
        ) : !showQuizPlayer && (!showShortsGenerator || shortsMinimized) && (
          <>
            <GlobalNavbar 
               currentDept={currentDept}
               onNavigate={handleNavigate}
               user={user}
               onOpenAuth={() => setIsAuthModalOpen(true)}
               signOut={() => { signOut(); handleNavigate(AppDepartment.LANDING); }}
               onOpenProfile={() => handleNavigate(AppDepartment.CREATE, AppView.PROFILE)}
               isPro={isPro}
               cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            />

            <main className="pt-8 pb-20 px-4 min-h-[calc(100vh-64px)]">
               {currentDept === AppDepartment.LANDING && (
                  <LandingPage onNavigate={handleNavigate} />
               )}

               {currentDept === AppDepartment.CREATE && (
                  <div className="max-w-7xl mx-auto">
                     {/* Home Slider removed, Create defaults to Generator */}
                     {currentView === AppView.GENERATOR && (
                        <div className="max-w-7xl mx-auto">
                           <StepWizard currentStep={step} />
                           <div className="mt-8">
                              {step === AppStep.CONFIG && renderConfigStep()}
                              {step === AppStep.TOPICS && renderTopicsStep()}
                              {step === AppStep.RESULT && renderResultStep()}
                           </div>
                        </div>
                     )}

                     {currentView === AppView.PRICING && (
                        <Pricing currentPlan={currentPlan} onUpgrade={handlePlanChange} />
                     )}

                     {currentView === AppView.PROFILE && (
                        <UserProfile 
                          user={user} 
                          history={history} 
                          onLoadHistory={loadFromHistory} 
                          onDeleteHistory={deleteHistoryItem}
                          onClearHistory={handleClearHistory} 
                          onSignOut={() => { signOut(); handleNavigate(AppDepartment.LANDING); }}
                          isPro={isPro}
                          onOpenAdmin={() => handleNavigate(AppDepartment.CREATE, AppView.ADMIN)}
                        />
                     )}
                  </div>
               )}

               {/* SHOP DEPARTMENT ROUTING */}
               {currentDept === AppDepartment.SHOP && (
                  <>
                    {(currentView === AppView.HOME || currentView === undefined) && (
                       <Shop 
                         bundles={shopBundles}
                         onSelectProduct={handleShopSelectProduct}
                         onAddToCart={handleAddToCart}
                       />
                    )}
                    {currentView === AppView.PRODUCT && selectedProduct && (
                       <ProductPage 
                         product={selectedProduct}
                         onBack={() => handleNavigate(AppDepartment.SHOP, AppView.HOME)}
                         onAddToCart={handleAddToCart}
                       />
                    )}
                    {currentView === AppView.CART && ( 
                       <CartPage 
                         items={cart} 
                         onRemove={handleRemoveFromCart}
                         onCheckout={() => alert("Proceeding to secure checkout...")}
                         onContinueShopping={() => handleNavigate(AppDepartment.SHOP, AppView.HOME)}
                       />
                    )}
                  </>
               )}

               {currentDept === AppDepartment.LEARN && (
                  <div className="text-center py-20 animate-fade-in">
                     <GraduationCap className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                     <h2 className="text-3xl font-bold text-white mb-2">Learning Hub</h2>
                     <p className="text-slate-400">Educational articles and tutorials coming soon.</p>
                  </div>
               )}
            </main>

            {/* ... (Lightbox & Toast) ... */}
            {showLightbox && generatedImage && (
              <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm animate-fade-in flex flex-col">
                 <button onClick={() => setShowLightbox(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-50 p-2">
                    <X className="w-8 h-8" />
                 </button>
                 <ImageViewer src={generatedImage} alt={selectedTopic?.title} />
              </div>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </>
        )}
    </div>
  );
};

export default App;
































