
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppStep, 
  AppView,
  SUBJECTS, 
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
  QR_POSITIONS
} from './src/types';
import { fetchCategories, fetchTopics, generateInfographicImage, fetchSingleTopic, generateArticle, generatePodcast } from './src/services/geminiService';
import { useAuth } from './src/context/AuthContext';
import { saveHistoryItemToDb, getUserHistory, deleteHistoryItemFromDb, updateHistoryItemInDb } from './src/services/dbService';
import { isFirebaseEnabled } from './src/services/firebase';
import { Dropdown } from './components/Dropdown';
import { StepWizard } from './components/StepWizard';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { ImageViewer } from './components/ImageViewer';
import { InfoTooltip } from './components/InfoTooltip';
import { LoadingProgress } from './components/LoadingProgress';
import { Pricing } from './components/Pricing';
import { UserProfile } from './components/UserProfile';
import { Home } from './components/Home';
import { AdminPanel } from './components/AdminPanel'; // Import Admin
import { 
  RefreshCw, Download, ZoomIn, X, Wand2, Image as ImageIcon, Share2, Clock, Trash2, 
  BookOpen, GraduationCap, Layers, LayoutTemplate, Monitor, List, Maximize, Sun, Moon, Laptop,
  FileText, Mic, Play, Pause, Copy, Check, ChevronUp, ChevronDown, QrCode, Lock, Settings, FileBox, ArrowDown, AlertTriangle, LogIn, LogOut, User as UserIcon, Cloud, Crown, Zap, LayoutGrid
} from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'system';

// --- Robust Markdown Renderer ---
const MarkdownRenderer: React.FC<{ content: string; isDarkBg?: boolean }> = ({ content, isDarkBg = false }) => {
  if (!content) return null;

  // 1. Basic cleaning to remove common artifacts
  const cleanContent = content
    .replace(/\*{4,}/g, '') // Remove 4+ asterisks
    .replace(/^#+\s/gm, '') // Remove header hashes (we handle structure via paragraphs)
    .replace(/\\/g, '');    // Remove backslashes

  // 2. Split into paragraphs
  const paragraphs = cleanContent.split(/\n\n+/);

  const textColor = isDarkBg ? "text-white/90" : "text-slate-700 dark:text-slate-300";
  const boldColor = isDarkBg ? "text-white" : "text-slate-900 dark:text-slate-100";

  return (
    <div className={`space-y-4 ${textColor} text-base leading-relaxed font-normal`}>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Handle Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
             <ul key={i} className="list-disc pl-5 space-y-1 my-2">
                {trimmed.split('\n').map((item, j) => (
                  <li key={j}>{renderFormattedText(item.replace(/^[-*]\s+/, ''), boldColor)}</li>
                ))}
             </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={i} className="mb-2">
            {renderFormattedText(trimmed, boldColor)}
          </p>
        );
      })}
    </div>
  );
};

