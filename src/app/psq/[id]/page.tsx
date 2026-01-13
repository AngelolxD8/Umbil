'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft, Copy, ExternalLink, Lock, CheckCircle2, 
  BarChart3, FileText, Share2, Eye, Printer, AlertTriangle, Sparkles, Check
} from 'lucide-react';
import { PSQ_QUESTIONS, PSQ_SCALE } from '@/lib/psq-questions';
import { calculateAnalytics, AnalyticsResult } from '@/lib/psq-analytics';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';

export default function PSQCyclePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'preview' | 'share' | 'results' | 'reflection'>('preview');
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Reflection State
  const [reflection, setReflection] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchCycleData();
  }, [id]);

  const fetchCycleData = async () => {
    if (!id) return;
    
    // Fetch Survey + Responses
    const { data, error } = await supabase
      .from('psq_surveys')
      .select('*, psq_responses(id, answers, created_at)')
      .eq('id', id)
      .single();

    if (error || !data) {
        console.error('Error fetching survey', error);
        router.push('/psq'); // Fallback
        return;
    }

    setSurvey(data);
    const result = calculateAnalytics([data]);
    setAnalytics(result);
    setLoading(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateReflection = async () => {
    if (!analytics || !analytics.stats.thresholdMet) return;
    setIsGenerating(true);
    setReflection('');

    try {
        const response = await fetch('/api/generate-reflection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'psq_analysis',
                stats: analytics.stats,
                strengths: analytics.stats.topArea,
                weaknesses: analytics.stats.lowestArea,
                comments: analytics.textFeedback.slice(0, 5).map(t => t.good || t.improve).filter(Boolean)
            })
        });

        if (!response.body) throw new Error("No stream");
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            setReflection((prev) => prev + chunkValue);
        }

    } catch (e) {
        console.error(e);
        alert("Failed to generate reflection.");
    } finally {
        setIsGenerating(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-teal-500 rounded-full border-t-transparent"></div></div>;

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${id}`;

  return (
    <section className="bg-[var(--umbil-bg)] min-h-screen pb-20">
      <div className="container mx-auto max-w-[1000px] px-5 py-8">
        
        {/* Top Nav */}
        <div className="mb-6">
          <Link href="/psq" className="inline-flex items-center gap-2 text-[var(--umbil-muted)] hover:text-[var(--umbil-brand-teal)] text-sm font-medium mb-4">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
               <h1 className="text-2xl font-bold text-[var(--umbil-text)]">{survey.title}</h1>
               <div className="flex items-center gap-2 mt-2">
                 <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${analytics?.stats.thresholdMet ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {analytics?.stats.thresholdMet ? 'Ready for Appraisal' : 'Collecting Responses'}
                 </span>
                 <span className="text-sm text-[var(--umbil-muted)]">• Created {new Date(survey.created_at).toLocaleDateString()}</span>
               </div>
            </div>
            {/* Quick Actions */}
             <div className="flex gap-2">
                <button onClick={copyLink} className="btn btn--outline flex items-center gap-2 text-sm">
                   {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy Link'}
                </button>
             </div>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-[var(--umbil-divider)] mb-8 overflow-x-auto">
           <TabButton id="preview" label="Preview Questions" icon={<Eye size={16}/>} active={activeTab} set={setActiveTab} />
           <TabButton id="share" label="Share" icon={<Share2 size={16}/>} active={activeTab} set={setActiveTab} />
           <TabButton id="results" label="Results" icon={<BarChart3 size={16}/>} active={activeTab} set={setActiveTab} locked={!analytics?.stats.thresholdMet} />
           <TabButton id="reflection" label="Reflection" icon={<FileText size={16}/>} active={activeTab} set={setActiveTab} locked={!analytics?.stats.thresholdMet} />
        </div>

        {/* --- TAB CONTENT --- */}
        
        {/* TAB 1: PREVIEW */}
        {activeTab === 'preview' && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] rounded-xl p-6 sm:p-8">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg">Question Set Preview</h3>
                        <p className="text-sm text-[var(--umbil-muted)]">This is exactly what your patients will see.</p>
                    </div>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary text-sm flex items-center gap-2">
                        View Live Survey <ExternalLink size={14}/>
                    </a>
                 </div>

                 <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-100 space-y-8 max-h-[600px] overflow-y-auto">
                    {/* Intro */}
                    <div className="text-center pb-6 border-b border-gray-200">
                        <h4 className="font-bold text-gray-900">Help us improve your care.</h4>
                        <p className="text-sm text-gray-500 mt-1">Standard Intro Text...</p>
                    </div>
                    
                    {/* Questions List */}
                    <div className="space-y-6">
                        {PSQ_QUESTIONS.map((q, i) => (
                            <div key={q.id} className="flex gap-4">
                                <span className="text-xs font-bold text-gray-400 mt-1 w-6">{i+1}.</span>
                                <div>
                                    <p className="font-medium text-gray-800">{q.text}</p>
                                    <p className="text-xs text-teal-600 font-medium mt-1 uppercase tracking-wide">{q.domain}</p>
                                    {q.type === 'likert' && (
                                        <div className="flex gap-2 mt-2">
                                            {PSQ_SCALE.slice(0,3).map(s => (
                                                <div key={s.value} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-400">{s.label}</div>
                                            ))}
                                            <span className="text-[10px] text-gray-400 self-center">...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* TAB 2: SHARE */}
        {activeTab === 'share' && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] rounded-xl p-8 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4">
                    <Share2 size={32}/>
                 </div>
                 <h3 className="font-bold text-lg mb-2">Share via Link</h3>
                 <p className="text-sm text-[var(--umbil-muted)] mb-6">Send this via SMS, Email, or add to your website.</p>
                 
                 <div className="w-full flex gap-2 mb-4">
                    <input readOnly value={publicUrl} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm text-gray-600" />
                    <button onClick={copyLink} className="btn btn--primary">{copied ? 'Copied' : 'Copy'}</button>
                 </div>
              </div>

              <div className="bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] rounded-xl p-8 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Printer size={32}/>
                 </div>
                 <h3 className="font-bold text-lg mb-2">QR Code Poster</h3>
                 <p className="text-sm text-[var(--umbil-muted)] mb-6">Print this for your waiting room or desk.</p>
                 <button className="btn btn--outline w-full" onClick={() => window.print()}>
                    Download / Print Poster
                 </button>
              </div>
           </div>
        )}

        {/* TAB 3: RESULTS (LOCKED IF < 34) */}
        {activeTab === 'results' && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {!analytics?.stats.thresholdMet ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
                     <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={24}/>
                     </div>
                     <h3 className="text-xl font-bold text-amber-900 mb-2">Results Locked</h3>
                     <p className="text-amber-800 mb-6">
                        To protect anonymity and ensure statistical validity, results are hidden until you receive <strong>34 responses</strong>.
                     </p>
                     <div className="bg-white rounded-full h-4 w-64 mx-auto overflow-hidden border border-amber-200 mb-2">
                        <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${(analytics?.stats.totalResponses || 0)/34 * 100}%` }}/>
                     </div>
                     <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                        {analytics?.stats.totalResponses} / 34 Responses
                     </p>
                  </div>
              ) : (
                  <div className="space-y-6">
                     {/* Stats Row */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Total Responses" value={analytics.stats.totalResponses} />
                        <StatCard label="Average Score" value={analytics.stats.averageScore} sub="/ 5.0" />
                        <StatCard label="Top Domain" value={analytics.stats.topArea} isText />
                     </div>
                     
                     {/* Domain Breakdown */}
                     <div className="bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] rounded-xl p-6">
                        <h3 className="font-bold text-lg mb-6">GMC Domain Breakdown</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.breakdown} layout="vertical" margin={{ left: 100, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--umbil-card-border)" />
                                    <XAxis type="number" domain={[0, 5]} hide />
                                    <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{fill: 'var(--umbil-text)', fontSize: 10}} />
                                    <Tooltip cursor={{fill: 'var(--umbil-hover-bg)'}} />
                                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24} fill="var(--umbil-brand-teal)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Free Text (Protected) */}
                     <div className="bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] rounded-xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText size={20}/> Patient Comments
                        </h3>
                        <div className="space-y-4">
                            {analytics.textFeedback.length === 0 ? (
                                <p className="text-gray-500 italic">No text comments provided yet.</p>
                            ) : (
                                analytics.textFeedback.map((fb, i) => (
                                    <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-xs text-gray-400 mb-2">{fb.date}</div>
                                        {fb.good && <p className="text-sm text-gray-800 mb-2"><strong className="text-emerald-600">Good:</strong> {fb.good}</p>}
                                        {fb.improve && <p className="text-sm text-gray-800"><strong className="text-amber-600">Improve:</strong> {fb.improve}</p>}
                                    </div>
                                ))
                            )}
                        </div>
                     </div>
                  </div>
              )}
           </div>
        )}

        {/* TAB 4: REFLECTION */}
        {activeTab === 'reflection' && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!analytics?.stats.thresholdMet ? (
                     <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <Lock size={32} className="mb-4 opacity-50"/>
                        <p>Reflection tools unlock once you have 34 responses.</p>
                     </div>
                ) : (
                    <div className="bg-[var(--umbil-surface)] border border-[var(--umbil-card-border)] rounded-xl p-1">
                        <div className="bg-[var(--umbil-hover-bg)]/50 p-6 border-b border-[var(--umbil-card-border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--umbil-brand-teal)] text-white rounded-[var(--umbil-radius-sm)]">
                                    <Sparkles size={18} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Appraisal Reflection</h3>
                                    <p className="text-sm text-[var(--umbil-muted)]">Generate a structured reflection for your portfolio.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleGenerateReflection}
                                disabled={isGenerating}
                                className="btn btn--primary text-sm shadow-md shadow-teal-500/20"
                            >
                                {isGenerating ? 'Writing...' : 'Auto-Draft Reflection'}
                            </button>
                        </div>
                        
                        <div className="p-6 relative">
                            <textarea 
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                placeholder="Click 'Auto-Draft' to generate insights..."
                                className="w-full min-h-[400px] bg-transparent border-none outline-none resize-none text-[var(--umbil-text)] placeholder:text-[var(--umbil-muted)]/50 leading-relaxed p-4"
                            />
                        </div>
                    </div>
                )}
           </div>
        )}

      </div>
    </section>
  );
}

function TabButton({ id, label, icon, active, set, locked = false }: any) {
    return (
        <button 
            onClick={() => !locked && set(id)}
            className={`
                flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap
                ${active === id 
                    ? 'border-[var(--umbil-brand-teal)] text-[var(--umbil-brand-teal)] font-bold' 
                    : 'border-transparent text-[var(--umbil-muted)] hover:text-[var(--umbil-text)] font-medium'}
                ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            {icon} {label} {locked && <Lock size={12} className="ml-1"/>}
        </button>
    )
}

function StatCard({ label, value, sub, isText }: any) {
    return (
        <div className="bg-[var(--umbil-surface)] p-6 rounded-xl border border-[var(--umbil-card-border)] shadow-sm">
            <h4 className="text-xs font-bold uppercase text-[var(--umbil-muted)] mb-2">{label}</h4>
            <div className={`font-bold text-[var(--umbil-text)] ${isText ? 'text-lg leading-tight' : 'text-3xl'}`}>
                {value}
            </div>
            {sub && <div className="text-xs text-[var(--umbil-muted)] mt-1">{sub}</div>}
        </div>
    )
}