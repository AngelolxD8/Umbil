'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Copy, Check, FileText, PieChart, Trash2 } from 'lucide-react';
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

  const deleteSurvey = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this cycle? This will remove all associated patient responses permanently.")) return;
    
    const { error } = await supabase.from('psq_surveys').delete().eq('id', id);
    if (!error) {
      setSurveys(surveys.filter(s => s.id !== id));
    } else {
      alert("Failed to delete the cycle. Please try again.");
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
                {/* Distinct Top Actions */}
                <div className="header-actions">
                    <Link href="/psq/analytics" className="btn btn--outline analytics-btn">
                        <PieChart size={20} /> Analytics
                    </Link>
                    <button onClick={createSurvey} className="btn btn--primary new-cycle-btn">
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
             <button onClick={createSurvey} className="btn btn--outline" style={{ marginTop: '24px' }}>Start Your First Cycle</button>
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
                      <button onClick={() => copyLink(survey.id)} className="btn btn--outline icon-btn" title="Copy Link">
                        {copiedId === survey.id ? <Check size={16} /> : <Copy size={16}/>}
                      </button>
                      <Link href={`/psq/${survey.id}`} className="btn btn--primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        View Report
                      </Link>
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
        }
        .icon-btn {
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .delete-btn {
            background: none;
            border: none;
            color: #ef4444;
            padding: 8px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
        }
        .delete-btn:hover {
            opacity: 1;
            background: #fef2f2;
            border-radius: 8px;
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