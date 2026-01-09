'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Info, Activity } from 'lucide-react';
import { PSQ_QUESTIONS, type PSQQuestion } from '@/lib/psq-questions';

// The Exact Umbil Teal Hex from your globals.css
const UMBIL_TEAL = '#1fb8cd';

export default function PSQPage() {
  const router = useRouter();
  
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [fadeKey, setFadeKey] = useState(0); 

  // Derived Data
  const totalQuestions = PSQ_QUESTIONS.length;
  const currentQuestion: PSQQuestion | undefined = PSQ_QUESTIONS[currentQuestionIndex];

  // Loading State
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Activity className="w-12 h-12" style={{ color: UMBIL_TEAL }} />
          <p className="text-gray-500 font-medium">Loading Questionnaire...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (value: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    
    // Delay for visual feedback
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setFadeKey((prev) => prev + 1); 
      } else {
        handleComplete();
      }
    }, 250);
  };

  const handleComplete = () => {
    // console.log("Final Answers:", answers); 
    router.push('/psq/analytics'); 
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-white overflow-hidden">
      
      {/* ----------------------------------------------------
        LEFT PANEL: BRANDING & CONTEXT 
        (Full height, Umbil Teal Background)
        ----------------------------------------------------
      */}
      <div 
        className="w-full lg:w-1/3 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden"
        style={{ backgroundColor: UMBIL_TEAL }}
      >
        {/* Abstract Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />

        {/* Header / Nav */}
        <div className="relative z-10">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-white/90 hover:text-white transition-colors group mb-8"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium tracking-wide text-sm">Back to Dashboard</span>
          </Link>
          
          <div className="mt-4">
            <span className="inline-block px-3 py-1 rounded-full bg-black/10 text-white/90 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
              {currentQuestion.domain}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              Pre-Screening<br/>Questionnaire
            </h2>
          </div>
        </div>

        {/* Progress Display (Desktop) */}
        <div className="relative z-10 mt-auto">
          <div className="flex justify-between text-xs font-bold text-white/70 mb-3 uppercase tracking-wider">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-6 text-white/50 text-xs leading-relaxed">
            Your responses help us tailor your Continuing Professional Development (CPD) profile accurately.
          </p>
        </div>
      </div>


      {/* ----------------------------------------------------
        RIGHT PANEL: QUESTION & INTERACTION
        (Clean White, "Page" Feel, Scrollable)
        ----------------------------------------------------
      */}
      <div className="w-full lg:w-2/3 h-full flex flex-col relative bg-gray-50/50">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-12 lg:px-16 lg:py-24 flex flex-col justify-center min-h-full">
            
            <div key={fadeKey} className="animate-in fade-in slide-in-from-bottom-8 duration-500">
              
              {/* Question Number */}
              <span className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-4 block">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>

              {/* The Question */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-8 leading-[1.15]">
                {currentQuestion.text}
              </h1>

              {/* Description (Context Box) */}
              {currentQuestion.description && (
                <div className="flex gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 mb-12">
                  <Info className="w-6 h-6 shrink-0 mt-1" style={{ color: UMBIL_TEAL }} />
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Context</p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {currentQuestion.description}
                    </p>
                  </div>
                </div>
              )}

              {/* HUGE Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 mt-8">
                
                {/* YES Button */}
                <button
                  onClick={() => handleOptionSelect('Yes')}
                  className="group flex-1 relative p-8 md:p-10 text-left 
                    bg-white hover:bg-gray-50 
                    border-2 border-gray-200 hover:border-[#1fb8cd]
                    rounded-3xl transition-all duration-200 ease-out
                    shadow-sm hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-gray-900 group-hover:text-[#1fb8cd] transition-colors">Yes</span>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-colors group-hover:bg-[#1fb8cd] group-hover:text-white"
                      style={{ backgroundColor: '#f0f9fa', color: UMBIL_TEAL }}
                    >
                      <Check className="w-6 h-6" strokeWidth={3} />
                    </div>
                  </div>
                  <p className="text-gray-400 font-medium group-hover:text-gray-600 transition-colors">
                    Select this option to confirm.
                  </p>
                </button>

                {/* NO Button */}
                <button
                  onClick={() => handleOptionSelect('No')}
                  className="group flex-1 relative p-8 md:p-10 text-left 
                    bg-white hover:bg-gray-50 
                    border-2 border-gray-200 hover:border-gray-400
                    rounded-3xl transition-all duration-200 ease-out
                    shadow-sm hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-gray-900">No</span>
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <ChevronRight className="w-6 h-6" strokeWidth={3} />
                    </div>
                  </div>
                  <p className="text-gray-400 font-medium group-hover:text-gray-600 transition-colors">
                    Select this option to decline.
                  </p>
                </button>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}