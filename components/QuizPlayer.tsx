
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../src/types';
import { Play, Pause, SkipForward, X, Clock, CheckCircle2, Trophy, RotateCcw, XCircle, Volume2, VolumeX, FileText, Printer } from 'lucide-react';

interface QuizPlayerProps {
  quizData: QuizQuestion[];
  topicTitle: string;
  onClose: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizData, topicTitle, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'question' | 'reveal' | 'end'>('intro');
  const [timer, setTimer] = useState(15);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0); 
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  
  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const QUESTION_TIME = 15;
  const REVEAL_TIME_AUTO = 6; // Seconds to read explanation after clicking

  // Initialize Background Music
  useEffect(() => {
    // Royalty-free upbeat loop (Placeholder URL)
    audioRef.current = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15; // Keep it subtle
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle Playback State
  useEffect(() => {
    if (audioRef.current) {
      if ((phase === 'intro' || phase === 'question' || phase === 'reveal') && !isMuted && !isPaused) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Audio autoplay blocked by browser policy"));
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, isPaused, phase]);

  useEffect(() => {
    let interval: any;

    if (!isPaused) {
      if (phase === 'intro') {
        interval = setTimeout(() => setPhase('question'), 3000);
      } else if (phase === 'question') {
        if (timer > 0) {
          interval = setInterval(() => setTimer((t) => t - 1), 1000);
        } else {
          // Time is up, no answer selected
          setPhase('reveal');
          setTimer(4); // Short reveal
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
  }, [phase, timer, isPaused]);

  const handleNext = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null); // Reset selection
      setPhase('question');
      setTimer(QUESTION_TIME);
    } else {
      setPhase('end');
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setPhase('intro');
    setTimer(QUESTION_TIME);
    setIsPaused(false);
  };

  const handleOptionClick = (idx: number) => {
    if (phase === 'question') {
      setSelectedAnswer(idx);
      
      const isCorrect = idx === quizData[currentQuestionIndex].correctAnswerIndex;
      if (isCorrect) {
         setScore(s => s + 100);
      }

      // IMMEDIATE FEEDBACK: Cut to reveal immediately
      setPhase('reveal');
      setTimer(REVEAL_TIME_AUTO); // Give them time to read the explanation
    }
  };

  const handleDownloadWorksheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to download the worksheet.");
        return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quiz Worksheet - ${topicTitle}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 24px; font-weight: bold; }
          .meta { font-size: 14px; color: #666; margin-top: 5px; }
          .student-box { border: 1px solid #ccc; padding: 15px; width: 200px; text-align: left; }
          .question { margin-bottom: 25px; page-break-inside: avoid; border-bottom: 1px dashed #eee; padding-bottom: 20px; }
          .q-text { font-weight: bold; font-size: 16px; margin-bottom: 12px; }
          .options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; }
          .option { display: flex; align-items: center; gap: 8px; }
          .circle { width: 16px; height: 16px; border: 1px solid #333; display: inline-block; border-radius: 50%; }
          .footer { margin-top: 50px; padding-top: 20px; font-size: 12px; text-align: center; color: #999; }
          .key { margin-top: 50px; page-break-before: always; }
          h2 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .key-grid { display: grid; grid-template-columns: 1fr; gap: 15px; font-size: 12px; }
          .key-item { padding: 10px; background: #f9f9f9; border-radius: 5px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${topicTitle}</div>
            <div class="meta">Subject Quiz • 10 Questions</div>
          </div>
          <div class="student-box">
            <div style="font-size: 10px; color: #999; margin-bottom: 25px;">STUDENT NAME</div>
            <div style="border-bottom: 1px solid #000; height: 1px;"></div>
          </div>
        </div>

        <div class="questions">
          ${quizData.map((q, i) => `
            <div class="question">
              <div class="q-text">${i + 1}. ${q.question}</div>
              <div class="options">
                ${q.options.map((opt, optIdx) => `
                  <div class="option">
                    <span class="circle"></span>
                    <span class="label"><b>${['A','B','C','D'][optIdx]})</b> ${opt}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">Generated by InfographAI</div>

        <!-- Answer Key (New Page) -->
        <div class="key">
          <h2>Teacher Answer Key</h2>
          <div class="key-grid">
             ${quizData.map((q, i) => `
               <div class="key-item">
                 <strong>${i+1}:</strong> ${['A','B','C','D'][q.correctAnswerIndex]} - ${q.options[q.correctAnswerIndex]}
                 <div style="color:#666; margin-top:4px;"><em>Explanation: ${q.explanation}</em></div>
               </div>
             `).join('')}
          </div>
        </div>

        <script>
          window.onload = () => { setTimeout(() => window.print(), 800); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const currentQuestion = quizData[currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans animate-fade-in text-white">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Video Quiz</span>
          <h2 className="font-bold text-lg truncate max-w-md hidden md:block">{topicTitle}</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
           {score > 0 && (
             <div className="flex items-center gap-2 text-amber-400 font-bold animate-pulse mr-4">
               <Trophy className="w-5 h-5" /> {score} pts
             </div>
           )}
           
           <button 
             onClick={() => setIsMuted(!isMuted)} 
             className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
             title={isMuted ? "Unmute Music" : "Mute Music"}
           >
             {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
           </button>

           <button 
             onClick={handleDownloadWorksheet} 
             className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white hidden md:block"
             title="Download Worksheet PDF"
           >
             <Printer className="w-5 h-5" />
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
        
        {/* INTRO PHASE */}
        {phase === 'intro' && (
          <div className="text-center animate-zoom-in">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
              Get Ready!
            </h1>
            <p className="text-2xl text-slate-300">10 Questions coming up...</p>
          </div>
        )}

        {/* QUESTION & REVEAL PHASE */}
        {(phase === 'question' || phase === 'reveal') && (
          <div className="w-full max-w-5xl flex flex-col h-full justify-between animate-fade-in">
            {/* Question Text */}
            <div className="text-center mb-4 md:mb-8 mt-4 md:mt-0">
               <div className="inline-block px-4 py-1 bg-slate-800 rounded-full text-slate-400 text-sm font-bold mb-4 border border-slate-700">
                 Question {currentQuestionIndex + 1} / {quizData.length}
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
                onClick={handleDownloadWorksheet} 
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold text-lg transition-colors flex items-center gap-2 border border-slate-500"
              >
                <Printer className="w-5 h-5"/> Print Worksheet
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
           className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-colors"
           disabled={phase === 'end'}
         >
           {isPaused ? <Play className="w-5 h-5 ml-1" /> : <Pause className="w-5 h-5" />}
         </button>

         {/* Timeline / Progress */}
         <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
               <span>{phase === 'intro' ? 'Intro' : phase === 'end' ? 'Finished' : phase === 'reveal' ? 'Review Answer' : 'Time Remaining'}</span>
               <span>{phase === 'question' || phase === 'reveal' ? `${timer}s` : ''}</span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
               {/* Global Progress (Background) */}
               <div 
                 className="absolute top-0 left-0 h-full bg-slate-700 transition-all duration-500"
                 style={{ width: `${((currentQuestionIndex) / quizData.length) * 100}%` }}
               />
               
               {/* Timer Bar (Foreground) */}
               {(phase === 'question' || phase === 'reveal') && (
                 <div 
                   className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${phase === 'reveal' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                   style={{ width: `${(timer / (phase === 'reveal' ? REVEAL_TIME_AUTO : QUESTION_TIME)) * 100}%` }}
                 />
               )}
            </div>
         </div>

         {/* Skip Button */}
         <button 
           onClick={handleNext}
           className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold disabled:opacity-30 hidden md:flex"
           disabled={phase === 'end'}
         >
           Skip <SkipForward className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};


