'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react';

// Options typically used in GMC/PSQ surveys
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
  const [surveyTitle, setSurveyTitle] = useState('');
  
  const [started, setStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // 1. Verify Survey Exists on Load
  useEffect(() => {
    async function checkSurvey() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('psq_surveys')
        .select('title')
        .eq('id', id)
        .single();

      if (data && !error) {
        setSurveyValid(true);
        setSurveyTitle(data.title || 'Patient Satisfaction Questionnaire');
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
    
    // Auto-advance after a short delay for better UX
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

  // --- Render: Loading & Error States ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--umbil-bg)' }}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!surveyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--umbil-bg)' }}>
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

  // --- Render: Completed State ---
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--umbil-bg)' }}>
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center transform transition-all">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 bg-teal-50" style={{ color: 'var(--umbil-brand-teal)' }}>
            <Sparkles size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            Your feedback has been successfully recorded anonymously. Your input helps improve patient care.
          </p>
          <div className="text-sm text-gray-400 font-medium bg-gray-50 py-3 px-6 rounded-full inline-block">
            You may now close this window
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Intro State ---
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--umbil-bg)' }}>
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-10 md:p-12 text-center" style={{ background: 'var(--umbil-brand-teal)' }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">{surveyTitle}</h1>
            <p className="text-teal-100 text-lg font-medium opacity-90">Anonymous Patient Feedback</p>
          </div>
          <div className="p-10 md:p-12">
            <div className="prose prose-lg max-w-none text-gray-600 mb-10 leading-relaxed">
              <p className="mb-6">
                We would be grateful if you would complete this questionnaire about your visit. 
                Feedback from this survey will enable us to identify areas that may need improvement.
              </p>
              <ul className="space-y-3 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <li className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                    <span>This questionnaire is <strong>completely anonymous</strong>.</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                    <span>Your doctor will <strong>not</strong> be able to identify your response.</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => setStarted(true)}
              className="w-full text-white font-bold py-5 px-8 rounded-xl transition-all flex items-center justify-center gap-3 text-xl hover:shadow-lg hover:-translate-y-1 transform duration-200"
              style={{ background: 'var(--umbil-brand-teal)' }}
            >
              Start Questionnaire <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Question Wizard ---
  const question = PSQ_QUESTIONS[currentQIndex];
  const progress = ((currentQIndex + 1) / PSQ_QUESTIONS.length) * 100;
  const currentAnswer = answers[question.id];

  return (
    <div className="min-h-screen py-10 px-4 md:px-6" style={{ background: 'var(--umbil-bg)' }}>
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Section */}
        <div className="mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Question {currentQIndex + 1} <span className="text-gray-300 font-normal">/ {PSQ_QUESTIONS.length}</span>
            </span>
            <span className="text-2xl font-bold" style={{ color: 'var(--umbil-brand-teal)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%`, background: 'var(--umbil-brand-teal)' }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 md:p-10">
            {/* Domain Tag */}
            <span 
                className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full mb-6"
                style={{ background: 'var(--umbil-bg)', color: 'var(--umbil-text-secondary)' }}
            >
              {question.domain}
            </span>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {question.text}
            </h2>
            
            <p className="text-gray-500 text-xl mb-10 leading-relaxed font-light">
              {question.description}
            </p>

            {/* BIG Options Grid */}
            <div className="grid grid-cols-1 gap-4">
              {OPTIONS.map((opt) => {
                const isSelected = currentAnswer === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(opt.value)}
                    className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group relative overflow-hidden
                      ${isSelected 
                        ? 'bg-teal-50 border-teal-500 shadow-md' 
                        : 'border-gray-100 hover:border-teal-200 hover:bg-gray-50'
                      }`}
                    style={isSelected ? { borderColor: 'var(--umbil-brand-teal)', backgroundColor: 'rgba(31, 184, 205, 0.05)' } : {}}
                  >
                    <span className={`text-lg font-medium ${isSelected ? 'text-teal-900' : 'text-gray-700'}`}>
                        {opt.label}
                    </span>
                    
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300 group-hover:border-teal-300'}`}
                        style={isSelected ? { backgroundColor: 'var(--umbil-brand-teal)', borderColor: 'var(--umbil-brand-teal)' } : {}}
                    >
                        {isSelected && <CheckCircle2 className="text-white w-5 h-5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
              disabled={currentQIndex === 0}
              className={`flex items-center gap-2 text-base font-semibold px-6 py-3 rounded-lg transition-colors
                ${currentQIndex === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
            >
              <ChevronLeft size={20} /> Previous
            </button>

            {currentQIndex === PSQ_QUESTIONS.length - 1 ? (
              <button
                onClick={submitFeedback}
                disabled={submitting || currentAnswer === undefined}
                className={`flex items-center gap-3 text-white font-bold py-4 px-10 rounded-xl transition-all text-lg shadow-lg hover:-translate-y-1
                  ${(submitting || currentAnswer === undefined)
                    ? 'opacity-50 cursor-not-allowed shadow-none transform-none'
                    : 'bg-green-600 hover:bg-green-700'}`}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQIndex(currentQIndex + 1)}
                disabled={currentAnswer === undefined}
                className={`flex items-center gap-2 font-bold px-8 py-3 rounded-xl transition-all text-lg
                  ${currentAnswer === undefined
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
                style={currentAnswer !== undefined ? { background: 'var(--umbil-brand-teal)' } : {}}
              >
                Next <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}