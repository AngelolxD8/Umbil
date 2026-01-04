'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';

// Options with colors for "Heatmap" style feel (optional visual cue)
const OPTIONS = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Less than satisfactory" },
  { value: 3, label: "Satisfactory" },
  { value: 4, label: "Good" },
  { value: 5, label: "Very Good" },
  { value: 6, label: "Excellent" },
  { value: 0, label: "Does not apply" },
];

export default function PublicSurveyPage() {
  const params = useParams();
  const id = params?.id as string; // This is the SURVEY ID (UUID)

  // State
  const [loading, setLoading] = useState(true);
  const [surveyValid, setSurveyValid] = useState(false);
  
  const [started, setStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // 1. Verify Survey Exists on Load
  useEffect(() => {
    async function checkSurvey() {
      if (!id) return;
      
      // We check if it exists, but we WON'T use the internal title (e.g. "Test")
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

  // 2. Handle Answer Selection
  const handleOptionSelect = (value: number) => {
    const currentQId = PSQ_QUESTIONS[currentQIndex].id;
    setAnswers((prev) => ({ ...prev, [currentQId]: value }));
    
    // Auto-advance
    setTimeout(() => {
      if (currentQIndex < PSQ_QUESTIONS.length - 1) {
        setCurrentQIndex(currentQIndex + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 250);
  };

  // 3. Submit to Supabase
  const submitFeedback = async () => {
    setSubmitting(true);
    
    const payload = {
      survey_id: id,
      answers: answers,
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
      setCompleted(true);
      window.scrollTo(0, 0);
    }
  };

  // --- Render: Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // --- Render: Error ---
  if (!surveyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Survey Not Found</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            This survey link appears to be invalid or has expired. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  // --- Render: Completed ---
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center transform transition-all">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 bg-teal-50 text-teal-600">
            <Sparkles size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-10 text-xl leading-relaxed">
            Your feedback has been successfully recorded anonymously.
          </p>
          <div className="text-sm text-gray-400 font-medium bg-gray-50 py-3 px-6 rounded-full inline-block">
            You may now close this window
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Intro ---
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-12 md:p-16 text-center bg-teal-600 text-white pattern-bg">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <MessageSquare size={40} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Patient Feedback</h1>
            <p className="text-teal-100 text-xl font-medium opacity-90">Anonymous Questionnaire</p>
          </div>
          
          <div className="p-12 md:p-16 flex flex-col items-center">
            <div className="prose prose-lg text-center text-gray-600 mb-12 max-w-2xl leading-relaxed">
              <p>
                We would be grateful if you would complete this questionnaire about your visit. 
                Your feedback helps us identify areas for improvement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                <div className="bg-teal-50 p-6 rounded-2xl flex items-center gap-4 text-left">
                    <div className="p-2 bg-white rounded-full text-teal-600 shadow-sm"><CheckCircle2 size={24} /></div>
                    <span className="font-medium text-teal-900">Completely Anonymous</span>
                </div>
                <div className="bg-teal-50 p-6 rounded-2xl flex items-center gap-4 text-left">
                     <div className="p-2 bg-white rounded-full text-teal-600 shadow-sm"><CheckCircle2 size={24} /></div>
                    <span className="font-medium text-teal-900">Takes less than 2 mins</span>
                </div>
            </div>

            <button 
              onClick={() => setStarted(true)}
              className="w-full md:w-auto min-w-[300px] bg-teal-600 text-white font-bold py-5 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl hover:bg-teal-700 hover:shadow-xl hover:-translate-y-1 transform duration-200"
            >
              Start Questionnaire <ChevronRight size={24} />
            </button>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
        
      {/* Top Progress Bar - Fixed to top or just at top of flow */}
      <div className="w-full h-2 bg-gray-200">
        <div 
            className="h-full bg-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-5xl w-full">
          
          {/* Header Info */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
                 <span className="text-sm font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Question {currentQIndex + 1} of {PSQ_QUESTIONS.length}
                 </span>
                 <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                    {question.domain}
                 </span>
            </div>
            {/* Circular Progress Badge */}
            <div className="flex flex-col items-end">
                <div className="w-14 h-14 rounded-full border-4 border-teal-100 flex items-center justify-center bg-white text-teal-700 font-bold text-sm shadow-sm">
                    {Math.round(progress)}%
                </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">
            
            <div className="p-8 md:p-12 lg:p-16 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {question.text}
              </h2>
              
              <p className="text-gray-500 text-xl md:text-2xl mb-12 font-light max-w-3xl mx-auto leading-relaxed">
                {question.description}
              </p>

              {/* ANSWER GRID - The "Automatic Boxes" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
                {OPTIONS.map((opt) => {
                  const isSelected = currentAnswer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleOptionSelect(opt.value)}
                      className={`
                        relative group flex items-center justify-between 
                        p-6 md:p-8 rounded-2xl border-2 transition-all duration-200 
                        hover:shadow-lg hover:-translate-y-1
                        ${isSelected 
                          ? 'bg-teal-50 border-teal-500 shadow-md ring-1 ring-teal-500 z-10' 
                          : 'bg-white border-gray-100 hover:border-teal-300'
                        }
                      `}
                    >
                      <span className={`text-lg md:text-xl font-bold ${isSelected ? 'text-teal-900' : 'text-gray-700'}`}>
                          {opt.label}
                      </span>
                      
                      {/* Custom Checkbox Circle */}
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
                        ${isSelected 
                            ? 'bg-teal-500 border-teal-500' 
                            : 'border-gray-200 group-hover:border-teal-300'
                        }
                      `}>
                          {isSelected && <CheckCircle2 className="text-white w-5 h-5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Navigation Area */}
            <div className="bg-gray-50 p-6 md:p-10 border-t border-gray-100 flex justify-between items-center">
                <button
                onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                disabled={currentQIndex === 0}
                className={`flex items-center gap-2 text-lg font-semibold px-6 py-3 rounded-xl transition-colors
                    ${currentQIndex === 0 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                <ChevronLeft size={24} /> Back
                </button>

                {currentQIndex === PSQ_QUESTIONS.length - 1 ? (
                <button
                    onClick={submitFeedback}
                    disabled={submitting || currentAnswer === undefined}
                    className={`flex items-center gap-3 text-white font-bold py-4 px-12 rounded-2xl transition-all text-xl shadow-lg hover:-translate-y-1
                    ${(submitting || currentAnswer === undefined)
                        ? 'opacity-50 cursor-not-allowed shadow-none transform-none bg-gray-400'
                        : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {submitting ? 'Sending...' : 'Complete Survey'}
                </button>
                ) : (
                <button
                    onClick={() => setCurrentQIndex(currentQIndex + 1)}
                    disabled={currentAnswer === undefined}
                    className={`flex items-center gap-2 font-bold px-10 py-4 rounded-2xl transition-all text-lg
                    ${currentAnswer === undefined
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
                >
                    Next <ChevronRight size={24} />
                </button>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}