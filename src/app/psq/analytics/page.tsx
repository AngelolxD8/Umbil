// src/app/psq/analytics/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserEmail } from "@/hooks/useUser";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, TrendingUp, Award, Activity, MessageSquareQuote, 
  Calendar, Sparkles, Copy, Check, ChevronRight, Printer 
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { PSQ_QUESTIONS } from '@/lib/psq-questions';

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
        setReportTitle(surveys[0].title);
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
            id: id,
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

  // --- PRINT PDF REPORT GENERATOR ---
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print your report.");
        return;
    }

    // 1. Generate Rows for Question Table
    const scoresRows = questionPerformance.map(q => {
        // Try to find the full question text from the constant file
        // ID format in state is 'q1', 'q2', but in constant file it is '1', '2'
        const numericId = q.id.replace('q', '');
        const fullQ = PSQ_QUESTIONS.find(item => item.id === numericId);
        const questionText = fullQ ? fullQ.text : q.name;
        
        return `
            <tr>
                <td style="font-weight: 500;">${questionText}</td>
                <td style="text-align: right; font-weight: 700; color: #0e7490;">${q.score.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    // 2. Generate Comment List
    const commentsHtml = textFeedback.map(fb => `
        <div class="comment-box">
            <div class="comment-date">${fb.date}</div>
            ${fb.positive ? `<div class="comment-section"><strong>Done Well:</strong> "${fb.positive}"</div>` : ''}
            ${fb.improve ? `<div class="comment-section" style="margin-top:4px;"><strong>To Improve:</strong> "${fb.improve}"</div>` : ''}
        </div>
    `).join('');

    // 3. Reflection HTML
    const reflectionHtml = reflection 
        ? `<div class="reflection-box"><h3>💡 Reflection & Action Plan</h3><div class="markdown-body">${reflection.replace(/\n/g, '<br/>')}</div></div>`
        : '';

    // 4. Construct Full HTML
    const htmlContent = `
      <html>
        <head>
          <title>PSQ Report - ${reportTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 900px; margin: 0 auto; line-height: 1.5; }
            
            /* Header */
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: end; }
            h1 { color: #0f172a; margin: 0; font-size: 24px; }
            .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }

            /* Dashboard Summary */
            .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; background: #f0fdfa; padding: 20px; border-radius: 12px; border: 1px solid #ccfbf1; }
            .stat-box { text-align: center; }
            .stat-val { display: block; font-size: 24px; font-weight: 800; color: #0f766e; }
            .stat-label { font-size: 11px; color: #5eead4; color: #115e59; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-top: 4px; }

            /* Table Styles */
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            th { text-align: left; border-bottom: 2px solid #cbd5e1; padding: 10px; color: #64748b; text-transform: uppercase; font-size: 12px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; color: #334155; }
            tr:last-child td { border-bottom: none; }

            /* Comments */
            .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 15px; border-left: 4px solid #0d9488; padding-left: 10px; }
            .comment-box { background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid; }
            .comment-date { font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 5px; }
            .comment-section { font-size: 13px; color: #334155; font-style: italic; }

            /* Reflection */
            .reflection-box { background: #fff7ed; border: 1px solid #fed7aa; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
            .reflection-box h3 { color: #9a3412; margin: 0 0 15px 0; font-size: 16px; }
            .markdown-body { font-size: 14px; color: #431407; white-space: pre-wrap; }

            @media print { 
                body { padding: 0; } 
                .dashboard, .reflection-box, .comment-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
             <div>
                <h1>${reportTitle}</h1>
                <div class="subtitle">Patient Satisfaction Questionnaire Report • Generated by Umbil</div>
             </div>
             <div class="subtitle" style="text-align: right;">
                Date: ${new Date().toLocaleDateString()}
             </div>
          </div>
          
          <div class="dashboard">
             <div class="stat-box">
                <span class="stat-val">${stats.totalResponses}</span>
                <span class="stat-label">Total Responses</span>
             </div>
             <div class="stat-box">
                <span class="stat-val">${stats.averageScore}</span>
                <span class="stat-label">Average Score (Max 5)</span>
             </div>
             <div class="stat-box">
                <span class="stat-val" style="font-size: 18px; line-height: 1.4;">${stats.topArea}</span>
                <span class="stat-label">Highest Rated Area</span>
             </div>
          </div>

          ${reflectionHtml}

          <div class="section-title">Score Breakdown</div>
          <table>
            <thead>
                <tr>
                    <th>Question Area</th>
                    <th style="text-align: right;">Average Score</th>
                </tr>
            </thead>
            <tbody>
                ${scoresRows}
            </tbody>
          </table>

          <div class="section-title" style="page-break-before: auto;">Patient Comments (Recent)</div>
          ${commentsHtml.length > 0 ? commentsHtml : '<p style="color: #64748b; font-style: italic;">No written comments available.</p>'}
          
          <script>
            window.onload = function() { setTimeout(() => window.print(), 500); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };


  if (authLoading || loading) {
      return (
        <div className="flex h-[80vh] items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-[var(--umbil-brand-teal)] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-slate-400 font-medium animate-pulse">Gathering insights...</div>
            </div>
        </div>
      );
  }

  return (
    <section className="main-content bg-slate-50 min-h-screen font-sans">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        
        {/* Navigation & Header */}
        <div className="mb-12">
            <Link href="/psq" className="inline-flex items-center gap-2 text-slate-500 hover:text-[var(--umbil-brand-teal)] mb-6 font-medium transition-colors group px-3 py-1.5 rounded-lg hover:bg-white">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{reportTitle}</h1>
                    <p className="text-slate-500 mt-3 text-xl max-w-2xl">
                        {surveyId ? 'Detailed breakdown of patient feedback for this cycle.' : 'Longitudinal analysis of your patient satisfaction.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* EXPORT BUTTON */}
                    <button 
                        onClick={printReport}
                        className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 font-semibold shadow-sm hover:shadow-md hover:text-[var(--umbil-brand-teal)] hover:border-[var(--umbil-brand-teal)] transition-all"
                    >
                        <Printer size={18} />
                        <span className="hidden sm:inline">Export Report PDF</span>
                    </button>

                    {trendData.length > 0 && (
                        <div className="bg-white px-5 py-3 rounded-full border border-slate-200 shadow-sm flex items-center gap-3 text-sm font-medium text-slate-600">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            Last response: {trendData[trendData.length - 1].date}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Top Level Stats - Big & Bold */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <StatCard 
                label="Total Responses" 
                value={stats.totalResponses} 
                sub="Patients surveyed"
                icon={<Activity size={28} />}
                color="blue"
            />
            <StatCard 
                label="Overall Score" 
                value={stats.averageScore} 
                sub="/ 5.0"
                icon={<TrendingUp size={28} />}
                color="teal"
            />
            <StatCard 
                label="Key Strength" 
                value={stats.topArea} 
                sub="Highest rated area"
                icon={<Award size={28} />}
                color="amber"
                isText
            />
        </div>

        {/* --- REFLECTIVE PRACTICE SECTION (BIG FEATURE BOX) --- */}
        <div className="mb-12 rounded-3xl overflow-hidden shadow-lg border border-[var(--umbil-brand-teal)]/20 bg-white ring-4 ring-teal-50/50">
            <div className="p-8 md:p-10 bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--umbil-brand-teal)] text-white rounded-lg">
                            <Sparkles size={20} fill="currentColor" />
                        </div>
                        <h3 className="text-2xl font-bold text-teal-950">Appraisal Reflection</h3>
                    </div>
                    <p className="text-teal-800/70 text-base max-w-xl leading-relaxed">
                        Instantly generate a structured, GMC-aligned reflection based on this data to use in your annual appraisal.
                    </p>
                </div>
                <button 
                    onClick={handleGenerateReflection}
                    disabled={isGenerating || stats.totalResponses === 0}
                    className="group bg-[var(--umbil-brand-teal)] hover:bg-[#1a9eb3] text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-base transform hover:-translate-y-0.5"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            Writing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Auto-Draft Reflection
                        </>
                    )}
                </button>
            </div>
            
            <div className="p-8 md:p-10 bg-white relative group">
                {/* BIG TEXTAREA HERE */}
                <textarea 
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder={stats.totalResponses > 0 ? "Click the button above to generate your reflection..." : "Collect responses first to generate a reflection."}
                    className="w-full min-h-[400px] p-8 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[var(--umbil-brand-teal)]/10 focus:border-[var(--umbil-brand-teal)] outline-none transition-all text-slate-700 leading-8 text-lg resize-y placeholder:text-slate-400 font-serif"
                />
                
                {/* Copy Button (Floats inside) */}
                {reflection && (
                    <div className="absolute top-14 right-14 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-all ${
                                copied 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:text-[var(--umbil-brand-teal)] hover:border-[var(--umbil-brand-teal)]'
                            }`}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Charts Grid - More Spacious */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-12">
            {/* Trend Chart */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20} /></div>
                        Performance Trend
                    </h3>
                </div>
                <div className="h-80 w-full">
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={15} />
                                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px' }} 
                                    itemStyle={{ color: 'var(--umbil-brand-teal)', fontWeight: 700, fontSize: '14px' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="var(--umbil-brand-teal)" 
                                    strokeWidth={4} 
                                    dot={{ r: 6, fill: 'white', strokeWidth: 3 }} 
                                    activeDot={{ r: 8, fill: 'var(--umbil-brand-teal)', stroke: 'white', strokeWidth: 2 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>

            {/* Strengths Bar Chart */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Award size={20} /></div>
                        Breakdown by Area
                    </h3>
                </div>
                <div className="h-80 w-full">
                     {questionPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={questionPerformance} layout="vertical" margin={{ left: 60, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 5]} hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={100} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#475569', fontSize: 13, fontWeight: 600}} 
                                />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={32}>
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

        {/* Written Feedback Section - Cleaner List */}
        {textFeedback.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><MessageSquareQuote size={20} /></div>
                        Patient Comments
                    </h3>
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Feedback</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {textFeedback.map((fb, idx) => (
                        <div key={idx} className="p-8 hover:bg-slate-50 transition-colors group">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                                <div className="md:w-32 shrink-0">
                                    <div className="text-sm font-bold text-slate-400">{fb.date}</div>
                                </div>
                                <div className="grow grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {fb.positive && (
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded mb-2 uppercase tracking-wide">Done Well</span>
                                            <p className="text-slate-700 text-lg leading-relaxed">"{fb.positive}"</p>
                                        </div>
                                    )}
                                    {fb.improve && (
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded mb-2 uppercase tracking-wide">To Improve</span>
                                            <p className="text-slate-700 text-lg leading-relaxed">"{fb.improve}"</p>
                                        </div>
                                    )}
                                </div>
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
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-1 duration-300">
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</h3>
                <div className="flex items-baseline gap-2">
                    <span className={`font-extrabold text-slate-900 ${isText ? 'text-2xl line-clamp-1' : 'text-4xl'}`} title={isText ? value : ''}>
                        {value}
                    </span>
                    {sub && <span className="text-sm font-medium text-slate-400">{sub}</span>}
                </div>
            </div>
            <div className={`p-5 rounded-2xl ${colors[color] || colors.teal}`}>
                {icon}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Activity size={40} className="mb-4 opacity-20" />
            <p className="text-base font-medium">No data available yet</p>
            <p className="text-sm opacity-60">Share your survey link to get started</p>
        </div>
    );
}

export default function PSQAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse font-semibold text-slate-400">Loading Report...</div></div>}>
      <AnalyticsContent />
    </Suspense>
  );
}