// src/app/s/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Sparkles, 
  MessageSquare, 
  Send,
  ShieldCheck,
  Clock,
  UserX,
  Activity,
  CheckCircle2
} from 'lucide-react';

// --- Constants ---
const OPTIONS = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Less than satisfactory" },
  { value: 3, label: "Satisfactory" },
  { value: 4, label: "Good" },
  { value: 5, label: "Very Good" },
  { value: 6, label: "Excellent" },
  { value: 0, label: "Does not apply" },
];

type ViewState = 'intro' | 'questions' | 'feedback' | 'completed';

export default function PublicSurveyPage() {
  const params = useParams();
  const id = params?.id as string;

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [surveyValid, setSurveyValid] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('intro');
  
  // Questionnaire State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fadeKey, setFadeKey] = useState(0); 

  // --- FORCE SCROLL UNLOCKER ---
  // This guarantees the page scrolls, even if globals.css tries to lock it
  useEffect(() => {
    // 1. Force Body to be scrollable
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    
    // 2. Force HTML to allow scroll
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';

    // 3. Cleanup when leaving this page (optional, keeps dashboard app-like)
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

  // Scroll helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. Handle Answer Selection
  const handleOptionSelect = (value: number) => {
    const currentQId = PSQ_QUESTIONS[currentQIndex].id;
    setAnswers((prev) => ({ ...prev, [currentQId]: value }));
    
    // Auto-advance
    setTimeout(() => {
      if (currentQIndex < PSQ_QUESTIONS.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setFadeKey(prev => prev + 1);
        scrollToTop();
      } else {
        setViewState('feedback');
        scrollToTop();
      }
    }, 250);
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
    
    const payload = {
      survey_id: id,
      answers: answers,
      feedback_text: feedbackText,
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

  // --- RENDER: LOADING / ERROR ---
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

  // --- MAIN LAYOUT ---
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] font-sans text-slate-900 flex flex-col items-center">
      
      {/* LOCAL STYLES FOR SAFE ANIMATION */}
      <style jsx global>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-safe {
          animation: fadeInScale 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        /* EXTRA SAFEGUARD: Ensure this container allows scrolling */
        html, body {
            overflow-y: auto !important;
            height: auto !important;
        }
      `}</style>

      {/* 1. TOP HEADER (Centered) */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm flex justify-center">
        <div className="w-full max-w-4xl px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-[#1fb8cd]">
               <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 hidden xs:block">Umbil Feedback</span>
          </div>

          {/* Mini Progress Indicator */}
          {viewState === 'questions' && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                {Math.round(progress)}%
              </span>
              <div className="w-24 sm:w-32 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                   className="h-full rounded-full transition-all duration-500 ease-out bg-[#1fb8cd]"
                   style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA (Centered) */}
      <main className="w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-16 pb-32 flex flex-col items-center">
        
        {/* --- VIEW: INTRO --- */}
        {viewState === 'intro' && (
          <div className="animate-safe flex flex-col items-center text-center w-full">
            
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-slate-500 text-sm font-semibold shadow-sm">
              <Sparkles size={16} className="text-[#1fb8cd]" /> 
              <span>Patient Experience Survey</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 mb-8 leading-[1.1]">
              Help us improve<br/> your care experience.
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-500 mb-12 leading-relaxed max-w-2xl mx-auto">
              Your feedback is anonymous and takes less than 2 minutes. 
              We use this to improve our services and for professional revalidation.
            </p>

            {/* Reassurance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-12 max-w-3xl mx-auto">
               <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow">
                 <UserX size={28} className="text-slate-400"/>
                 <span className="font-bold text-lg text-slate-700">Anonymous</span>
               </div>
               <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow">
                 <Clock size={28} className="text-slate-400"/>
                 <span className="font-bold text-lg text-slate-700">~2 Minutes</span>
               </div>
               <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow">
                 <ShieldCheck size={28} className="text-slate-400"/>
                 <span className="font-bold text-lg text-slate-700">Secure</span>
               </div>
            </div>

            {/* BIGGER CENTERED BUTTON */}
            <button 
              onClick={() => { setViewState('questions'); scrollToTop(); }}
              className="group w-full sm:w-auto text-2xl font-bold py-6 px-16 rounded-2xl transition-all active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 text-white bg-[#1fb8cd] hover:bg-[#189cad]"
            >
              Start Survey
              <ChevronRight size={28} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* --- VIEW: QUESTIONS --- */}
        {viewState === 'questions' && (
          <div key={fadeKey} className="animate-safe w-full flex flex-col items-center">
            
            {/* Back Link */}
            <div className="w-full flex justify-center sm:justify-start mb-8 max-w-xl">
               <button 
                  onClick={handleBack}
                  className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                  <ChevronLeft size={18} className="mr-1" /> Go Back
              </button>
            </div>

            {/* Domain */}
            <span 
              className="text-sm font-bold uppercase tracking-widest mb-4 block text-[#1fb8cd] text-center"
            >
               {currentQuestion.domain}
            </span>

            {/* Question Text */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight text-center max-w-3xl">
              {currentQuestion.text}
            </h2>

            {/* Description */}
            {currentQuestion.description && (
              <div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm mb-10 text-slate-600 text-lg sm:text-xl leading-relaxed text-center">
                {currentQuestion.description}
              </div>
            )}

            {/* Options */}
            <div className="flex flex-col gap-4 w-full max-w-xl">
              {OPTIONS.map((opt) => {
                const isSelected = currentAnswer === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(opt.value)}
                    className={`
                      w-full p-6 sm:p-7 rounded-2xl text-left border-2 transition-all duration-200 flex items-center justify-between group
                      ${isSelected 
                        ? 'bg-white border-[#1fb8cd] shadow-lg transform scale-[1.01] z-10' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={`text-xl font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                        {opt.label}
                    </span>
                    
                    <div 
                      className={`
                        w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-4
                        ${isSelected ? 'bg-[#1fb8cd] border-[#1fb8cd]' : 'border-gray-300 group-hover:border-gray-400'}
                      `}
                    >
                        {isSelected && <Check size={16} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: FEEDBACK --- */}
        {viewState === 'feedback' && (
           <div className="animate-safe flex flex-col items-center text-center w-full">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Final Comments</h2>
              <p className="text-slate-500 mb-10 text-xl max-w-2xl">
                  Is there anything else you would like to share about your experience? (Optional)
              </p>

              <textarea
                className="w-full max-w-2xl h-56 p-6 rounded-2xl border-2 border-gray-200 text-xl outline-none transition-all resize-none mb-10 bg-white focus:ring-4 focus:ring-teal-50 focus:border-[#1fb8cd] text-left"
                placeholder="Type your feedback here..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
                    <button
                        onClick={submitFeedback}
                        disabled={submitting}
                        className="w-full sm:w-auto text-white font-bold py-5 px-12 rounded-2xl transition-transform active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-xl bg-[#1fb8cd] hover:bg-[#189cad]"
                    >
                        {submitting ? 'Sending...' : 'Submit Feedback'} <Send size={20} />
                    </button>
                    
                    <button
                        onClick={handleBack}
                        className="w-full sm:w-auto py-4 text-slate-400 hover:text-slate-600 font-semibold transition-colors text-lg"
                    >
                        Back
                    </button>
                </div>
           </div>
        )}

        {/* --- VIEW: COMPLETED --- */}
        {viewState === 'completed' && (
            <div className="animate-safe flex items-center justify-center min-h-[50vh] w-full">
                <div className="text-center w-full max-w-lg bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
                    <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mb-8 mx-auto animate-bounce">
                        <CheckCircle2 size={48} className="text-[#1fb8cd]" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                        Thank You!
                    </h2>
                    
                    <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                        Your feedback has been securely recorded. <br/>
                        You have helped us improve our care standards.
                    </p>
                    
                    <div className="inline-block px-6 py-3 bg-gray-50 rounded-full text-slate-400 font-medium text-sm border border-gray-100">
                        You may now close this window safely.
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}