
import React from 'react';
import { AppStep } from '../types';
import { Settings2, Lightbulb, Image as ImageIcon } from 'lucide-react';

interface StepWizardProps {
  currentStep: AppStep;
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep }) => {
  const steps = [
    { id: AppStep.CONFIG, label: "Configure", icon: Settings2 },
    { id: AppStep.TOPICS, label: "Topics", icon: Lightbulb },
    { id: AppStep.RESULT, label: "Generate", icon: ImageIcon },
  ];

  const getStepStatus = (id: AppStep) => {
    const order = [AppStep.CONFIG, AppStep.TOPICS, AppStep.RESULT];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(id);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-10 px-4">
      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
             {/* Progress Fill */}
             <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-500 ease-out"
                style={{ 
                  width: `${
                    currentStep === AppStep.CONFIG ? '16%' : 
                    currentStep === AppStep.TOPICS ? '50%' : '100%'
                  }` 
                }}
             />
        </div>
        
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-xl z-10 border-4
                    ${status === 'completed' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 border-slate-100 dark:border-slate-900 text-white shadow-indigo-500/20' 
                      : ''}
                    ${status === 'active' 
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 text-indigo-500 dark:text-indigo-400 scale-110 shadow-indigo-500/30' 
                      : ''}
                    ${status === 'pending' 
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-600' 
                      : ''}
                  `}
                >
                  {status === 'completed' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`
                  mt-3 text-sm font-bold tracking-wide uppercase transition-colors duration-300
                  ${status === 'active' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
                `}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

