// src/app/psq/analytics/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserEmail } from "@/hooks/useUser";
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Award, Activity } from 'lucide-react';
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

export default function PSQAnalyticsPage() {
  const { email, loading: authLoading } = useUserEmail();
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [questionPerformance, setQuestionPerformance] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalResponses: 0, averageScore: 0, topArea: 'N/A' });

  useEffect(() => {
    if (email) fetchGlobalStats();
  }, [email]);

  const fetchGlobalStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all surveys and their responses
    const { data: surveys } = await supabase
      .from('psq_surveys')
      .select('*, psq_responses(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!surveys || surveys.length === 0) {
      setLoading(false);
      return;
    }

    // 1. Process Trend Data (Average Score per Cycle)
    let totalScoreSum = 0;
    let totalResponseCount = 0;
    const trends = surveys.map(s => {
      const responses = s.psq_responses || [];
      if (responses.length === 0) return null;

      // Calculate avg for this survey
      const surveyTotal = responses.reduce((acc: number, r: any) => {
        // Sum all answer values (assuming map: poor=1...outstanding=6)
        const ratingMap: Record<string, number> = { 'poor': 1, 'fair': 2, 'good': 3, 'very_good': 4, 'excellent': 5, 'outstanding': 6 };
        const rSum = Object.values(r.answers || {}).reduce((a: number, v: any) => a + (ratingMap[v as string] || 0), 0);
        return acc + (rSum / (Object.keys(r.answers || {}).length || 1));
      }, 0);

      const avg = surveyTotal / responses.length;
      
      totalScoreSum += surveyTotal;
      totalResponseCount += responses.length;

      return {
        name: s.title.replace('PSQ Cycle ', ''), // Shorten name
        date: new Date(s.created_at).toLocaleDateString(),
        score: parseFloat(avg.toFixed(2))
      };
    }).filter(Boolean);

    setTrendData(trends);

    // 2. Process Question Performance (Aggregate across all surveys)
    const qCounts: Record<string, { sum: number, count: number }> = {};
    const ratingMap: Record<string, number> = { 'poor': 1, 'fair': 2, 'good': 3, 'very_good': 4, 'excellent': 5, 'outstanding': 6 };

    surveys.forEach(s => {
        s.psq_responses?.forEach((r: any) => {
            Object.entries(r.answers || {}).forEach(([qId, val]) => {
                if (!qCounts[qId]) qCounts[qId] = { sum: 0, count: 0 };
                const score = ratingMap[val as string] || 0;
                if (score > 0) {
                    qCounts[qId].sum += score;
                    qCounts[qId].count += 1;
                }
            });
        });
    });

    // Manual mapping of IDs to Short Labels (You might want to import PSQ_QUESTIONS to get real text)
    const qLabels: Record<string, string> = {
        'q1': 'Empathy', 'q2': 'Listening', 'q3': 'Attention', 'q4': 'Holistic', 'q5': 'Understanding',
        'q6': 'Compassion', 'q7': 'Positivity', 'q8': 'Clarity', 'q9': 'Empowerment', 'q10': 'Planning'
    };

    const performance = Object.entries(qCounts).map(([id, data]) => ({
        name: qLabels[id] || id,
        score: parseFloat((data.sum / data.count).toFixed(2))
    })).sort((a, b) => b.score - a.score);

    setQuestionPerformance(performance);
    
    setStats({
        totalResponses: totalResponseCount,
        averageScore: totalResponseCount ? parseFloat((totalScoreSum / totalResponseCount).toFixed(2)) : 0,
        topArea: performance.length > 0 ? performance[0].name : 'N/A'
    });

    setLoading(false);
  };

  if (authLoading || loading) return <div className="p-10 text-center text-gray-500">Loading analytics...</div>;

  return (
    <section className="main-content">
      <div className="container" style={{ maxWidth: '1000px', paddingBottom: '80px' }}>
        
        {/* Header */}
        <div className="mb-8">
            <Link href="/psq" className="inline-flex items-center gap-2 text-[var(--umbil-muted)] hover:text-[var(--umbil-brand-teal)] mb-4 font-medium transition-colors">
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Feedback Analytics</h1>
            <p className="text-[var(--umbil-muted)] mt-1">Track your patient satisfaction trends over time.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="card p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Activity size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Responses</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.totalResponses}</p>
                </div>
            </div>
            <div className="card p-6 flex items-center gap-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Rating</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.averageScore} <span className="text-sm font-medium text-gray-400">/ 6.0</span></p>
                </div>
            </div>
            <div className="card p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Award size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Strength</p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{stats.topArea}</p>
                </div>
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Trend Chart */}
            <div className="card p-6">
                <h3 className="text-lg font-bold mb-6">Performance Trend</h3>
                <div className="h-64 w-full">
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                <YAxis domain={[0, 6]} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: 'var(--umbil-brand-teal)', strokeWidth: 2 }}
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
                        <div className="h-full flex items-center justify-center text-gray-400">Not enough data yet</div>
                    )}
                </div>
            </div>

            {/* Performance Bar Chart */}
            <div className="card p-6">
                <h3 className="text-lg font-bold mb-6">Aggregate Strengths</h3>
                <div className="h-64 w-full">
                     {questionPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionPerformance} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" domain={[0, 6]} hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={100} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{fill: '#4B5563', fontSize: 11, fontWeight: 500}} 
                                />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '8px' }}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                    {questionPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? 'var(--umbil-brand-teal)' : '#CBD5E1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">Not enough data yet</div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}