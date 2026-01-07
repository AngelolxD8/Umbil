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
  Activity
} from 'lucide-react';

// --- Constants ---
const UMBIL_TEAL = '#1fb8cd';

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

  // Scroll helper - Updated to scroll the container
  const scrollToTop = () => {
    const container = document.getElementById('survey-container');
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Activity className="w-10 h-10 animate-pulse mb-4" style={{ color: UMBIL_TEAL }} />
        <p className="text-gray-400 font-medium">Loading...</p>
      </div>
    );
  }

  if (!surveyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Survey Not Found</h1>
          <p className="text-gray-500">The link appears to be invalid or expired.</p>
        </div>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  // Added id="survey-container" and overflow-y-auto to fix scrolling issues
  return (
    <div id="survey-container" className="h-[100dvh] w-full bg-[#f8fafc] font-sans text-slate-900 overflow-y-auto overflow-x-hidden">
      
      {/* LOCAL STYLES FOR SAFE ANIMATION */}
      <style jsx global>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-safe {
          animation: fadeInScale 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: UMBIL_TEAL }}>
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
                   className="h-full rounded-full transition-all duration-500 ease-out"
                   style={{ width: `${progress}%`, backgroundColor: UMBIL_TEAL }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 pb-32">
        
        {/* --- VIEW: INTRO --- */}
        {viewState === 'intro' && (
          <div className="animate-safe flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-slate-500 text-sm font-semibold shadow-sm">
              <Sparkles size={16} style={{ color: UMBIL_TEAL }} /> 
              <span>Patient Experience Survey</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 mb-8 leading-[1.1]">
              Help us improve<br/> your care experience.
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-500 mb-12 leading-relaxed max-w-3xl">
              Your feedback is anonymous and takes less than 2 minutes. 
              We use this to improve our services and for professional revalidation.
            </p>

            {/* Reassurance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-12">
               <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center sm:items-start gap-3 hover:shadow-md transition-shadow">
                 <UserX size={28} className="text-slate-400"/>
                 <span className="font-bold text-lg text-slate-700">Anonymous</span>
               </div>
               <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center sm:items-start gap-3 hover:shadow-md transition-shadow">
                 <Clock size={28} className="text-slate-400"/>
                 <span className="font-bold text-lg text-slate-700">~2 Minutes</span>
               </div>
               <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col items-center sm:items-start gap-3 hover:shadow-md transition-shadow">
                 <ShieldCheck size={28} className="text-slate-400"/>
                 <span className="font-bold text-lg text-slate-700">Secure</span>
               </div>
            </div>

            {/* BIGGER BUTTON */}
            <button 
              onClick={() => { setViewState('questions'); scrollToTop(); }}
              className="w-full sm:w-auto text-2xl font-bold py-6 px-16 rounded-2xl transition-transform active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 text-white"
              style={{ backgroundColor: UMBIL_TEAL }}
            >
              Start Survey
              <ChevronRight size={28} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* --- VIEW: QUESTIONS --- */}
        {viewState === 'questions' && (
          <div key={fadeKey} className="animate-safe">
            
            {/* Back Link */}
            <button 
                onClick={handleBack}
                className="mb-8 text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 -ml-2 w-fit"
            >
                <ChevronLeft size={18} className="mr-1" /> Back
            </button>

            {/* Domain Label */}
            <span 
              className="text-sm font-bold uppercase tracking-widest mb-4 block"
              style={{ color: UMBIL_TEAL }}
            >
               {currentQuestion.domain}
            </span>

            {/* Question Text */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
              {currentQuestion.text}
            </h2>

            {/* Description Box */}
            {currentQuestion.description && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm mb-10 text-slate-600 text-lg sm:text-xl leading-relaxed">
                {currentQuestion.description}
              </div>
            )}

            {/* Options List */}
            <div className="flex flex-col gap-4">
              {OPTIONS.map((opt) => {
                const isSelected = currentAnswer === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(opt.value)}
                    className={`
                      w-full p-6 sm:p-7 rounded-2xl text-left border-2 transition-all duration-200 flex items-center justify-between group
                      ${isSelected 
                        ? 'bg-white shadow-lg transform scale-[1.01] z-10' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    style={{ borderColor: isSelected ? UMBIL_TEAL : '' }}
                  >
                    <span className={`text-xl font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                        {opt.label}
                    </span>
                    
                    <div 
                      className={`
                        w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors
                        ${isSelected ? '' : 'border-gray-300 group-hover:border-gray-400'}
                      `}
                      style={{ 
                        backgroundColor: isSelected ? UMBIL_TEAL : 'transparent',
                        borderColor: isSelected ? UMBIL_TEAL : ''
                      }}
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
           <div className="animate-safe">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Final Comments</h2>
              <p className="text-slate-500 mb-10 text-xl">
                  Is there anything else you would like to share about your experience? (Optional)
              </p>

              <textarea
                className="w-full h-56 p-6 rounded-2xl border-2 border-gray-200 text-xl outline-none transition-all resize-none mb-10 bg-white focus:ring-4 focus:ring-teal-50"
                style={{ borderColor: `rgba(31, 184, 205, 0.5)` }}
                placeholder="Type your feedback here..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row items-center gap-6">
                    <button
                        onClick={submitFeedback}
                        disabled={submitting}
                        className="w-full sm:w-auto text-white font-bold py-5 px-12 rounded-2xl transition-transform active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-xl"
                        style={{ backgroundColor: UMBIL_TEAL }}
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
            <div className="animate-safe text-center py-12 px-4">
                <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mb-8 mx-auto">
                    <Sparkles size={48} style={{ color: UMBIL_TEAL }} />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Thank You!</h2>
                <p className="text-xl text-slate-500 mb-12 max-w-lg mx-auto leading-relaxed">
                    Your feedback has been securely recorded. You have helped us improve our care standards.
                </p>
                <div className="inline-block px-6 py-3 bg-gray-100 rounded-full text-slate-500 font-medium text-base">
                    You can now close this window.
                </div>
            </div>
        )}

      </main>
    </div>
  );
}