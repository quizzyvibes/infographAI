
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../types';
import { Play, Pause, SkipForward, X, Clock, HelpCircle, Trophy, RotateCcw } from 'lucide-react';

interface QuizPlayerProps {
  questions: QuizQuestion[];
  onExit: () => void;
  title: string;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ questions, onExit, title }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentQuestionIndex];

  // Timer Logic
  useEffect(() => {
    if (!showAnswer && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showAnswer, isFinished, currentQuestionIndex]);

  // Auto-play Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAutoPlaying && showAnswer && !isFinished) {
      timeout = setTimeout(() => {
        handleNext();
      }, 5000); // Wait 5 seconds on the answer screen before moving on
    }
    return () => clearTimeout(timeout);
  }, [isAutoPlaying, showAnswer, isFinished]);

  const handleTimeUp = () => {
    setShowAnswer(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowAnswer(false);
      setTimeLeft(15);
    } else {
      setIsFinished(true);
      setIsAutoPlaying(false);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setIsFinished(false);
    setTimeLeft(15);
    setIsAutoPlaying(false);
  };

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center animate-fade-in text-white">
        <div className="text-center space-y-8 max-w-2xl px-6">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto animate-bounce" />
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Quiz Complete!</h1>
          <p className="text-xl text-slate-300">Great job reviewing {title}.</p>
          
          <div className="flex justify-center gap-6 pt-8">
            <button 
              onClick={handleRestart}
              className="flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-full font-bold text-lg transition-all border border-slate-600"
            >
              <RotateCcw className="w-6 h-6" /> Restart
            </button>
            <button 
              onClick={onExit}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-500/25"
            >
              <X className="w-6 h-6" /> Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col font-sans text-white animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="h-20 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">Q</div>
          <div>
            <h2 className="font-bold text-lg leading-tight opacity-90">{title}</h2>
            <p className="text-sm text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
        </div>
        
        {/* Central Timer/Status */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
           {!showAnswer && (
             <div className="flex items-center gap-2 text-2xl font-mono font-bold text-yellow-400">
               <Clock className="w-6 h-6" /> {timeLeft}s
             </div>
           )}
           {showAnswer && (
             <span className="px-4 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">
               Answer Revealed
             </span>
           )}
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={toggleAutoPlay}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${isAutoPlaying ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:text-white'}`}
           >
             {isAutoPlaying ? <Pause className="w-4 h-4 fill-current"/> : <Play className="w-4 h-4 fill-current"/>}
             {isAutoPlaying ? 'Auto-Play ON' : 'Auto-Play OFF'}
           </button>
           <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
             <X className="w-8 h-8" />
           </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-900 w-full">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-linear"
          style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        
        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-5xl z-10 space-y-12">
          {/* Question */}
          <h1 className="text-3xl md:text-5xl font-bold text-center leading-tight drop-shadow-lg animate-slide-up">
            {currentQ.question}
          </h1>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {currentQ.options.map((option, idx) => {
              const isCorrect = idx === currentQ.correctAnswerIndex;
              let cardClass = "bg-slate-800/50 border-slate-700 text-slate-300"; // Default
              
              if (showAnswer) {
                if (isCorrect) {
                  cardClass = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-[1.02] z-20";
                } else {
                  cardClass = "bg-slate-900/50 border-slate-800 text-slate-600 opacity-50 grayscale";
                }
              }

              return (
                <div 
                  key={idx}
                  className={`
                    relative p-8 rounded-2xl border-2 text-xl font-medium transition-all duration-500 flex items-center gap-6
                    ${cardClass}
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 text-lg shrink-0
                    ${showAnswer && isCorrect ? 'bg-white text-emerald-600 border-white' : 'bg-slate-700 border-slate-600 text-slate-400'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{option}</span>
                  {showAnswer && isCorrect && <Trophy className="w-6 h-6 text-white animate-bounce" />}
                </div>
              );
            })}
          </div>

          {/* Explanation Box (Visible on Answer) */}
          {showAnswer && (
            <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl animate-fade-in max-w-3xl mx-auto backdrop-blur-md">
               <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-blue-400 font-bold uppercase text-sm mb-1">Why is this correct?</h4>
                    <p className="text-slate-200 leading-relaxed">{currentQ.explanation}</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-24 bg-slate-900 border-t border-white/5 flex items-center justify-center px-8 relative z-20">
         {!showAnswer ? (
           <button 
             onClick={() => setShowAnswer(true)}
             className="px-12 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold text-lg transition-all border border-slate-600 hover:border-slate-500"
           >
             Reveal Answer
           </button>
         ) : (
           <button 
             onClick={handleNext}
             className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 animate-pulse"
           >
             Next Question <SkipForward className="w-5 h-5 fill-current" />
           </button>
         )}
      </div>
    </div>
  );
};
