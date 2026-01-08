
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../src/types';
import { Play, Pause, SkipForward, X, Clock, CheckCircle2, Trophy, RotateCcw, XCircle, Volume2, VolumeX, FileText, Printer, Settings2 } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface QuizPlayerProps {
  quizData: QuizQuestion[];
  topicTitle: string;
  onClose: () => void;
}

interface QuizConfig {
  questionCount: number;
  musicEnabled: boolean;
  thinkingTime: number;
  pointsPerQuestion: number;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizData, topicTitle, onClose }) => {
  // Phase 'setup' is the new initial state
  const [phase, setPhase] = useState<'setup' | 'intro' | 'question' | 'reveal' | 'end'>('setup');
  
  // Configuration State
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 10,
    musicEnabled: true,
    thinkingTime: 10,
    pointsPerQuestion: 5
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0); 
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  
  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const REVEAL_TIME_AUTO = 6; 

  // Derived Data based on Config
  const activeQuizData = quizData.slice(0, config.questionCount);
  const currentQuestion = activeQuizData[currentQuestionIndex];

  // Initialize Background Music
  useEffect(() => {
    // Switched to a reliable public URL because Google Drive links often fail due to quota/CORS
    const audioUrl = "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/theme_01.mp3";
    
    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.2; 
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle Playback State changes via button & phase
  useEffect(() => {
    if (audioRef.current) {
      // Only play if config allows music AND we are past setup AND not paused AND not ended
      const shouldPlay = config.musicEnabled && phase !== 'setup' && phase !== 'end' && !isMuted && !isPaused;
      
      if (shouldPlay) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.log("Audio play blocked/failed:", e);
                // If autoplay blocked, ensure UI shows mute state if needed, though we default to playing if enabled
            });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, isPaused, phase, config.musicEnabled]);

  // Main Timer Loop
  useEffect(() => {
    let interval: any;

    if (!isPaused && phase !== 'setup') {
      if (phase === 'intro') {
        // Reduced intro time to 2 seconds for snappier feel
        interval = setTimeout(() => {
            setPhase('question');
            setTimer(config.thinkingTime);
        }, 2000);
      } else if (phase === 'question') {
        if (timer > 0) {
          interval = setInterval(() => setTimer((t) => t - 1), 1000);
        } else {
          // Time is up, no answer selected
          setPhase('reveal');
          setTimer(REVEAL_TIME_AUTO); 
        }
      } else if (phase === 'reveal') {
        if (timer > 0) {
          interval = setInterval(() => setTimer((t) => t - 1), 1000);
        } else {
          handleNext();
        }
      }
    }

    return () => {
      clearInterval(interval);
      clearTimeout(interval);
    };
  }, [phase, timer, isPaused, config.thinkingTime]);

  const handleStartQuiz = () => {
    setPhase('intro');
    // If user disabled music in config, we effectively mute the player logic
    if (!config.musicEnabled) {
        setIsMuted(true); 
    } else {
        setIsMuted(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < activeQuizData.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null); 
      setPhase('question');
      setTimer(config.thinkingTime);
    } else {
      setPhase('end');
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setPhase('setup'); // Go back to setup so they can change settings if they want
    setTimer(config.thinkingTime);
    setIsPaused(false);
  };

  const handleOptionClick = (idx: number) => {
    // Only allow clicking during the question phase
    if (phase === 'question') {
      setSelectedAnswer(idx);
      
      const isCorrect = idx === activeQuizData[currentQuestionIndex].correctAnswerIndex;
      if (isCorrect) {
         setScore(s => s + config.pointsPerQuestion);
      }

      // IMMEDIATE FEEDBACK
      setPhase('reveal');
      setTimer(REVEAL_TIME_AUTO); 
    }
  };

  // Helper to generate HTML for PDF/Print
  const getWorksheetHTML = () => `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 24px; font-weight: bold;">${topicTitle}</div>
            <div style="font-size: 14px; color: #666; margin-top: 5px;">Subject Quiz • ${activeQuizData.length} Questions</div>
          </div>
          <div style="border: 1px solid #ccc; padding: 15px; width: 200px; text-align: left;">
            <div style="font-size: 10px; color: #999; margin-bottom: 25px;">STUDENT NAME</div>
            <div style="border-bottom: 1px solid #000; height: 1px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          ${activeQuizData.map((q, i) => `
            <div style="margin-bottom: 25px; page-break-inside: avoid; border-bottom: 1px dashed #eee; padding-bottom: 20px;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 12px;">${i + 1}. ${q.question}</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
                ${q.options.map((opt, optIdx) => `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 16px; height: 16px; border: 1px solid #333; display: inline-block; border-radius: 50%;"></span>
                    <span style="font-weight: bold;">${['A','B','C','D'][optIdx]})</span> ${opt}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 50px; padding-top: 20px; font-size: 12px; text-align: center; color: #999;">Generated by InfoPic</div>

        <!-- Answer Key (New Page) -->
        <div style="margin-top: 50px; page-break-before: always;">
          <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Teacher Answer Key</h2>
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px; font-size: 12px;">
             ${activeQuizData.map((q, i) => `
               <div style="padding: 10px; background: #f9f9f9; border-radius: 5px;">
                 <strong>${i+1}:</strong> ${['A','B','C','D'][q.correctAnswerIndex]} - ${q.options[q.correctAnswerIndex]}
                 <div style="color:#666; margin-top:4px;"><em>Explanation: ${q.explanation}</em></div>
               </div>
             `).join('')}
          </div>
        </div>
      </div>
  `;

  const handlePrintWorksheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print the worksheet.");
        return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Quiz Worksheet - ${topicTitle}</title></head>
      <body>${getWorksheetHTML()}<script>window.onload = () => { setTimeout(() => window.print(), 500); };</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    if (typeof html2pdf === 'undefined') {
      alert("PDF generator not loaded yet. Please try again in a moment.");
      return;
    }
    
    // Create a temporary container
    const element = document.createElement('div');
    element.innerHTML = getWorksheetHTML();
    document.body.appendChild(element); // Append to body so it can render styles properly if needed, but usually hidden works

    const opt = {
      margin:       0.5,
      filename:     `Quiz_${topicTitle.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate
    html2pdf().from(element).set(opt).save().then(() => {
        document.body.removeChild(element); // Cleanup
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans animate-fade-in text-white">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Video Quiz</span>
          <h2 className="font-bold text-lg truncate max-w-md hidden md:block">{topicTitle}</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
           {phase !== 'setup' && score > 0 && (
             <div className="flex items-center gap-2 text-amber-400 font-bold animate-pulse mr-4">
               <Trophy className="w-5 h-5" /> {score} pts
             </div>
           )}
           
           {phase !== 'setup' && (
             <button 
               onClick={() => setIsMuted(!isMuted)} 
               className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
               title={isMuted ? "Unmute Music" : "Mute Music"}
             >
               {isMuted ? <VolumeX className="w-6 h-6 text-red-400" /> : <Volume2 className="w-6 h-6 text-emerald-400" />}
             </button>
           )}

           <button 
             onClick={handlePrintWorksheet} 
             className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
             title="Print Worksheet"
           >
             <Printer className="w-6 h-6" />
           </button>

           <div className="h-6 w-px bg-slate-700 mx-2"></div>

           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
             <X className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20 -z-10" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        
        {/* SETUP PHASE */}
        {phase === 'setup' && (
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 max-w-lg w-full animate-zoom-in">
             <div className="text-center mb-8">
               <Settings2 className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
               <h2 className="text-2xl font-bold text-white">Quiz Configuration</h2>
               <p className="text-slate-400 mt-2 text-sm">Customize the experience for your class.</p>
             </div>

             <div className="space-y-5">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Questions</label>
                   <select 
                     value={config.questionCount}
                     onChange={(e) => setConfig({...config, questionCount: parseInt(e.target.value)})}
                     className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                   >
                     {[5, 10, 15, 20].map(n => (
                        <option key={n} value={n} disabled={n > quizData.length}>{n} Questions {n > quizData.length ? '(N/A)' : ''}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Music</label>
                   <select 
                     value={config.musicEnabled ? "on" : "off"}
                     onChange={(e) => setConfig({...config, musicEnabled: e.target.value === 'on'})}
                     className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                   >
                     <option value="on">Music On</option>
                     <option value="off">Music Off</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thinking Time</label>
                   <select 
                     value={config.thinkingTime}
                     onChange={(e) => setConfig({...config, thinkingTime: parseInt(e.target.value)})}
                     className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                   >
                     <option value={5}>5 Seconds</option>
                     <option value={10}>10 Seconds (Default)</option>
                     <option value={15}>15 Seconds</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Points / Question</label>
                   <select 
                     value={config.pointsPerQuestion}
                     onChange={(e) => setConfig({...config, pointsPerQuestion: parseInt(e.target.value)})}
                     className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                   >
                     <option value={2}>2 Points</option>
                     <option value={5}>5 Points (Default)</option>
                     <option value={10}>10 Points</option>
                   </select>
                 </div>
               </div>
             </div>

             <div className="mt-8">
               <button 
                 onClick={handleStartQuiz}
                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
               >
                 <Play className="w-5 h-5 fill-current" /> Start Quiz
               </button>
             </div>
          </div>
        )}

        {/* INTRO PHASE */}
        {phase === 'intro' && (
          <div className="text-center animate-zoom-in">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
              Get Ready!
            </h1>
            <p className="text-2xl text-slate-300">{activeQuizData.length} Questions coming up...</p>
          </div>
        )}

        {/* QUESTION & REVEAL PHASE */}
        {(phase === 'question' || phase === 'reveal') && (
          <div className="w-full max-w-5xl flex flex-col h-full justify-between animate-fade-in">
            {/* Question Text */}
            <div className="text-center mb-4 md:mb-8 mt-4 md:mt-0">
               <div className="inline-block px-4 py-1 bg-slate-800 rounded-full text-slate-400 text-sm font-bold mb-4 border border-slate-700">
                 Question {currentQuestionIndex + 1} / {activeQuizData.length}
               </div>
               <h2 className="text-2xl md:text-4xl font-bold leading-tight drop-shadow-xl">
                 {currentQuestion.question}
               </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1 content-center">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === currentQuestion.correctAnswerIndex;
                const isSelected = selectedAnswer === idx;
                
                let cardStyle = "bg-slate-800/80 border-slate-700 hover:border-slate-500 cursor-pointer hover:bg-slate-800";
                
                if (phase === 'question') {
                   if (isSelected) {
                     cardStyle = "bg-indigo-900/50 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] transform scale-[1.02]";
                   }
                } else if (phase === 'reveal') {
                  if (isCorrect) {
                    cardStyle = "bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 z-10";
                  } else if (isSelected && !isCorrect) {
                    cardStyle = "bg-red-900/80 border-red-500 opacity-100";
                  } else {
                    cardStyle = "bg-slate-800/40 border-slate-800 opacity-40 grayscale";
                  }
                }

                return (
                  <button 
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={phase === 'reveal'}
                    className={`relative p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 text-left group ${cardStyle}`}
                  >
                    <div className={`
                      w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg border-2 transition-colors
                      ${phase === 'question' && isSelected ? 'bg-indigo-500 border-indigo-300 text-white' : ''}
                      ${phase === 'question' && !isSelected ? 'bg-slate-700 border-slate-600 text-slate-300 group-hover:border-slate-400' : ''}
                      ${phase === 'reveal' && isCorrect ? 'bg-white text-emerald-600 border-white' : ''}
                      ${phase === 'reveal' && isSelected && !isCorrect ? 'bg-red-500 text-white border-red-300' : ''}
                      ${phase === 'reveal' && !isSelected && !isCorrect ? 'bg-slate-700 border-slate-600 text-slate-400' : ''}
                    `}>
                      {['A','B','C','D'][idx]}
                    </div>
                    
                    <span className="text-base md:text-xl font-medium">{option}</span>
                    
                    {phase === 'reveal' && isCorrect && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-white animate-bounce" />
                    )}
                    {phase === 'reveal' && isSelected && !isCorrect && (
                      <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-red-200" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation (Reveal Only) */}
            {phase === 'reveal' && (
               <div className="mt-6 p-4 bg-blue-900/40 border border-blue-500/30 rounded-xl text-center animate-slide-up">
                  <p className="text-blue-200 text-base md:text-lg">💡 {currentQuestion.explanation}</p>
               </div>
            )}
          </div>
        )}

        {/* END PHASE */}
        {phase === 'end' && (
          <div className="text-center animate-zoom-in">
            <Trophy className="w-32 h-32 text-amber-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-5xl font-bold text-white mb-4">Quiz Complete!</h1>
            <p className="text-2xl text-slate-300 mb-2">Final Score: <span className="text-emerald-400 font-bold">{score}</span></p>
            <p className="text-lg text-slate-500 mb-8">Great job reviewing {topicTitle}.</p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleRestart}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5"/> Replay Quiz
              </button>
              <button 
                onClick={handlePrintWorksheet} 
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold text-lg transition-colors flex items-center gap-2 border border-slate-500"
              >
                <Printer className="w-5 h-5"/> Print Worksheet
              </button>
              <button 
                onClick={handleDownloadPDF} 
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-lg transition-colors flex items-center gap-2 border border-emerald-500 shadow-lg"
              >
                <FileText className="w-5 h-5"/> Download PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="h-24 bg-slate-900 border-t border-slate-800 px-4 md:px-8 flex items-center gap-6">
         {/* Play/Pause */}
         <button 
           onClick={() => setIsPaused(!isPaused)}
           className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
           disabled={phase === 'end' || phase === 'setup'}
         >
           {isPaused ? <Play className="w-5 h-5 ml-1" /> : <Pause className="w-5 h-5" />}
         </button>

         {/* Timeline / Progress */}
         <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
               <span className={phase === 'reveal' ? 'animate-pulse text-emerald-400' : ''}>
                 {phase === 'intro' ? 'Intro' : phase === 'end' ? 'Finished' : phase === 'reveal' ? 'Answer Review' : phase === 'setup' ? 'Setup' : 'Time Remaining'}
               </span>
               <span>{phase === 'question' ? `${timer}s` : ''}</span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
               {/* Global Progress (Background) */}
               <div 
                 className="absolute top-0 left-0 h-full bg-slate-700 transition-all duration-500"
                 style={{ width: `${((currentQuestionIndex) / activeQuizData.length) * 100}%` }}
               />
               
               {/* Timer Bar (Foreground) */}
               {phase === 'question' && (
                 <div 
                   className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear bg-indigo-500"
                   style={{ width: `${(timer / config.thinkingTime) * 100}%` }}
                 />
               )}
            </div>
         </div>

         {/* Skip Button */}
         <button 
           onClick={handleNext}
           className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold disabled:opacity-30 hidden md:flex"
           disabled={phase === 'end' || phase === 'setup'}
         >
           Skip <SkipForward className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};






