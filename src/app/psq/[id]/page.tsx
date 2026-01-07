'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Info } from 'lucide-react';
// IMPORT FIX: We use the named export based on your file content
import { PSQ_QUESTIONS, type PSQQuestion } from '@/lib/psq-questions';

export default function PSQPage() {
  const params = useParams();
  const router = useRouter();
  
  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isExiting, setIsExiting] = useState(false);

  // DATA FETCHING: Directly use the imported constant
  const totalQuestions = PSQ_QUESTIONS.length;
  const currentQuestion: PSQQuestion | undefined = PSQ_QUESTIONS[currentQuestionIndex];

  // Safety check
  if (!currentQuestion) {
    return <div className="p-10 text-center">Loading or No Questions Found...</div>;
  }

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (value: string | boolean) => {
    // Save answer
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    
    // Smooth transition delay
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        handleComplete();
      }
    }, 250);
  };

  const handleComplete = () => {
    setIsExiting(true);
    console.log("Final Answers:", answers); 
    // TODO: Send 'answers' to your backend here
    setTimeout(() => {
      router.push('/psq/analytics'); 
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link 
          href="/dashboard" 
          className="flex items-center text-gray-500 hover:text-[var(--primary)] transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </Link>
        <div className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest">
          {currentQuestion.domain}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-12">
        <div className="w-full max-w-4xl">
          
          {/* Progress Bar */}
          <div className="mb-8 sm:mb-10">
            <div className="flex justify-between text-xs sm:text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              <span>Question {currentQuestionIndex + 1} / {totalQuestions}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 sm:h-3 w-full bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="h-full bg-[var(--primary)] rounded-full shadow-[0_0_10px_var(--primary)]"
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentQuestion.id} // Key ensures animation triggers on change
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 p-6 sm:p-10 md:p-14 border border-white relative overflow-hidden"
            >
              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl" />

              {/* Question Text */}
              <div className="mb-10 sm:mb-12 relative z-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  {currentQuestion.text}
                </h1>
                
                {/* Description / Helper Text */}
                {currentQuestion.description && (
                  <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                    <Info className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                      {currentQuestion.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Positive Option */}
                <button
                  onClick={() => handleOptionSelect('Yes')} // Or true/score
                  className="group relative flex items-center justify-between w-full p-6 sm:p-8 text-left border-2 border-gray-100 bg-gray-50/30 rounded-2xl hover:border-[var(--primary)] hover:bg-[var(--primary)] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[var(--primary)]/20 hover:-translate-y-1"
                >
                  <span className="text-xl sm:text-2xl font-bold text-gray-700 group-hover:text-white transition-colors">
                    Yes
                  </span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-hover:text-white" />
                  </div>
                </button>

                {/* Negative Option */}
                <button
                  onClick={() => handleOptionSelect('No')} // Or false/score
                  className="group relative flex items-center justify-between w-full p-6 sm:p-8 text-left border-2 border-gray-100 bg-gray-50/30 rounded-2xl hover:border-gray-300 hover:bg-gray-100 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                  <span className="text-xl sm:text-2xl font-bold text-gray-700">
                    No
                  </span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-hover:text-gray-500" />
                  </div>
                </button>
              </div>

            </motion.div>
          </AnimatePresence>

          <p className="mt-8 text-center text-gray-400 text-xs sm:text-sm font-medium">
            Confidential • CPD Profile Calibration
          </p>

        </div>
      </main>
    </div>
  );
}