// src/app/psq/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Copy, Check, FileText, PieChart, Trash2, X, ExternalLink } from 'lucide-react';
import { useUserEmail } from "@/hooks/useUser";

export default function PSQDashboard() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [creating, setCreating] = useState(false);

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

  const handleCreateOpen = () => {
    setNewSurveyTitle(`PSQ Cycle ${new Date().getFullYear()}`);
    setIsModalOpen(true);
  };

  const createSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        const { data } = await supabase
        .from('psq_surveys')
        .insert({ user_id: user.id, title: newSurveyTitle })
        .select()
        .single();

        if (data) {
            setSurveys([data, ...surveys]);
            setIsModalOpen(false);
        }
    }
    setCreating(false);
  };

  const deleteSurvey = async (id: string) => {
    if (!window.confirm("Are you sure? This will delete the survey AND all patient responses collected.")) return;
    
    // 1. Delete associated responses first (Fixes the Supabase FK Constraint error)
    const { error: responseError } = await supabase
        .from('psq_responses')
        .delete()
        .eq('survey_id', id);

    if (responseError) {
        console.error("Error deleting responses:", responseError);
        // We continue anyway, in case there were no responses
    }

    // 2. Delete the survey itself
    const { error } = await supabase.from('psq_surveys').delete().eq('id', id);
    
    if (!error) {
      setSurveys(surveys.filter(s => s.id !== id));
    } else {
      alert("Could not delete. Please try again.");
    }
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
        <div style={{ marginBottom: '40px' }}>
            <div className="dashboard-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>Patient Feedback</h1>
                    <p style={{ fontSize: '1.05rem', color: 'var(--umbil-muted)' }}>Collect and analyze anonymous feedback for your revalidation.</p>
                </div>
                {/* Top Actions */}
                <div className="header-actions">
                    <Link href="/psq/analytics" className="btn btn--outline analytics-btn">
                        <PieChart size={20} /> Analytics
                    </Link>
                    <button onClick={handleCreateOpen} className="btn btn--primary new-cycle-btn">
                        <Plus size={20} /> New Cycle
                    </button>
                </div>
            </div>
        </div>

        {/* List Section */}
        {loading ? (
           <div style={{ display: 'grid', gap: '16px' }}>
             {[1, 2].map(i => <div key={i} className="card" style={{ height: '100px', background: 'var(--umbil-hover-bg)' }}></div>)}
           </div>
        ) : surveys.length === 0 ? (
          <div className="card" style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No feedback cycles yet</h3>
             <button onClick={handleCreateOpen} className="btn btn--outline" style={{ marginTop: '24px' }}>Start Your First Cycle</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {surveys.map((survey) => {
              const responseCount = survey.psq_responses?.[0]?.count || 0;
              return (
                <div key={survey.id} className="card">
                  <div className="card__body psq-card-body">
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                        <div style={{ padding: '12px', background: 'var(--umbil-bg)', borderRadius: '12px', color: 'var(--umbil-brand-teal)' }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{survey.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--umbil-muted)', background: 'var(--umbil-hover-bg)', padding: '2px 8px', borderRadius: '6px' }}>
                                    {new Date(survey.created_at).toLocaleDateString()}
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--umbil-brand-teal)' }}>
                                    {responseCount} {responseCount === 1 ? 'Response' : 'Responses'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card-actions">
                      {/* Link Button */}
                      <button 
                        onClick={() => copyLink(survey.id)} 
                        className="btn btn--outline" 
                        title="Copy Link to Clipboard"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}
                      >
                        {copiedId === survey.id ? <Check size={16} /> : <Copy size={16}/>}
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {copiedId === survey.id ? 'Copied' : 'Link to Survey'}
                        </span>
                      </button>

                      {/* Report Button */}
                      <Link href={`/psq/analytics?id=${survey.id}`} className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}>
                        View Report <ExternalLink size={14} />
                      </Link>

                      {/* Delete Button */}
                      <button onClick={() => deleteSurvey(survey.id)} className="delete-btn" title="Delete Cycle">
                        <Trash2 size={20} />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Center Aligned Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-900">Start New Cycle</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={createSurvey} className="p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cycle Name</label>
                    <input 
                        type="text" 
                        value={newSurveyTitle}
                        onChange={(e) => setNewSurveyTitle(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--umbil-brand-teal)] focus:border-transparent outline-none transition-all"
                        placeholder="e.g. PSQ 2026"
                        autoFocus
                    />
                    <div className="mt-8 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={creating} className="flex-1 py-3 bg-[var(--umbil-brand-teal)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-teal-500/20">
                            {creating ? 'Creating...' : 'Create Cycle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-header {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .header-actions {
            display: flex;
            gap: 12px;
            width: 100%;
        }
        .analytics-btn, .new-cycle-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 24px;
        }
        .analytics-btn {
            border: 2px solid var(--umbil-divider);
            font-weight: 700;
        }
        .new-cycle-btn {
            background: var(--umbil-brand-teal);
            box-shadow: 0 4px 12px rgba(31, 184, 205, 0.3);
        }
        .psq-card-body {
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
        }
        .card-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .delete-btn {
            background: none;
            border: none;
            color: #ef4444;
            padding: 10px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
            border-radius: 8px;
        }
        .delete-btn:hover {
            opacity: 1;
            background: #fef2f2;
        }

        @media (min-width: 768px) {
            .dashboard-header {
                flex-direction: row;
                justify-content: space-between;
                align-items: flex-start;
            }
            .header-actions {
                width: auto;
            }
        }
      `}</style>
    </section>
  );
}