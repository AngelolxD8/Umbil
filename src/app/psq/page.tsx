// src/app/psq/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, ArrowRight, BarChart3, Copy, Check, FileText, PieChart } from 'lucide-react';
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

    const { data } = await supabase
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

    const { data } = await supabase
      .from('psq_surveys')
      .insert({ user_id: user.id, title: `PSQ Cycle ${new Date().getFullYear()}` })
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
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
            <h3 style={{ marginBottom: '12px' }}>Sign in Required</h3>
            <p style={{ color: 'var(--umbil-muted)', marginBottom: '24px' }}>Please sign in to manage your patient feedback.</p>
            <Link href="/auth" className="btn btn--primary" style={{ display: 'inline-block', width: '100%' }}>Sign In</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="main-content">
      <div className="container" style={{ maxWidth: '1000px', paddingBottom: '60px' }}>
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Patient Feedback</h1>
                    <p className="text-lg text-[var(--umbil-muted)]">Collect and analyze anonymous feedback for your revalidation.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/psq/analytics" className="btn btn--outline flex items-center gap-2">
                        <PieChart size={20} /> Analytics
                    </Link>
                    <button 
                        onClick={createSurvey} 
                        className="btn btn--primary flex items-center gap-2 shadow-lg shadow-teal-500/20" 
                    >
                        <Plus size={20} /> New Cycle
                    </button>
                </div>
            </div>
        </div>

        {/* Content Section */}
        {loading ? (
           <div className="space-y-4">
             {[1, 2].map(i => (
               <div key={i} className="card h-24 animate-pulse bg-gray-50"></div>
             ))}
           </div>
        ) : surveys.length === 0 ? (
          <div className="card py-20 px-6 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
               <BarChart3 size={40} className="text-gray-400" />
             </div>
             <h3 className="text-xl font-semibold mb-2">No feedback cycles yet</h3>
             <p className="text-gray-500 mb-8 max-w-md">
                Start a new cycle to get a unique link you can share with your patients via SMS or QR code.
             </p>
             <button onClick={createSurvey} className="btn btn--outline">Start Your First Cycle</button>
          </div>
        ) : (
          <div className="grid gap-5">
            {surveys.map((survey) => {
              const responseCount = survey.psq_responses?.[0]?.count || 0;
              return (
                <div key={survey.id} className="card hover:shadow-md transition-all duration-200">
                  <div className="card__body p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    
                    {/* Left: Info */}
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-[rgba(31,184,205,0.1)] rounded-xl text-[var(--umbil-brand-teal)]">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold m-0">{survey.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">
                                    {new Date(survey.created_at).toLocaleDateString()}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className={`text-sm font-semibold ${responseCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {responseCount} {responseCount === 1 ? 'Response' : 'Responses'}
                                </span>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => copyLink(survey.id)}
                        className="btn btn--outline flex items-center justify-center gap-2 min-w-[130px] flex-1 md:flex-none"
                      >
                        {copiedId === survey.id ? <Check size={16} className="text-teal-600" /> : <Copy size={16}/>}
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}