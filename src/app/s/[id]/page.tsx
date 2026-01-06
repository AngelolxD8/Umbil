// src/app/s/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Sparkles, 
  MessageSquare, 
  Send,
  ShieldCheck,
  Clock,
  UserX,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// --- Types & Constants ---

// Modern "Card" options for answers with distinct values
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
  const id = params?.id as string; // Survey ID

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [surveyValid, setSurveyValid] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('intro');
  
  // Questionnaire State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // UI State
  const [showDescription, setShowDescription] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

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

  // Scroll to top helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 2. Handle Answer Selection
  const handleOptionSelect = (value: number) => {
    const currentQId = PSQ_QUESTIONS[currentQIndex].id;
    setAnswers((prev) => ({ ...prev, [currentQId]: value }));
    
    // Auto-advance logic with small delay for visual feedback
    setTimeout(() => {
      handleNext(true);
    }, 350);
  };

  const handleNext = (isAutoAdvance = false) => {
    setShowDescription(false); // Reset hint visibility
    
    if (currentQIndex < PSQ_QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      if (!isAutoAdvance) scrollToTop();
    } else {
      setViewState('feedback');
      scrollToTop();
    }
  };

  const handleBack = () => {
    setShowDescription(false);
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    } else {
      setViewState('intro');
    }
    scrollToTop();
  };

  // 3. Submit All Data to Supabase
  const submitFeedback = async () => {
    setSubmitting(true);
    
    const payload = {
      survey_id: id,
      answers: answers,
      feedback_text: feedbackText,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('psq_responses')
      .insert(payload);

    if (error) {
      console.error('Submission error:', error);
      alert('There was a problem submitting your feedback. Please try again.');
      setSubmitting(false);
    } else {
      setViewState('completed');
      scrollToTop();
    }
  };

  // --- Render: Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // --- Render: Error ---
  if (!surveyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Survey Not Found</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            This survey link appears to be invalid or has expired. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  // --- Render: Completed ---
  if (viewState === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 animate-in fade-in duration-500">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 bg-teal-50 text-teal-600 ring-4 ring-teal-50/50">
            <Sparkles size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Thank You!</h1>
          <p className="text-slate-600 mb-10 text-xl leading-relaxed">
            Your feedback has been successfully recorded anonymously.
          </p>
          <div className="text-sm text-slate-400 font-medium bg-slate-50 py-3 px-6 rounded-full inline-block border border-slate-100">
            You may now close this window
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Intro (Landing Page) ---
  if (viewState === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-50">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Hero Section */}
          <div className="p-10 md:p-16 text-center bg-gradient-to-br from-teal-600 to-teal-700 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-white blur-3xl"></div>
            </div>

            <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-inner ring-1 ring-white/30">
                    <MessageSquare size={40} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Patient Feedback</h1>
                <p className="text-teal-50 text-xl font-medium opacity-90">Help us improve your care</p>
            </div>
          </div>
          
          <div className="p-8 md:p-12 lg:p-16 flex flex-col items-center">
            <div className="prose prose-lg text-center text-slate-600 mb-12 max-w-2xl leading-relaxed">
              <p>
                We would be grateful if you would complete this brief questionnaire about your visit today. 
                Your honest feedback is vital for our revalidation and improvement.
              </p>
            </div>

            {/* Reassurance Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
                <ReassuranceBadge 
                    icon={<UserX size={22} />} 
                    title="Anonymous" 
                    desc="Your identity is hidden"
                />
                <ReassuranceBadge 
                    icon={<Clock size={22} />} 
                    title="Quick" 
                    desc="Takes less than 2 mins"
                />
                <ReassuranceBadge 
                    icon={<ShieldCheck size={22} />} 
                    title="Safe" 
                    desc="No impact on your care"
                />
            </div>

            <button 
              onClick={() => {
                setViewState('questions');
                scrollToTop();
              }}
              className="group w-full md:w-auto min-w-[320px] bg-teal-600 text-white font-bold py-5 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg md:text-xl shadow-lg hover:bg-teal-700 hover:shadow-xl hover:-translate-y-1 focus:ring-4 focus:ring-teal-200 outline-none"
            >
              Start Questionnaire 
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Feedback Text Step ---
  if (viewState === 'feedback') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 animate-in slide-in-from-right-4 duration-300">
        <div className="max-w-4xl w-full" ref={topRef}>
            {/* Header */}
            <div className="mb-8 flex items-center gap-3 text-sm font-bold text-slate-400 uppercase tracking-wider">
                <span className="text-teal-600">Final Step</span>
                <span className="h-px bg-slate-300 flex-1"></span>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden p-8 md:p-12">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Any other comments?</h2>
                    <p className="text-slate-500 text-lg">
                        If you have any other feedback about your experience, please write it below.
                        <span className="block mt-1 text-sm text-slate-400">(Optional)</span>
                    </p>
                </div>

                <textarea
                    className="w-full h-48 p-5 rounded-2xl border-2 border-slate-200 text-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none mb-8 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                    placeholder="Type your feedback here..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                />

                <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 pt-2">
                     <button
                        onClick={handleBack}
                        className="w-full md:w-auto text-slate-500 hover:text-slate-900 font-semibold px-6 py-4 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <ChevronLeft size={20} /> Back
                    </button>

                    <button
                        onClick={submitFeedback}
                        disabled={submitting}
                        className="w-full md:w-auto bg-teal-600 text-white font-bold py-4 px-10 rounded-2xl transition-all text-lg shadow-lg hover:bg-teal-700 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed focus:ring-4 focus:ring-teal-200 outline-none"
                    >
                        {submitting ? 'Sending...' : 'Complete Survey'} <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- Render: Main Question Wizard ---
  const question = PSQ_QUESTIONS[currentQIndex];
  const progress = ((currentQIndex + 1) / PSQ_QUESTIONS.length) * 100;
  const currentAnswer = answers[question.id];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" ref={topRef}>
        
      {/* Top Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 sticky top-0 z-50">
        <div 
            className="h-full bg-teal-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]"
            style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-5xl w-full">
          
          {/* Question Header & Counter */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button 
                onClick={handleBack}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100"
                aria-label="Go back"
            >
                <ChevronLeft size={24} />
            </button>
            
            <div className="bg-white border border-slate-200 text-slate-500 font-semibold text-xs md:text-sm px-4 py-1.5 rounded-full shadow-sm tracking-wide uppercase">
                Question <span className="text-teal-600 font-bold">{currentQIndex + 1}</span> of {PSQ_QUESTIONS.length}
            </div>
            
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden relative animate-in slide-in-from-right-8 duration-300 key={currentQIndex}">
            
            <div className="p-6 md:p-12 lg:p-14">
              <div className="text-center mb-10 md:mb-12">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                    {question.text}
                </h2>
                
                {/* Expandable Hint Section */}
                <div className="flex flex-col items-center">
                    <button 
                        onClick={() => setShowDescription(!showDescription)}
                        className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors focus:ring-2 focus:ring-teal-200 outline-none"
                    >
                        <HelpCircle size={16} />
                        What does this mean?
                        {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* Description Content */}
                    <div className={`
                        overflow-hidden transition-all duration-300 ease-in-out w-full max-w-3xl
                        ${showDescription ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                    `}>
                        <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 text-slate-600 text-lg leading-relaxed shadow-inner">
                            {question.description}
                        </div>
                    </div>
                </div>
              </div>

              {/* ANSWER GRID - Modern Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5 w-full max-w-5xl mx-auto">
                {OPTIONS.map((opt) => {
                  const isSelected = currentAnswer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleOptionSelect(opt.value)}
                      className={`
                        relative group w-full flex items-center justify-between 
                        p-5 md:p-7 rounded-2xl border-2 transition-all duration-200 outline-none
                        focus:ring-4 focus:ring-teal-100
                        ${isSelected 
                          ? 'bg-teal-50/80 border-teal-500 shadow-lg ring-1 ring-teal-500 z-10 scale-[1.01]' 
                          : 'bg-white border-slate-100 hover:border-teal-200 hover:bg-slate-50 hover:shadow-md'
                        }
                      `}
                    >
                      <span className={`text-lg md:text-xl font-bold text-left ${isSelected ? 'text-teal-900' : 'text-slate-700'}`}>
                          {opt.label}
                      </span>
                      
                      {/* Checkbox Indicator */}
                      <div className={`
                        flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ml-4
                        ${isSelected 
                            ? 'bg-teal-500 border-teal-500 scale-110' 
                            : 'border-slate-200 group-hover:border-teal-300 bg-white'
                        }
                      `}>
                          {isSelected && <CheckCircle2 className="text-white w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simple Footer Progress/Next */}
            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex justify-end">
                <button
                    onClick={() => handleNext(false)}
                    disabled={currentAnswer === undefined}
                    className={`flex items-center gap-2 font-bold px-8 py-3 rounded-xl transition-all text-base
                    ${currentAnswer === undefined
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
                >
                    {currentQIndex === PSQ_QUESTIONS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={20} />
                </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ReassuranceBadge({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-teal-50/50 p-5 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 text-center md:text-left border border-teal-100/50 hover:bg-teal-50 transition-colors">
            <div className="p-3 bg-white rounded-xl text-teal-600 shadow-sm ring-1 ring-teal-100">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-teal-900 text-lg md:text-base">{title}</h3>
                <p className="text-teal-700/80 text-sm">{desc}</p>
            </div>
        </div>
    )
}