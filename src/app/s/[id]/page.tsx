// src/app/s/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS, PSQ_INTRO } from '@/lib/psq-questions';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  MessageSquare, 
  Send,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Activity
} from 'lucide-react';

// --- GMC Standard Scale ---
const LIKERT_OPTIONS = [
  { value: 5, label: "Strongly agree" },
  { value: 4, label: "Agree" },
  { value: 3, label: "Neither agree nor disagree" },
  { value: 2, label: "Disagree" },
  { value: 1, label: "Strongly disagree" },
  { value: 0, label: "Not applicable" },
];

type ViewState = 'intro' | 'questions' | 'completed';

export default function PublicSurveyPage() {
  const params = useParams();
  const id = params?.id as string;

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [surveyValid, setSurveyValid] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('intro');
  
  // Questionnaire State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [fadeKey, setFadeKey] = useState(0); 

  // --- FORCE SCROLL UNLOCKER ---
  useEffect(() => {
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';
    return () => {
      document.body.style.overflowY = '';
      document.body.style.height = '';
      document.body.style.minHeight = '';
      document.documentElement.style.overflowY = '';
      document.documentElement.style.height = '';
    };
  }, []);

  // 1. Verify Survey Exists
  useEffect(() => {
    async function checkSurvey() {
      if (!id) return;
      const { data, error } = await supabase
        .from('psq_surveys')
        .select('id') 
        .eq('id', id)
        .single();

      if (data && !error) {
        setSurveyValid(true);
      } else {
        console.error('Survey not found:', error);
        setSurveyValid(false);
      }
      setLoading(false);
    }
    checkSurvey();
  }, [id]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. Handle Answer Selection
  const handleAnswer = (value: any) => {
    const currentQ = PSQ_QUESTIONS[currentQIndex];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));
    
    // Auto-advance for Likert/Option types
    if (currentQ.type !== 'text') {
      setTimeout(() => {
        handleNext();
      }, 250);
    }
  };

  const handleNext = () => {
    if (currentQIndex < PSQ_QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setFadeKey(prev => prev + 1);
      scrollToTop();
    } else {
      submitFeedback(); // Auto-submit after last question
    }
  };

  const handleBack = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
      setFadeKey(prev => prev - 1);
    } else {
      setViewState('intro');
    }
    scrollToTop();
  };

  // 3. Submit
  const submitFeedback = async () => {
    setSubmitting(true);
    
    // Ensure current text answer is saved if we are on the last question
    const currentQ = PSQ_QUESTIONS[currentQIndex];
    let finalAnswers = { ...answers };
    // (React state update might lag if called directly, relying on 'answers' state is usually safe if updated via handleAnswer)

    const payload = {
      survey_id: id,
      answers: finalAnswers,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('psq_responses').insert(payload);

    if (error) {
      console.error('Submission error:', error);
      alert('Problem submitting feedback. Please try again.');
      setSubmitting(false);
    } else {
      setViewState('completed');
      scrollToTop();
    }
  };

  // --- DERIVED DATA ---
  const currentQuestion = PSQ_QUESTIONS[currentQIndex];
  const progress = ((currentQIndex + 1) / PSQ_QUESTIONS.length) * 100;
  const currentAnswer = answers[currentQuestion?.id];

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white w-full">
        <Activity className="w-10 h-10 animate-pulse mb-4 text-[#1fb8cd]" />
        <p className="text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  if (!surveyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 w-full">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Survey Not Found</h1>
          <p className="text-gray-500">The link appears to be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] font-sans text-slate-900 flex flex-col items-center">
      <style jsx global>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-safe {
          animation: fadeInScale 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        html, body { overflow-y: auto !important; height: auto !important; }
      `}</style>

      {/* HEADER */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm flex justify-center">
        <div className="w-full max-w-4xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-[#1fb8cd]">
               <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">Umbil Feedback</span>
          </div>
          {viewState === 'questions' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase hidden xs:block">
                {currentQIndex + 1} / {PSQ_QUESTIONS.length}
              </span>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                   className="h-full rounded-full transition-all duration-500 ease-out bg-[#1fb8cd]"
                   style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-2xl px-4 py-8 pb-32 flex flex-col items-center">
        
        {/* --- INTRO VIEW --- */}
        {viewState === 'intro' && (
          <div className="animate-safe flex flex-col items-center text-center w-full pt-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
              {PSQ_INTRO.title}
            </h1>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-xl">
              {PSQ_INTRO.body}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10">
               <div className="p-4 rounded-xl bg-white border border-gray-200 flex flex-col items-center gap-2">
                 <ShieldCheck className="text-[#1fb8cd]"/>
                 <span className="font-semibold text-sm">Anonymous</span>
               </div>
               <div className="p-4 rounded-xl bg-white border border-gray-200 flex flex-col items-center gap-2">
                 <Clock className="text-[#1fb8cd]"/>
                 <span className="font-semibold text-sm">~2 Minutes</span>
               </div>
               <div className="p-4 rounded-xl bg-white border border-gray-200 flex flex-col items-center gap-2">
                 <CheckCircle2 className="text-[#1fb8cd]"/>
                 <span className="font-semibold text-sm">Secure</span>
               </div>
            </div>

            <button 
              onClick={() => { setViewState('questions'); scrollToTop(); }}
              className="w-full sm:w-auto text-xl font-bold py-4 px-12 rounded-xl text-white bg-[#1fb8cd] hover:bg-[#189cad] shadow-lg hover:shadow-xl transition-all"
            >
              Start Survey
            </button>
          </div>
        )}

        {/* --- QUESTIONS VIEW --- */}
        {viewState === 'questions' && (
          <div key={fadeKey} className="animate-safe w-full flex flex-col">
            
            <button onClick={handleBack} className="self-start text-slate-400 text-sm font-medium mb-6 hover:text-slate-600 flex items-center">
              <ChevronLeft size={16} className="mr-1"/> Back
            </button>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 leading-snug">
              {currentQuestion.text}
            </h2>

            {/* RENDER BASED ON TYPE */}
            
            {/* 1. LIKERT */}
            {currentQuestion.type === 'likert' && (
              <div className="flex flex-col gap-3">
                {LIKERT_OPTIONS.map((opt) => {
                  const isSelected = currentAnswer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      className={`
                        w-full p-5 rounded-xl text-left border-2 transition-all flex items-center justify-between
                        ${isSelected ? 'bg-teal-50 border-[#1fb8cd] shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <span className={`font-semibold text-lg ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check className="text-[#1fb8cd]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. OPTION (Context) */}
            {currentQuestion.type === 'option' && (
              <div className="flex flex-col gap-3">
                {currentQuestion.options?.map((opt) => {
                  const isSelected = currentAnswer === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className={`
                        w-full p-5 rounded-xl text-left border-2 transition-all flex items-center justify-between
                        ${isSelected ? 'bg-teal-50 border-[#1fb8cd] shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <span className="font-semibold text-lg text-slate-800">{opt}</span>
                      {isSelected && <Check className="text-[#1fb8cd]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. FREE TEXT */}
            {currentQuestion.type === 'text' && (
               <div className="flex flex-col gap-4">
                 <textarea
                    className="w-full h-48 p-4 rounded-xl border-2 border-gray-200 text-lg focus:border-[#1fb8cd] outline-none"
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                 />
                 <button
                    onClick={handleNext}
                    disabled={submitting}
                    className="self-end py-3 px-8 bg-[#1fb8cd] text-white font-bold rounded-xl hover:bg-[#189cad] transition-all flex items-center gap-2"
                 >
                    {submitting ? 'Submitting...' : (currentQIndex === PSQ_QUESTIONS.length - 1 ? 'Finish' : 'Next')}
                    {!submitting && <ChevronRight size={20} />}
                 </button>
               </div>
            )}

          </div>
        )}

        {/* --- COMPLETED VIEW --- */}
        {viewState === 'completed' && (
            <div className="animate-safe flex flex-col items-center text-center pt-10">
                <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-[#1fb8cd]" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Thank You!</h2>
                <p className="text-lg text-slate-500 mb-8">
                    Your feedback has been securely recorded to help improve patient care.
                </p>
                <div className="px-5 py-2 bg-gray-100 rounded-full text-slate-500 text-sm font-medium">
                    You may now close this window.
                </div>
            </div>
        )}

      </main>
    </div>
  );
}