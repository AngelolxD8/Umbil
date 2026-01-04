'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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
        window.scrollTo(0, 0);
      }
    }, 250);
  };

  // 3. Submit to Supabase
  const submitFeedback = async () => {
    setSubmitting(true);
    
    // Construct payload - Adjust this based on your exact table schema
    // Assuming 'psq_responses' has columns: survey_id (uuid), answers (jsonb)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!surveyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Survey Not Found</h1>
          <p className="text-gray-600 mb-6">
            This survey link appears to be invalid or has expired. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  // --- Render: Completed State ---
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-8">
            Your feedback has been successfully recorded anonymously. Your input helps improve patient care.
          </p>
          <div className="text-sm text-gray-400">
            You may now close this window.
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Intro State ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">{surveyTitle}</h1>
            <p className="text-blue-100">Anonymous Patient Feedback</p>
          </div>
          <div className="p-8">
            <div className="prose max-w-none text-gray-600 mb-8">
              <p>
                We would be grateful if you would complete this questionnaire about your visit. 
                Feedback from this survey will enable us to identify areas that may need improvement. 
                Your opinions are very valuable to us.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li>This questionnaire is <strong>completely anonymous</strong>.</li>
                <li>Your doctor will <strong>not</strong> be able to identify your individual response.</li>
                <li>It should take less than 2 minutes to complete.</li>
              </ul>
            </div>
            <button 
              onClick={() => setStarted(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Start Questionnaire <ChevronRight />
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            <span>Question {currentQIndex + 1} of {PSQ_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              {question.domain}
            </span>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {question.text}
            </h2>
            
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {question.description}
            </p>

            <div className="space-y-3">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionSelect(opt.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between group
                    ${currentAnswer === opt.value 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  {currentAnswer === opt.value && (
                    <CheckCircle2 className="text-blue-600 w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
              disabled={currentQIndex === 0}
              className={`flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg transition-colors
                ${currentQIndex === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {currentQIndex === PSQ_QUESTIONS.length - 1 ? (
              <button
                onClick={submitFeedback}
                disabled={submitting || currentAnswer === undefined}
                className={`flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all
                  ${(submitting || currentAnswer === undefined)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-green-700 shadow-md hover:shadow-lg'}`}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQIndex(currentQIndex + 1)}
                disabled={currentAnswer === undefined}
                className={`flex items-center gap-1 font-medium px-6 py-2 rounded-lg transition-all
                  ${currentAnswer === undefined
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}