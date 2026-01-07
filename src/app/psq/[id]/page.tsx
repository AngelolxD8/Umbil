'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Info, Activity } from 'lucide-react';
import { PSQ_QUESTIONS, type PSQQuestion } from '@/lib/psq-questions';

export default function PSQPage() {
  const router = useRouter();
  
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [fadeKey, setFadeKey] = useState(0); 

  // Derived Data
  const totalQuestions = PSQ_QUESTIONS.length;
  const currentQuestion: PSQQuestion | undefined = PSQ_QUESTIONS[currentQuestionIndex];

  // Handle Missing Data
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--umbil-bg)] text-[var(--umbil-muted)]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 animate-pulse text-[var(--umbil-brand-teal)]" />
          <p>Loading Questionnaire...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (value: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    
    // Slight delay to visualize the click
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
    <div className="min-h-screen bg-[var(--umbil-bg)] flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Decor: Adds depth behind the card */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[var(--umbil-brand-teal)]/10 to-transparent pointer-events-none z-0" />

      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full relative z-10">
        <Link 
          href="/dashboard" 
          className="flex items-center text-[var(--umbil-muted)] hover:text-[var(--umbil-brand-teal)] transition-colors group font-medium"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-[var(--umbil-card-border)] flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <div className="px-4 py-1.5 rounded-full bg-white border border-[var(--umbil-card-border)] shadow-sm">
           <span className="text-xs font-bold text-[var(--umbil-brand-teal)] uppercase tracking-widest">
             {currentQuestion.domain}
           </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-12 relative z-10">
        <div className="w-full max-w-3xl">
          
          {/* 3D Progress Bar */}
          <div className="mb-10 px-2">
            <div className="flex justify-between text-xs font-bold text-[var(--umbil-muted)] mb-3 uppercase tracking-wider">
              <span>Question {currentQuestionIndex + 1} / {totalQuestions}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner border border-black/5">
              <div 
                className="h-full bg-[var(--umbil-brand-teal)] rounded-full shadow-[0_2px_10px_rgba(31,184,205,0.4)] transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Shine effect on progress bar */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20" />
              </div>
            </div>
          </div>

          {/* Question Card - The "Hero" */}
          <div
            key={fadeKey}
            className="bg-[var(--umbil-surface)] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 sm:p-12 border border-[var(--umbil-card-border)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            
            {/* Question Text */}
            <div className="mb-12 relative z-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--umbil-text)] mb-6 leading-tight">
                {currentQuestion.text}
              </h1>
              
              {/* Description Bubble */}
              {currentQuestion.description && (
                <div className="flex items-start gap-4 bg-[var(--umbil-hover-bg)] p-5 rounded-2xl border border-[var(--umbil-card-border)]">
                  <Info className="w-6 h-6 text-[var(--umbil-brand-teal)] shrink-0 mt-0.5" />
                  <p className="text-base text-[var(--umbil-text)] opacity-80 font-medium leading-relaxed">
                    {currentQuestion.description}
                  </p>
                </div>
              )}
            </div>

            {/* "Tactile" 3D Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* YES Button */}
              <button
                onClick={() => handleOptionSelect('Yes')}
                className="group relative w-full flex items-center justify-between p-6 sm:p-8 
                  bg-white text-[var(--umbil-text)]
                  border-2 border-gray-100 border-b-4 border-b-gray-200
                  hover:border-[var(--umbil-brand-teal)] hover:border-b-[var(--umbil-brand-teal)]
                  active:border-b-0 active:border-t-4 active:border-t-transparent active:translate-y-1
                  rounded-2xl transition-all duration-100 ease-out"
              >
                <span className="text-2xl font-bold group-hover:text-[var(--umbil-brand-teal)] transition-colors">Yes</span>
                <div className="w-12 h-12 rounded-xl bg-[var(--umbil-hover-bg)] text-gray-300 flex items-center justify-center group-hover:bg-[var(--umbil-brand-teal)] group-hover:text-white transition-all">
                  <Check className="w-6 h-6" strokeWidth={3} />
                </div>
              </button>

              {/* NO Button */}
              <button
                onClick={() => handleOptionSelect('No')}
                className="group relative w-full flex items-center justify-between p-6 sm:p-8 
                  bg-white text-[var(--umbil-text)]
                  border-2 border-gray-100 border-b-4 border-b-gray-200
                  hover:border-rose-400 hover:border-b-rose-400
                  active:border-b-0 active:border-t-4 active:border-t-transparent active:translate-y-1
                  rounded-2xl transition-all duration-100 ease-out"
              >
                <span className="text-2xl font-bold group-hover:text-rose-500 transition-colors">No</span>
                <div className="w-12 h-12 rounded-xl bg-[var(--umbil-hover-bg)] text-gray-300 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <ChevronRight className="w-6 h-6" strokeWidth={3} />
                </div>
              </button>

            </div>
          </div>

          <p className="mt-8 text-center text-[var(--umbil-muted)] text-sm font-medium opacity-60">
            Confidential • CPD Profile Calibration
          </p>

        </div>
      </main>
    </div>
  );
}