// src/app/s/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function PublicSurveyPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [survey, setSurvey] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [focusedQ, setFocusedQ] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    const { data, error } = await supabase
      .from('psq_surveys')
      .select('title, status, user_id')
      .eq('id', id)
      .single();

    if (error || !data) {
      setError('This survey could not be found or has been deleted.');
    } else if (data.status === 'closed') {
      setError('This survey is no longer accepting responses.');
    } else {
      setSurvey(data);
    }
    setLoading(false);
  };

  const handleSelect = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Basic Validation: Ensure at least the rating questions are answered
    const required = PSQ_QUESTIONS.filter(q => q.type !== 'text').map(q => q.id);
    const missing = required.filter(id => !answers[id]);

    if (missing.length > 0) {
      alert(`Please complete all questions before submitting. (${missing.length} left)`);
      // Scroll to first missing
      document.getElementById(missing[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const { error } = await supabase.from('psq_responses').insert({
      survey_id: id,
      answers: answers
    });

    if (error) {
      alert('Failed to submit. Please try again.');
    } else {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F0EBF8] flex items-center justify-center">Loading...</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F0EBF8] flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-xl shadow-sm border-t-8 border-[var(--umbil-brand-teal)] p-8 text-center animate-in fade-in zoom-in duration-300">
           <div className="mx-auto w-16 h-16 bg-teal-50 text-[var(--umbil-brand-teal)] rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
           </div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
           <p className="text-gray-600 mb-6">Your feedback has been recorded anonymously. It plays a vital role in helping this doctor improve their care.</p>
           <div className="text-sm text-gray-400">Powered by Umbil</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0EBF8] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-xl shadow-sm p-8 text-center">
            <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Survey Unavailable</h2>
            <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EBF8] py-8 px-4 font-sans">
      <div className="max-w-[640px] mx-auto space-y-4">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border-t-[10px] border-[var(--umbil-brand-teal)] overflow-hidden">
            <div className="p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{survey.title || 'Patient Feedback'}</h1>
                <p className="text-gray-600 leading-relaxed mb-4">
                    Thank you for taking the time to give feedback. Your responses are <strong>anonymous</strong> and will help this doctor reflect on and improve their practice.
                </p>
                <div className="text-sm text-red-500 font-medium">* Required</div>
            </div>
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit} className="space-y-4">
            {PSQ_QUESTIONS.map((q) => (
                <div 
                    key={q.id} 
                    id={q.id}
                    onClick={() => setFocusedQ(q.id)}
                    className={`bg-white rounded-xl shadow-sm p-6 md:p-8 transition-all duration-200 border-l-4 ${focusedQ === q.id ? 'border-[var(--umbil-brand-teal)] ring-1 ring-black/5' : 'border-transparent'}`}
                >
                    <div className="mb-4">
                        <h3 className="text-base font-medium text-gray-900 leading-snug">
                            {q.text} {q.type !== 'text' && <span className="text-red-500">*</span>}
                        </h3>
                    </div>

                    {q.type === 'text' ? (
                        <div className="relative">
                            <textarea 
                                rows={3}
                                placeholder={q.placeholder}
                                value={answers[q.id] || ''}
                                onChange={(e) => handleSelect(q.id, e.target.value)}
                                className="w-full p-0 border-b border-gray-200 focus:border-[var(--umbil-brand-teal)] focus:ring-0 text-gray-700 placeholder:text-gray-400 resize-none transition-colors bg-transparent py-2"
                            />
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-200"></div>
                            <div className={`absolute bottom-0 left-0 h-[2px] bg-[var(--umbil-brand-teal)] transition-all duration-300 ${focusedQ === q.id ? 'w-full' : 'w-0'}`}></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {q.options?.map((opt) => (
                                <label 
                                    key={opt} 
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 group ${answers[q.id] === opt ? 'bg-teal-50/50 border-[var(--umbil-brand-teal)]' : 'border-transparent'}`}
                                >
                                    <div className={`relative w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[q.id] === opt ? 'border-[var(--umbil-brand-teal)]' : 'border-gray-400 group-hover:border-gray-500'}`}>
                                        {answers[q.id] === opt && <div className="w-2.5 h-2.5 bg-[var(--umbil-brand-teal)] rounded-full" />}
                                    </div>
                                    <input 
                                        type="radio" 
                                        name={q.id} 
                                        value={opt}
                                        checked={answers[q.id] === opt}
                                        onChange={() => handleSelect(q.id, opt)}
                                        className="hidden" 
                                    />
                                    <span className={`text-sm md:text-base ${answers[q.id] === opt ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                                        {opt}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <div className="flex justify-between items-center py-6">
                <button 
                    type="submit" 
                    className="bg-[var(--umbil-brand-teal)] text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-teal-500/20 hover:opacity-90 transition-all transform hover:-translate-y-0.5"
                >
                    Submit Feedback
                </button>
                
                <button type="button" onClick={() => setAnswers({})} className="text-[var(--umbil-brand-teal)] text-sm font-semibold hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors">
                    Clear form
                </button>
            </div>
        </form>

        <div className="text-center pb-8">
            <p className="text-xs text-gray-400">Never submit passwords through Google Forms.</p>
            <div className="mt-2 text-xs text-gray-400 font-medium">
                Powered by <span className="text-gray-600">Umbil</span>
            </div>
        </div>

      </div>
    </div>
  );
}