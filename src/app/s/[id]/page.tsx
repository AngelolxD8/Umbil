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
  const params = useParams();
  const id = params?.id as string;
  
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
    } else {
        alert("Something went wrong. Please try again.");
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
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">All Done!</h2>
          <p className="text-gray-500 text-lg leading-relaxed">Thank you for your feedback. Your responses have been recorded anonymously.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confidential Survey</span>
            </div>
            <span className="text-teal-600 font-bold text-sm">{calculateProgress()}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-12 pb-32">
        
        {/* Intro */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-5 items-start">
           <div className="bg-blue-50 p-4 rounded-xl text-blue-600 shrink-0">
             <ShieldCheck size={28} />
           </div>
           <div>
             <h3 className="font-bold text-lg text-gray-900">Your privacy matters</h3>
             <p className="text-gray-500 mt-1 leading-relaxed">
               This feedback is collected anonymously to help your doctor improve. Please be honest in your responses.
             </p>
           </div>
        </div>

        {PSQ_QUESTIONS.map((q, index) => (
          <div key={q.id} className="scroll-mt-32 text-center" id={q.id}>
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider mb-3">
                Question {index + 1}
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {q.text}
              </h3>
            </div>
            
            {/* Big Buttons Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {RATINGS.map((rating) => {
                const isSelected = answers[q.id] === rating.value;
                return (
                  <button
                    key={rating.value}
                    onClick={() => handleSelect(q.id, rating.value)}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-200 font-bold text-sm md:text-base flex flex-col items-center justify-center gap-2 h-24
                      ${isSelected 
                        ? 'border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105 z-10' 
                        : 'border-transparent bg-white text-gray-600 shadow-sm hover:border-teal-200 hover:bg-teal-50'
                      }
                    `}
                  >
                    {rating.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Text Feedback */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-lg"><MessageSquare size={20} /></div>
            <h3 className="text-xl font-bold text-gray-900">Any final comments?</h3>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-gray-700 text-lg min-h-[150px] shadow-sm"
            placeholder="Type your thoughts here... (Optional)"
          />
        </div>

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 md:relative md:bg-transparent md:border-none md:p-0">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold text-lg py-4 rounded-xl shadow-xl shadow-gray-900/10 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {loading ? 'Submitting...' : (
                    <>Submit Feedback <ChevronRight size={20} /></>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}