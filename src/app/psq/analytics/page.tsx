// src/app/psq/analytics/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserEmail } from "@/hooks/useUser";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Award, Activity, MessageSquareQuote, Calendar, Sparkles, Copy, Check } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

function AnalyticsContent() {
  const { email, loading: authLoading } = useUserEmail();
  const searchParams = useSearchParams();
  const surveyId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [questionPerformance, setQuestionPerformance] = useState<any[]>([]);
  const [textFeedback, setTextFeedback] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalResponses: 0, averageScore: 0, topArea: 'N/A', lowestArea: 'N/A' });
  const [reportTitle, setReportTitle] = useState('Feedback Analytics');
  
  // Reflection State
  const [reflection, setReflection] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (email) fetchStats();
  }, [email, surveyId]);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('psq_surveys')
      .select('*, psq_responses(*)')
      .eq('user_id', user.id);

    if (surveyId) {
      query = query.eq('id', surveyId);
    }

    const { data: surveys } = await query.order('created_at', { ascending: true });

    if (!surveys || surveys.length === 0) {
      setLoading(false);
      return;
    }

    if (surveyId && surveys.length > 0) {
        setReportTitle(`${surveys[0].title} Report`);
    }

    // --- SCORING LOGIC ---
    const ratingMap: Record<string, number> = {
        'Yes, definitely': 5, 'Yes, always': 5, 'Very good': 5, 'Yes': 5,
        'Yes, to some extent': 3, 'Yes, mostly': 3, 'Good': 4, 'Neither good nor poor': 3,
        'No': 1, 'Poor': 2, 'Very poor': 1,
        'Not applicable': -1, 'Not sure': -1
    };

    let totalScoreSum = 0;
    let totalResponseCount = 0;
    let allTextResponses: any[] = [];
    
    // 1. Process Trend Data
    const trends = surveys.map(s => {
      const responses = s.psq_responses || [];
      if (responses.length === 0) return null;

      responses.forEach((r: any) => {
        if (r.answers['q11'] || r.answers['q12']) {
            allTextResponses.push({
                date: new Date(r.created_at).toLocaleDateString(),
                positive: r.answers['q11'],
                improve: r.answers['q12']
            });
        }
      });

      const surveyTotal = responses.reduce((acc: number, r: any) => {
        let rSum = 0;
        let rCount = 0;
        Object.values(r.answers || {}).forEach((val) => {
            const score = ratingMap[val as string] || 0;
            if (score > -1) { rSum += score; rCount++; }
        });
        return acc + (rCount > 0 ? (rSum / rCount) : 0);
      }, 0);

      const avg = surveyTotal / responses.length;
      totalScoreSum += surveyTotal;
      totalResponseCount += responses.length;

      return {
        name: s.title.replace('PSQ Cycle ', ''),
        date: new Date(s.created_at).toLocaleDateString(),
        score: parseFloat(avg.toFixed(2))
      };
    }).filter(Boolean);

    setTrendData(trends);
    setTextFeedback(allTextResponses.reverse().slice(0, 10));

    // 2. Process Question Performance
    const qCounts: Record<string, { sum: number, count: number }> = {};
    surveys.forEach(s => {
        s.psq_responses?.forEach((r: any) => {
            Object.entries(r.answers || {}).forEach(([qId, val]) => {
                if (!qCounts[qId]) qCounts[qId] = { sum: 0, count: 0 };
                const score = ratingMap[val as string] || 0;
                if (score > -1) {
                    qCounts[qId].sum += score;
                    qCounts[qId].count += 1;
                }
            });
        });
    });

    const qLabels: Record<string, string> = {
        'q1': 'Setting', 'q2': 'Timing', 'q3': 'Listening', 'q4': 'Explanations', 
        'q5': 'Time', 'q6': 'Kindness', 'q7': 'Confidence', 'q8': 'Involvement', 
        'q9': 'Questions', 'q10': 'Overall Exp.'
    };

    const performance = Object.entries(qCounts)
        .filter(([id]) => qLabels[id])
        .map(([id, data]) => ({
            name: qLabels[id] || id,
            score: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(2)) : 0
        }))
        .sort((a, b) => b.score - a.score);

    setQuestionPerformance(performance);
    
    setStats({
        totalResponses: totalResponseCount,
        averageScore: totalResponseCount ? parseFloat((totalScoreSum / totalResponseCount).toFixed(2)) : 0,
        topArea: performance.length > 0 ? performance[0].name : 'N/A',
        lowestArea: performance.length > 0 ? performance[performance.length - 1].name : 'N/A'
    });

    setLoading(false);
  };

  const handleGenerateReflection = async () => {
    if (stats.totalResponses === 0) return;
    setIsGenerating(true);
    setReflection('');

    try {
        const response = await fetch('/api/generate-reflection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'psq_analysis',
                stats: stats,
                strengths: stats.topArea,
                weaknesses: stats.lowestArea,
                comments: textFeedback.slice(0, 5).map(t => t.positive || t.improve).filter(Boolean)
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
        alert("Failed to generate reflection. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reflection);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="animate-pulse text-[var(--umbil-brand-teal)] font-semibold">Generating Insights...</div>
        </div>
      );
  }

  return (
    <section className="main-content bg-slate-50 min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        
        {/* Header */}
        <div className="mb-10">
            <Link href="/psq" className="inline-flex items-center gap-2 text-slate-500 hover:text-[var(--umbil-brand-teal)] mb-6 font-medium transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{reportTitle}</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        {surveyId ? 'Detailed analysis for this specific feedback cycle.' : 'Longitudinal analysis of your patient satisfaction.'}
                    </p>
                </div>
                {trendData.length > 0 && (
                    <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Calendar size={16} className="text-[var(--umbil-brand-teal)]" />
                        Last updated: {trendData[trendData.length - 1].date}
                    </div>
                )}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard 
                label="Total Responses" 
                value={stats.totalResponses} 
                sub="Patients surveyed"
                icon={<Activity size={24} />}
                color="blue"
            />
            <StatCard 
                label="Overall Score" 
                value={stats.averageScore} 
                sub="/ 5.0"
                icon={<TrendingUp size={24} />}
                color="teal"
            />
            <StatCard 
                label="Key Strength" 
                value={stats.topArea} 
                sub="Highest rated area"
                icon={<Award size={24} />}
                color="amber"
                isText
            />
        </div>

        {/* --- REFLECTIVE PRACTICE SECTION (NEW) --- */}
        <div className="mb-10 bg-white rounded-2xl shadow-sm border border-[var(--umbil-brand-teal)] overflow-hidden">
            <div className="p-6 bg-teal-50/50 border-b border-teal-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                        <Sparkles size={20} className="text-[var(--umbil-brand-teal)]" />
                        Reflective Practice
                    </h3>
                    <p className="text-teal-700/80 text-sm mt-1">
                        Generate a structured reflection for your appraisal based on this data.
                    </p>
                </div>
                <button 
                    onClick={handleGenerateReflection}
                    disabled={isGenerating || stats.totalResponses === 0}
                    className="bg-[var(--umbil-brand-teal)] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-500/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                    {isGenerating ? 'Drafting...' : 'Auto-Draft Reflection'}
                </button>
            </div>
            
            <div className="p-6">
                <div className="relative">
                    <textarea 
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="Click 'Auto-Draft' to generate a reflection based on your results, or write your own here..."
                        className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--umbil-brand-teal)] focus:border-transparent outline-none transition-all text-slate-700 leading-relaxed resize-y"
                    />
                    {reflection && (
                        <button 
                            onClick={handleCopy}
                            className="absolute top-4 right-4 p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-[var(--umbil-brand-teal)] hover:border-[var(--umbil-brand-teal)] transition-all shadow-sm"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Trend Chart */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-[var(--umbil-brand-teal)]" />
                    Performance Trend
                </h3>
                <div className="h-72 w-full">
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                                    itemStyle={{ color: 'var(--umbil-brand-teal)', fontWeight: 600 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="var(--umbil-brand-teal)" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: 'white', strokeWidth: 2 }} 
                                    activeDot={{ r: 6, fill: 'var(--umbil-brand-teal)' }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>

            {/* Strengths Bar Chart */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Award size={20} className="text-[var(--umbil-brand-teal)]" />
                    Breakdown by Area
                </h3>
                <div className="h-72 w-full">
                     {questionPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionPerformance} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 5]} hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={100} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} 
                                />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                                    {questionPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? 'var(--umbil-brand-teal)' : '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>

        {/* Written Feedback Section */}
        {textFeedback.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquareQuote size={20} className="text-[var(--umbil-brand-teal)]" />
                        Patient Comments
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {textFeedback.map((fb, idx) => (
                        <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{fb.date}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {fb.positive && (
                                    <div>
                                        <span className="text-sm font-semibold text-emerald-600 block mb-1">Do Well</span>
                                        <p className="text-slate-700 italic">"{fb.positive}"</p>
                                    </div>
                                )}
                                {fb.improve && (
                                    <div>
                                        <span className="text-sm font-semibold text-amber-600 block mb-1">Improve</span>
                                        <p className="text-slate-700 italic">"{fb.improve}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </section>
  );
}

// Sub-components
function StatCard({ label, value, sub, icon, color, isText = false }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        teal: 'bg-teal-50 text-teal-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-transform hover:-translate-y-1 duration-300">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</h3>
                <div className="flex items-baseline gap-2">
                    <span className={`font-extrabold text-slate-900 ${isText ? 'text-xl' : 'text-3xl'}`}>
                        {value}
                    </span>
                    {sub && <span className="text-sm font-medium text-slate-400">{sub}</span>}
                </div>
            </div>
            <div className={`p-4 rounded-xl ${colors[color] || colors.teal}`}>
                {icon}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Activity size={32} className="mb-2 opacity-20" />
            <p className="text-sm">Not enough data to display chart</p>
        </div>
    );
}

export default function PSQAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-gray-400">Loading...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}