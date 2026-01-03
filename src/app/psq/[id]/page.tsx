// src/app/s/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';
import { CheckCircle2, ChevronRight, MessageSquare, ShieldCheck } from 'lucide-react';

const RATINGS = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'outstanding', label: 'Outstanding' },
];

export default function PublicSurvey() {
  const { id } = useParams();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSelect = (questionId: string, value: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(5);
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateProgress = () => {
    const total = PSQ_QUESTIONS.length;
    const answered = Object.keys(answers).length;
    return Math.round((answered / total) * 100);
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < PSQ_QUESTIONS.length) {
      alert('Please answer all questions to complete the survey.');
      return;
    }
    setLoading(true);
    
    const { error } = await supabase.from('psq_responses').insert({
      survey_id: id,
      answers: answers,
      feedback_text: feedback,
    });

    setLoading(false);
    if (!error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSubmitted(true);
    }
  };

  if (!mounted) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-10 rounded-3xl shadow-xl text-center border border-gray-100">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">All Done</h2>
          <p className="text-gray-500 text-lg leading-relaxed">Thank you for helping improve patient care. Your feedback is anonymous.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 font-sans">
      {/* Sticky Header with Progress */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 px-6 py-4 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-end mb-2">
            <h1 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Confidential Survey</h1>
            <span className="text-teal-600 font-bold text-sm">{calculateProgress()}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-16">
        {/* Intro Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start">
           <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
             <ShieldCheck size={24} />
           </div>
           <div>
             <h3 className="font-semibold text-gray-900">Your privacy matters</h3>
             <p className="text-sm text-gray-500 mt-1 leading-relaxed">
               This feedback is collected anonymously to help your doctor improve. Please be honest.
             </p>
           </div>
        </div>

        {PSQ_QUESTIONS.map((q, index) => (
          <div key={q.id} className="scroll-mt-32 group" id={q.id}>
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold uppercase tracking-wider mb-3">
                Question {index + 1}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                {q.text}
              </h3>
            </div>
            
            <div className="grid gap-3">
              {RATINGS.map((rating) => {
                const isSelected = answers[q.id] === rating.value;
                return (
                  <button
                    key={rating.value}
                    onClick={() => handleSelect(q.id, rating.value)}
                    className={`
                      relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ease-out flex items-center justify-between group
                      ${isSelected 
                        ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/20 scale-[1.02] z-10' 
                        : 'border-transparent bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-200 hover:scale-[1.005]'
                      }
                    `}
                  >
                    <span className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {rating.label}
                    </span>
                    
                    {/* Circle Checkbox UI */}
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${isSelected ? 'border-white bg-white/20' : 'border-gray-200 group-hover:border-gray-300'}
                    `}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Text Feedback Section */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-teal-600" />
            <h3 className="text-xl font-bold text-gray-900">Any final thoughts?</h3>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-teal-500 outline-none transition-all text-gray-700 text-lg placeholder:text-gray-300 min-h-[160px] shadow-sm resize-none"
            placeholder="Feel free to type here... (Optional)"
          />
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-6 z-10">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold text-lg py-5 rounded-2xl shadow-2xl shadow-gray-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? 'Submitting...' : (
              <>
                Submit Feedback <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}