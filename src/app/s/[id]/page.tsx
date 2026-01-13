'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS, PSQ_INTRO, PSQ_SCALE } from '@/lib/psq-questions';
import { Check, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function PublicSurveyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [surveyValid, setSurveyValid] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkSurvey() {
      if (!id) return;
      const { data, error } = await supabase.from('psq_surveys').select('id').eq('id', id).single();
      if (data && !error) setSurveyValid(true);
      setLoading(false);
    }
    checkSurvey();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Validation: Check if all Likert questions are answered
    const missing = PSQ_QUESTIONS.filter(q => q.type === 'likert' && !answers[q.id]);
    if (missing.length > 0) {
        alert("Please answer all scored questions.");
        setSubmitting(false);
        return;
    }

    const { error } = await supabase.from('psq_responses').insert({
      survey_id: id,
      answers: answers,
      created_at: new Date().toISOString(),
    });

    if (!error) setCompleted(true);
    else alert('Error submitting. Please try again.');
    setSubmitting(false);
  };

  const setAnswer = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  if (loading) return <div className="min-h-screen bg-white" />;

  if (!surveyValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 text-center">
        <div>
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900">Survey Not Found</h1>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white text-center">
        <div className="max-w-md">
           <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <Check size={32} strokeWidth={3} />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank you</h2>
           <p className="text-gray-600">Your feedback has been recorded anonymously.</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{PSQ_INTRO.title}</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">{PSQ_INTRO.body}</p>
                
                <div className="flex items-center justify-center gap-2 text-sm text-teal-700 bg-teal-50 p-3 rounded-lg mb-8">
                    <ShieldCheck size={16}/> 100% Anonymous
                </div>

                <button 
                    onClick={() => setStarted(true)}
                    className="w-full py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Start Feedback
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
        
        {/* QUESTIONS LOOP */}
        {PSQ_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="mb-6">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Question {idx + 1}</span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{q.text}</h3>
                </div>

                {/* LIKERT */}
                {q.type === 'likert' && (
                    <div className="space-y-3">
                        {PSQ_SCALE.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                                <input 
                                    type="radio" 
                                    name={q.id} 
                                    value={opt.value}
                                    checked={answers[q.id] === opt.value}
                                    onChange={() => setAnswer(q.id, opt.value)}
                                    className="w-5 h-5 text-teal-600 accent-teal-600"
                                />
                                <span className="text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                )}

                {/* OPTION */}
                {q.type === 'option' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options?.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setAnswer(q.id, opt)}
                                className={`p-4 rounded-lg border text-left transition-all ${answers[q.id] === opt ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {/* TEXT */}
                {q.type === 'text' && (
                    <textarea 
                        className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:border-teal-500 outline-none"
                        placeholder="Optional..."
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                )}
            </div>
        ))}

        <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-5 bg-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
        >
            {submitting ? 'Submitting...' : 'Submit Feedback'} <ChevronRight/>
        </button>

      </form>
    </div>
  );
}