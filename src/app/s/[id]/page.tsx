'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS, RATINGS } from '@/lib/psq-questions';
import { CheckCircle2 } from 'lucide-react';

export default function PublicSurvey() {
  const { id } = useParams();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < PSQ_QUESTIONS.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setLoading(true);
    
    const { error } = await supabase.from('psq_responses').insert({
      survey_id: id,
      answers: answers,
      feedback_text: feedback,
    });

    setLoading(false);
    if (!error) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You</h2>
          <p className="text-gray-500">Your feedback has been submitted securely and anonymously.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 py-4">
          <p className="text-xs font-semibold text-teal-600 tracking-wider uppercase">Anonymous Survey</p>
          <h1 className="text-lg font-bold text-gray-900 mt-1">Patient Satisfaction Questionnaire</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-12">
        {PSQ_QUESTIONS.map((q, index) => (
          <div key={q.id} className="scroll-mt-24" id={q.id}>
            <p className="text-sm text-gray-400 font-medium mb-2">Question {index + 1} of {PSQ_QUESTIONS.length}</p>
            <h3 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">{q.text}</h3>
            
            <div className="space-y-3">
              {RATINGS.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => handleSelect(q.id, rating.value)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 
                    ${answers[q.id] === rating.value 
                      ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-600' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                >
                  <span className="font-medium">{rating.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-8 border-t border-gray-100">
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Any other comments? <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all min-h-[120px]"
            placeholder="Write your feedback here..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}