// Naive but stable formatter for Bold/Italic
const renderFormattedText = (text: string, boldColorClass: string) => {
  if (!text) return null;

  // Split by double asterisks for bolding (Simple toggle approach)
  // "Text **Bold** Text" -> ["Text ", "Bold", " Text"]
  const parts = text.split('**');

  return parts.map((part, index) => {
    // Even index is normal text, Odd index is bold text
    if (index % 2 === 1) {
      if (!part.trim()) return null; // Skip empty bolds
      return <strong key={index} className={`font-bold ${boldColorClass}`}>{part}</strong>;
    }
    // Handle Italics within normal text (Single asterisk)
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

// Helper: Convert Base64 DataURI to Blob (Browser independent)
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
  const { user, signIn, signOut, loading: authLoading, isOfflineMode } = useAuth();

  // State: Theme
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // State: View Navigation
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);

  // State: Configuration
  const [subject, setSubject] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  // REMOVED: topicCount state (defaults to 6 in fetch)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [format, setFormat] = useState<InfographicFormat>(InfographicFormat.STANDARD);
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_1K);

  // Pro Features State
  const [isPro, setIsPro] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'basic' | 'pro'>('free'); // For Pricing UI
  const [qrConfig, setQrConfig] = useState<QrConfig>({
    enabled: false,
    url: '',
    footnote: '',
    position: QrPosition.BOTTOM_RIGHT
  });
  
  // State: Flow (Generator)
  const [step, setStep] = useState<AppStep>(AppStep.CONFIG);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [regeneratingTopicId, setRegeneratingTopicId] = useState<string | null>(null);

  // State: Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // Visual only
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null); // Track ID for DB updates
  const [generationPrompt, setGenerationPrompt] = useState<string>('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // State: Extensions (Article & Podcast)
  const [articleData, setArticleData] = useState<{summary: string, article: string} | null>(null);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [showArticle, setShowArticle] = useState(false); // Initially folded
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [copiedArticle, setCopiedArticle] = useState(false);

  // State: System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // ADMIN Secret Trigger
  const [logoClicks, setLogoClicks] = useState(0);

  // Effect: Check API Key
  useEffect(() => {
    const key = process.env.API_KEY;
    if (!key || key.trim() === "") {
      setIsApiKeyMissing(true);
    } else {
      setIsApiKeyMissing(false);
    }
  }, []);

  // Effect: Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) root.classList.add('dark');
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Load history from Firebase or LocalStorage
  useEffect(() => {
    if (user && isFirebaseEnabled) {
      getUserHistory(user.uid)
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to load cloud history", err));
    } else {
      const saved = localStorage.getItem('infographai_history_local');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) { console.error(e); }
      } else {
        setHistory([]);
      }
    }
  }, [user]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Handle Plan Upgrade from Pricing Page
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

  // Helper to save to local storage (fallback)
  const saveToLocalStorage = (itemObj: Omit<HistoryItem, 'id' | 'userId'> & { id?: string }) => {
     let newHistory = [...history];
     if (activeHistoryId) {
        const idx = newHistory.findIndex(h => h.id === activeHistoryId);
        if (idx >= 0) newHistory[idx] = { ...newHistory[idx], ...itemObj } as HistoryItem;
     } else {
        const tempId = Date.now().toString();
        setActiveHistoryId(tempId);
        const newItem: HistoryItem = {
          id: tempId,
          ...itemObj as HistoryItem
        };
        newHistory = [newItem, ...newHistory].slice(0, 10); 
     }
     setHistory(newHistory);
     localStorage.setItem('infographai_history_local', JSON.stringify(newHistory));
  };

  // Centralized Saving Logic with Fallback
  const saveOrUpdateHistory = async (itemData: Partial<HistoryItem>, base64ToUpload?: string) => {
    if (!selectedTopic) return;
    
    const currentItemObj: Omit<HistoryItem, 'id' | 'userId'> = {
      topic: selectedTopic,
      subject,
      level,
      imageUrl: base64ToUpload || generatedImage || '', 
      prompt: generationPrompt,
      timestamp: Date.now(),
      format: format,
      qrConfig: qrConfig.enabled ? qrConfig : undefined,
      ...itemData
    };

    // ONLY attempt cloud save if user is logged in AND Firebase is enabled
    if (user && isFirebaseEnabled) {
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
      } catch (err) {
        console.error("Cloud save failed (likely invalid API key or permissions)", err);
        addToast("Cloud save failed. Saved locally instead.", "error");
        // Fallback to local storage so user doesn't lose work
        saveToLocalStorage(currentItemObj);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Local Mode: Just save to local storage silently
      saveToLocalStorage(currentItemObj);
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

    if (item.articleData) {
      setArticleData(item.articleData);
      setShowArticle(false); 
    } else {
      setArticleData(null);
    }
    
    if (item.transcript) setPodcastScript(item.transcript);
    setAudioUrl(null); 
    
    // Switch View
    setCurrentView(AppView.GENERATOR);
    setStep(AppStep.RESULT);
  };

  useEffect(() => {
    if (subject && level) {
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
  }, [subject, level]);

  const handleGenerateTopics = async () => {
    if (!subject || !level || !category) return;
    setTopicsLoading(true);
    setTopics([]);
    try {
      // DEFAULTING TO 6 TOPICS AS REQUESTED
      const results = await fetchTopics(subject, level, category, 6);
      setTopics(results);
      setStep(AppStep.TOPICS);
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to generate topics: ${err.message || 'Unknown error'}`, "error");
    } finally {
      setTopicsLoading(false);
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

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleGenerateImage = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true);
    setStep(AppStep.RESULT);
    setGeneratedImage(null);
    setActiveHistoryId(null); 
    setArticleData(null);
    setAudioUrl(null);
    setShowArticle(false); 

    try {
      const result = await generateInfographicImage(
        selectedTopic, subject, level, aspectRatio, format, resolution,
        qrConfig.enabled ? qrConfig : undefined
      );
      setGeneratedImage(result.base64Image); 
      setGenerationPrompt(result.refinedPrompt);
      
      saveOrUpdateHistory({ prompt: result.refinedPrompt }, result.base64Image);
      
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
      const data = await generateArticle(selectedTopic, subject, level);
      setArticleData(data);
      setShowArticle(false); 
      saveOrUpdateHistory({ articleData: data }); 
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
      const result = await generatePodcast(selectedTopic, subject, level);
      setAudioUrl(result.audioUrl);
      setPodcastScript(result.script);
      saveOrUpdateHistory({ transcript: result.script }); 
      addToast("Podcast generated!", "success");
    } catch (e) {
      addToast("Failed to generate podcast", "error");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleCopyText = () => {
    if (!articleData) return;
    const fullText = `TITLE: ${selectedTopic?.title}\n\nSUMMARY:\n${articleData.summary}\n\nARTICLE:\n${articleData.article}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText)
        .then(() => {
          setCopiedArticle(true);
          setTimeout(() => setCopiedArticle(false), 3000);
          addToast("Article copied to clipboard", "success");
        })
        .catch(() => addToast("Failed to copy", "error"));
    }
  };

  const handleDownloadDoc = () => {
    if (!articleData) return;
    const processContentForDoc = (text: string) => {
       let processed = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong>$1</strong>')
                         .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                         .replace(/\*(.*?)\*/g, '<em>$1</em>')
                         .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                         .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                         .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                         .replace(/^- (.*$)/gm, '<li>$1</li>')
                         .replace(/\n\n/g, '<p>')
                         .replace(/\n/g, '<br>');
       return processed;
    };
    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${selectedTopic?.title}</title></head>
      <body>
        <h1>${selectedTopic?.title}</h1>
        <h2>Executive Summary</h2><p>${processContentForDoc(articleData.summary)}</p>
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
    
    // Convert Base64 directly to Blob to force download
    // fetching a data URI can sometimes be blocked or treated as navigation
    const blob = dataURItoBlob(generatedImage);
    if (!blob) {
       addToast("Download failed: Invalid image data", "error");
       return;
    }

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

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };
  
  // ADMIN Secret Entry
  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const newVal = prev + 1;
      if (newVal === 5) {
        addToast("Admin Mode Unlocked", "success");
        setCurrentView(AppView.ADMIN);
        return 0;
      }
      return newVal;
    });
    setTimeout(() => setLogoClicks(0), 2000); // Reset if not clicked rapidly
  };

  // --- Render Sections ---

  const renderConfigStep = () => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 space-y-8 animate-fade-in relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-100"><BookOpen className="w-4 h-4 text-blue-500" /> Subject</div>} 
          value={subject} 
          onChange={setSubject} 
          options={SUBJECTS} 
        />
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-100"><GraduationCap className="w-4 h-4 text-blue-500" /> Target Level</div>} 
          value={level} 
          onChange={setLevel} 
          options={LEVELS} 
        />
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-100"><Layers className="w-4 h-4 text-blue-500" /> Category</div>} 
          value={category} 
          onChange={setCategory} 
          options={categories} 
          loading={categoriesLoading} 
          disabled={!subject || !level} 
          placeholder={!subject || !level ? "Select Subject & Level first" : "Select a category"} 
        />
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-100"><LayoutTemplate className="w-4 h-4 text-blue-500" /> Format</div>} 
          value={format} 
          onChange={handleFormatChange} 
          options={FORMATS} 
        />
        {/* Topic Count removed: defaulting to 6 */}
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-100"><Maximize className="w-4 h-4 text-blue-500" /> Resolution</div>} 
          value={resolution} 
          onChange={handleResolutionChange} 
          options={RESOLUTIONS} 
        />
        <Dropdown 
          label={<div className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-100"><Monitor className="w-4 h-4 text-blue-500" /> Aspect Ratio</div>} 
          value={aspectRatio} 
          onChange={(val) => setAspectRatio(val as AspectRatio)} 
          options={ASPECT_RATIOS} 
        />
        
        {/* QR Code Configuration (Pro Feature) */}
        <div className={`col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
              <QrCode className="w-5 h-5 text-indigo-500" /> 
              Smart QR Embed
              {!isPro && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">PRO</span>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={qrConfig.enabled} onChange={e => setQrConfig({...qrConfig, enabled: e.target.checked})} className="sr-only peer" disabled={!isPro} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          {qrConfig.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Target URL</label>
                <input 
                  type="text" 
                  value={qrConfig.url} 
                  onChange={e => setQrConfig({...qrConfig, url: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Position</label>
                <select 
                  value={qrConfig.position} 
                  onChange={e => setQrConfig({...qrConfig, position: e.target.value as QrPosition})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  {QR_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="pt-6 flex justify-end">
        <button 
          onClick={handleGenerateTopics} 
          disabled={!category || topicsLoading || isApiKeyMissing} 
          className="flex items-center gap-3 px-8 py-4 bg-blue-700 text-white rounded-xl font-bold text-lg hover:bg-blue-800 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {topicsLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />} 
          {isApiKeyMissing ? "Missing API Key" : !category ? "Select Category First" : "Generate Topics"}
        </button>
      </div>
    </div>
  );

  const renderTopicsStep = () => (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2"><Wand2 className="w-6 h-6"/> Choose a Topic</h2>
        <button onClick={() => setStep(AppStep.CONFIG)} className="text-slate-500 hover:text-blue-600">← Back to Config</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((t) => (
          <div key={t.id} onClick={() => handleSelectTopic(t)} className={`relative group cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-xl hover:scale-[1.02] ${selectedTopic?.id === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 pr-8 text-lg">{t.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
            <button onClick={(e) => handleRegenerateSingleTopic(e, t.id)} disabled={regeneratingTopicId === t.id} className={`absolute top-3 right-3 p-2 rounded-full bg-slate-100 dark:bg-slate-800 border ${regeneratingTopicId === t.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <RefreshCw className={`w-4 h-4 ${regeneratingTopicId === t.id ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
            </button>
          </div>
        ))}
      </div>
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
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in pb-10">
      {isGenerating ? (
        <LoadingProgress duration={resolution === ImageResolution.RES_4K ? 12000 : 8000} label={`Crafting your ${format} ✨`} />
      ) : generatedImage ? (
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
             <h2 className="text-xl md:text-3xl font-bold text-blue-800 dark:text-blue-300">{selectedTopic?.title}</h2>
             <div className="flex justify-center gap-2 text-sm">
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-medium px-3 py-1 rounded-full">{subject}</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-medium px-3 py-1 rounded-full">{level}</span>
                {isSaving && <span className="flex items-center gap-1 text-slate-500 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin"/> Saving to cloud...</span>}
             </div>
          </div>

          {/* Main Image */}
          <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-800 cursor-zoom-in" onClick={() => setShowLightbox(true)}>
            <img src={generatedImage} alt="Infographic" className="w-full h-auto object-contain max-h-[70vh] mx-auto" />
            <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 opacity-80 group-hover:opacity-100"><ZoomIn className="w-3 h-3" /> Click & Zoom</div>
          </div>

          {/* 4 Uniform Blue Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:flex-wrap md:justify-center md:gap-3">
             <button onClick={handleReset} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"><RefreshCw className="w-4 h-4" /> Start Over</button>
             <button onClick={handleGenerateImage} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"><RefreshCw className="w-4 h-4" /> Regenerate</button>
             <button onClick={handleShare} disabled={isSharing} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">{isSharing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Share2 className="w-4 h-4"/>} Share</button>
             <button onClick={handleDownload} className="flex justify-center items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"><Download className="w-4 h-4" /> Download</button>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Vertical Stack Layout for Extensions */}
          <div className="flex flex-col gap-6 mt-6 w-full">
            
            {/* 1. Article Section */}
            <div className="flex flex-col w-full space-y-4">
              <button
                onClick={handleCreateArticle}
                disabled={isGeneratingArticle}
                className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group shadow-sm w-full"
              >
                <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  {isGeneratingArticle ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Create Summary & Article</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Generate a 500-word educational guide.</p>
                </div>
              </button>
              
              {/* Article Result (Folded by default) */}
              {articleData && (
                <div className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-900/50 gap-4">
                     <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                       <FileText className="w-5 h-5 text-blue-600" /> Generated Article
                     </div>
                     <div className="flex flex-wrap gap-2 justify-end">
                        {/* 3 Identical Blue Buttons */}
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
                      <h1 className="text-xl font-bold text-center pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{selectedTopic?.title}</h1>
                      
                      {/* Summary Block - Lighter background, smaller header */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-xl uppercase tracking-wide">Summary</h4>
                        <MarkdownRenderer content={articleData.summary} isDarkBg={false} />
                      </div>
                      
                      <MarkdownRenderer content={articleData.article} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Podcast Section */}
            <div className="flex flex-col w-full space-y-4">
              <button
                onClick={handleCreatePodcast}
                disabled={isGeneratingAudio}
                className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group shadow-sm w-full"
              >
                <div className="flex-shrink-0 p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  {isGeneratingAudio ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Create Audio Podcast</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Listen to a 2-person discussion.</p>
                </div>
              </button>

              {audioUrl && (
                <div className="w-full bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl animate-fade-in flex flex-col items-center text-center space-y-6">
                   <div>
                      <h3 className="text-xl font-bold text-purple-600 flex items-center justify-center gap-2"><Mic className="w-5 h-5" /> Audio Podcast</h3>
                      <p className="text-sm text-slate-500 mt-1">Between our AI hosts.</p>
                   </div>
                   <audio controls src={audioUrl} className="w-full max-w-md" />
                   {podcastScript && (
                     <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 border border-slate-200 p-4 text-left h-48 overflow-y-auto custom-scrollbar rounded-lg">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Transcript</h4>
                        <div className="text-sm space-y-2 whitespace-pre-wrap">{podcastScript}</div>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 relative overflow-x-hidden transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Main Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => setCurrentView(AppView.HOME)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
             <div onClick={handleLogoClick} className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 select-none cursor-pointer active:scale-90 transition-transform">Ai</div>
             <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight hidden sm:block">InfographAI</h1>
          </button>
          
          <nav className="flex items-center gap-1 sm:gap-4">
             {/* Navigation Links */}
             <button 
                onClick={() => setCurrentView(AppView.GENERATOR)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === AppView.GENERATOR ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
             >
                Create
             </button>
             <button 
                onClick={() => setCurrentView(AppView.PRICING)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === AppView.PRICING ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
             >
                Pricing
             </button>

             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

             <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {getThemeIcon()}
            </button>
            
            {/* User Profile / Auth */}
            {user ? (
               <button onClick={() => setCurrentView(AppView.PROFILE)} className="relative group ml-2">
                  <img src={user.photoURL || ''} alt="User" className={`w-8 h-8 rounded-full border-2 shadow-sm object-cover transition-all ${currentView === AppView.PROFILE ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-100 dark:border-slate-800'}`} />
               </button>
            ) : (
               <button 
                 onClick={signIn} 
                 className="ml-2 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-4 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
               >
                 <LogIn className="w-4 h-4" /> Sign In
               </button>
            )}
          </nav>
        </div>
      </header>

      {/* API Key Warning Banner */}
      {isApiKeyMissing && (
        <div className="bg-red-600 text-white px-4 py-3 text-center font-medium z-50 animate-pulse flex items-center justify-center gap-2 sticky top-16 shadow-md">
          <AlertTriangle className="w-5 h-5 text-white" />
          <span>Action Required: Add <code>API_KEY</code> to your Vercel/Netlify Environment Variables (and redeploy!).</span>
        </div>
      )}
      
      {/* Admin Panel Overlay */}
      {currentView === AppView.ADMIN && (
        <div className="fixed inset-0 z-[200]">
           <AdminPanel onExit={() => setCurrentView(AppView.HOME)} allHistory={history} />
        </div>
      )}

      {/* Main Content Routing (Hidden if Admin is open) */}
      <main className={`min-h-[calc(100vh-64px)] ${currentView === AppView.ADMIN ? 'hidden' : ''}`}>
        {currentView === AppView.HOME && (
          <Home onStartCreate={() => setCurrentView(AppView.GENERATOR)} />
        )}

        {currentView === AppView.GENERATOR && (
          <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">
            <StepWizard currentStep={step} />
            {step === AppStep.CONFIG && renderConfigStep()}
            {step === AppStep.TOPICS && renderTopicsStep()}
            {step === AppStep.RESULT && renderResultStep()}
          </div>
        )}

        {currentView === AppView.PRICING && (
          <Pricing onUpgrade={handlePlanChange} currentPlan={currentPlan} />
        )}

        {currentView === AppView.PROFILE && (
          <UserProfile 
            user={user} 
            history={history} 
            onLoadHistory={loadFromHistory}
            onDeleteHistory={deleteHistoryItem}
            onSignOut={signOut}
            isPro={isPro}
          />
        )}
      </main>

      {showLightbox && generatedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in">
          <button onClick={() => setShowLightbox(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 z-[70] bg-slate-100/50 rounded-full p-2"><X className="w-8 h-8" /></button>
          <div className="relative w-full h-full flex items-center justify-center"><ImageViewer src={generatedImage} /></div>
        </div>
      )}
    </div>
  );
};

export default App;








