
import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../src/types';
import { Play, Pause, SkipForward, X, Clock, CheckCircle2, Trophy, RotateCcw } from 'lucide-react';

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
  const [score, setScore] = useState(0); // Optional: track imagined score for fun

  const QUESTION_TIME = 15;
  const REVEAL_TIME = 8;

  useEffect(() => {
    let interval: any;

    if (!isPaused) {
      if (phase === 'intro') {
        interval = setTimeout(() => setPhase('question'), 3000);
      } else if (phase === 'question') {
        if (timer > 0) {
          interval = setInterval(() => setTimer((t) => t - 1), 1000);
        } else {
          setPhase('reveal');
          setTimer(REVEAL_TIME);
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
      setPhase('question');
      setTimer(QUESTION_TIME);
    } else {
      setPhase('end');
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setPhase('intro');
    setTimer(QUESTION_TIME);
    setIsPaused(false);
  };

  const currentQuestion = quizData[currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans animate-fade-in text-white">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">Video Quiz</span>
          <h2 className="font-bold text-lg truncate max-w-md">{topicTitle}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
        
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
            <div className="text-center mb-8">
               <div className="inline-block px-4 py-1 bg-slate-800 rounded-full text-slate-400 text-sm font-bold mb-4 border border-slate-700">
                 Question {currentQuestionIndex + 1} / {quizData.length}
               </div>
               <h2 className="text-3xl md:text-4xl font-bold leading-tight drop-shadow-xl">
                 {currentQuestion.question}
               </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 content-center">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === currentQuestion.correctAnswerIndex;
                let cardStyle = "bg-slate-800/80 border-slate-700 hover:border-slate-500";
                
                if (phase === 'reveal') {
                  if (isCorrect) {
                    cardStyle = "bg-emerald-600 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105 z-10";
                  } else {
                    cardStyle = "bg-slate-800/40 border-slate-800 opacity-50 grayscale";
                  }
                }

                return (
                  <div 
                    key={idx}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-500 flex items-center gap-4 ${cardStyle}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 ${phase === 'reveal' && isCorrect ? 'bg-white text-emerald-600 border-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                      {['A','B','C','D'][idx]}
                    </div>
                    <span className="text-xl font-medium">{option}</span>
                    {phase === 'reveal' && isCorrect && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-white animate-bounce" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation (Reveal Only) */}
            {phase === 'reveal' && (
               <div className="mt-6 p-4 bg-blue-900/40 border border-blue-500/30 rounded-xl text-center animate-slide-up">
                  <p className="text-blue-200 text-lg">💡 {currentQuestion.explanation}</p>
               </div>
            )}
          </div>
        )}

        {/* END PHASE */}
        {phase === 'end' && (
          <div className="text-center animate-zoom-in">
            <Trophy className="w-32 h-32 text-amber-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-5xl font-bold text-white mb-4">Quiz Complete!</h1>
            <p className="text-xl text-slate-400 mb-8">Great job reviewing {topicTitle}.</p>
            <button 
              onClick={handleRestart}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-5 h-5"/> Replay Quiz
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="h-24 bg-slate-900 border-t border-slate-800 px-8 flex items-center gap-6">
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
               <span>{phase === 'intro' ? 'Intro' : phase === 'end' ? 'Finished' : phase === 'reveal' ? 'Answer Reveal' : 'Time Remaining'}</span>
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
                   style={{ width: `${(timer / (phase === 'reveal' ? REVEAL_TIME : QUESTION_TIME)) * 100}%` }}
                 />
               )}
            </div>
         </div>

         {/* Skip Button */}
         <button 
           onClick={handleNext}
           className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold disabled:opacity-30"
           disabled={phase === 'end'}
         >
           Skip <SkipForward className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};
