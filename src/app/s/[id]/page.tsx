// src/app/s/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PSQ_QUESTIONS, RATINGS } from '@/lib/psq-questions';
import { CheckCircle2 } from 'lucide-react';

export default function PublicSurvey() {
  const params = useParams();
  const id = params?.id as string;
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
      <div className="min-h-[100dvh] bg-[var(--umbil-bg)] flex items-center justify-center p-5">
        <div className="card w-full max-w-[480px] p-10 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Thank You</h2>
          <p className="text-[var(--umbil-muted)]">Your feedback has been submitted securely and anonymously.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--umbil-bg)] pb-20">
      {/* Header */}
      <div className="bg-[var(--umbil-surface)] border-b border-[var(--umbil-divider)] sticky top-0 z-10">
        <div className="max-w-[600px] mx-auto px-6 py-5">
          <p className="text-xs font-semibold text-[var(--umbil-brand-teal)] tracking-wider uppercase mb-1">Anonymous Survey</p>
          <h1 className="text-xl font-bold m-0">Patient Satisfaction Questionnaire</h1>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto px-6 py-8 flex flex-col gap-12">
        {PSQ_QUESTIONS.map((q, index) => (
          <div key={q.id} id={q.id} className="scroll-mt-[100px]">
            <p className="text-sm text-[var(--umbil-muted)] font-medium mb-2">Question {index + 1} of {PSQ_QUESTIONS.length}</p>
            <h3 className="text-lg font-medium mb-6 leading-relaxed">{q.text}</h3>
            
            <div className="flex flex-col gap-2.5">
              {RATINGS.map((rating) => {
                const isSelected = answers[q.id] === rating.value;
                return (
                  <button
                    key={rating.value}
                    onClick={() => handleSelect(q.id, rating.value)}
                    className={`w-full text-left p-4 rounded-[var(--umbil-radius-sm)] border transition-all duration-200 
                      ${isSelected 
                        ? 'border-[var(--umbil-brand-teal)] bg-[rgba(31,184,205,0.05)] text-[var(--umbil-brand-teal)] font-semibold shadow-[0_0_0_1px_var(--umbil-brand-teal)]' 
                        : 'border-[var(--umbil-card-border)] bg-[var(--umbil-surface)] text-[var(--umbil-text)] hover:bg-[var(--umbil-hover-bg)]'
                      }`}
                  >
                    {rating.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-8 border-t border-[var(--umbil-divider)]">
          <label className="block text-lg font-semibold mb-4">
            Any other comments? <span className="text-[var(--umbil-muted)] font-normal text-sm">(Optional)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-4 text-base rounded-[var(--umbil-radius-sm)] border border-[var(--umbil-card-border)] bg-[var(--umbil-surface)] min-h-[120px] focus:outline-none focus:border-[var(--umbil-brand-teal)] focus:ring-1 focus:ring-[var(--umbil-brand-teal)] transition-all"
            placeholder="Write your feedback here..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn--primary p-4 text-lg w-full shadow-[var(--umbil-shadow-lg)]"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}