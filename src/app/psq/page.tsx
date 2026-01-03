// src/app/psq/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, ArrowRight, BarChart3, Copy, Check } from 'lucide-react';
import { useUserEmail } from "@/hooks/useUser";

export default function PSQDashboard() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { email, loading: userLoading } = useUserEmail();

  useEffect(() => {
    if (email) fetchSurveys();
  }, [email]);

  const fetchSurveys = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('psq_surveys')
      .select('*, psq_responses(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setSurveys(data);
    setLoading(false);
  };

  const createSurvey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('psq_surveys')
      .insert({ user_id: user.id, title: 'PSQ Cycle ' + new Date().getFullYear() })
      .select()
      .single();

    if (data) setSurveys([data, ...surveys]);
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (userLoading) return null;
  if (!email) {
    return (
      <section className="main-content">
        <div className="container">
          <div className="card">
            <div className="card__body">
              Please <Link href="/auth" className="text-[var(--umbil-brand-teal)] hover:underline">sign in</Link> to manage your Patient Questionnaires.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="main-content">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Patient Feedback</h2>
            <p className="text-[var(--umbil-muted)]">Manage your PSQ cycles for revalidation.</p>
          </div>
          <button
            onClick={createSurvey}
            className="btn btn--primary flex items-center gap-2"
          >
            <Plus size={18} />
            Start New Cycle
          </button>
        </div>

        {loading ? (
           <div className="card"><div className="card__body">Loading surveys...</div></div>
        ) : surveys.length === 0 ? (
          <div className="card py-16 px-5 text-center">
             <div className="mb-4 text-[var(--umbil-divider)] flex justify-center">
               <BarChart3 size={48} />
             </div>
             <h3 className="mb-2 text-lg font-medium">No surveys yet</h3>
             <p className="text-[var(--umbil-muted)] mb-6">Start a new PSQ cycle to begin collecting feedback.</p>
             <button onClick={createSurvey} className="btn btn--primary">Create First Cycle</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="card">
                <div className="card__body flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="w-full md:w-auto">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold">{survey.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                          survey.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {survey.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--umbil-muted)]">
                      Created {new Date(survey.created_at).toLocaleDateString()} • 
                      <span className="text-[var(--umbil-brand-teal)] font-semibold ml-1">
                        {survey.psq_responses?.[0]?.count || 0} responses
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => copyLink(survey.id)}
                      className="btn btn--outline flex items-center justify-center gap-2 min-w-[120px] flex-1 md:flex-none"
                    >
                      {copiedId === survey.id ? <Check size={16} /> : <Copy size={16}/>}
                      {copiedId === survey.id ? 'Copied' : 'Copy Link'}
                    </button>
                    
                    <Link 
                      href={`/psq/${survey.id}`}
                      className="btn btn--primary flex items-center justify-center gap-2 flex-1 md:flex-none"
                    >
                      View Report <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}