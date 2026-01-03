// src/app/psq/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PSQ_QUESTIONS } from "@/lib/psq-questions";
import { ArrowLeft, Download, Sparkles, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useUserEmail } from "@/hooks/useUser";
import Link from "next/link";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip 
} from 'recharts';

// Dynamic import for the ReflectionModal to keep page load light
const ReflectionModal = dynamic(() => import('@/components/ReflectionModal'));
import { addCPD } from "@/lib/store";

export default function PSQReportPage() {
  const { id } = useParams();
  const { email, loading: authLoading } = useUserEmail();
  
  const [survey, setSurvey] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [reflectionContext, setReflectionContext] = useState<{question: string, answer: string} | null>(null);

  // Stats State
  const [averageScore, setAverageScore] = useState(0);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (email) fetchData();
  }, [email, id]);

  const fetchData = async () => {
    try {
      const { data: surveyData } = await supabase.from('psq_surveys').select('*').eq('id', id).single();
      setSurvey(surveyData);

      const { data: responseData } = await supabase.from('psq_responses').select('*').eq('survey_id', id);
      
      if (responseData) {
        setResponses(responseData);
        processStats(responseData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processStats = (data: any[]) => {
    if (data.length === 0) return;

    const feedbacks = data.map(r => r.feedback_text).filter(t => t && t.trim().length > 0);
    setFeedbackList(feedbacks);

    const ratingMap: Record<string, number> = { 'poor': 1, 'fair': 2, 'good': 3, 'very_good': 4, 'excellent': 5, 'outstanding': 6 };
    let totalSum = 0;
    let totalCount = 0;

    // Short labels for Radar Chart to keep it clean
    const shortLabels = ["Empathy", "Listening", "Attention", "Holistic", "Understanding", "Compassion", "Positivity", "Clarity", "Empowerment", "Planning"];

    const breakdown = PSQ_QUESTIONS.map((q, index) => {
      let qSum = 0;
      let qCount = 0;
      
      data.forEach(r => {
        const val = r.answers?.[q.id];
        if (val && ratingMap[val]) {
          qSum += ratingMap[val];
          qCount++;
        }
      });

      const avg = qCount > 0 ? (qSum / qCount) : 0;
      totalSum += qSum;
      totalCount += qCount;

      return { 
        id: q.id,
        fullText: q.text,
        subject: shortLabels[index], // For Radar Chart
        A: parseFloat(avg.toFixed(2)), // For Radar Chart
        fullMark: 6
      };
    });

    setChartData(breakdown);
    setAverageScore(totalCount > 0 ? (totalSum / totalCount) : 0);
  };

  const handlePrint = () => window.print();

  const handleOpenReflection = () => {
    const contextString = `
      Survey: ${survey?.title}
      Avg Score: ${averageScore.toFixed(1)}/6.0
      Feedback: ${feedbackList.slice(0, 3).join('; ')}
    `;

    setReflectionContext({
      question: `Reflection on PSQ Feedback: ${survey?.title}`,
      answer: contextString
    });
    setIsReflectionOpen(true);
  };

  const handleSaveReflection = async (reflection: string, tags: string[], duration: number) => {
    if (!reflectionContext) return;
    const { error } = await addCPD({
        timestamp: new Date().toISOString(),
        question: reflectionContext.question,
        answer: "Automated entry from PSQ Report.",
        reflection: reflection,
        tags: [...tags, 'Patient Feedback', 'Revalidation'],
        duration: duration
    });
    
    if (!error) {
        setIsReflectionOpen(false);
        // Simple success alert or toast could go here
        alert("Reflection saved successfully!");
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center text-gray-500">Loading report...</div>;
  if (!survey) return <div className="p-10 text-center">Survey not found</div>;

  return (
    <section className="main-content">
      <div className="container" style={{ maxWidth: '1000px', paddingBottom: '80px' }}>
        
        {/* Navigation & Header */}
        <div className="print:hidden mb-8">
            <Link href="/psq" className="inline-flex items-center gap-2 text-[var(--umbil-muted)] hover:text-[var(--umbil-brand-teal)] mb-4 font-medium transition-colors">
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{survey.title}</h1>
                    <p className="text-[var(--umbil-muted)] mt-1">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="btn btn--outline flex items-center gap-2">
                        <Download size={18} /> PDF
                    </button>
                    <button onClick={handleOpenReflection} className="btn btn--primary flex items-center gap-2">
                        <Sparkles size={18} /> Reflect
                    </button>
                </div>
            </div>
        </div>

        {/* --- REPORT CONTENT --- */}
        <div id="report-content" className="space-y-6">
            
            {/* 1. Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="card p-6 flex flex-col justify-center">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Responses</div>
                    <div className="text-4xl font-extrabold text-[var(--umbil-text)]">{responses.length}</div>
                </div>
                <div className="card p-6 flex flex-col justify-center">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Average Score</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-extrabold text-[var(--umbil-brand-teal)]">{averageScore.toFixed(1)}</div>
                        <div className="text-lg text-gray-400 font-medium">/ 6.0</div>
                    </div>
                </div>
            </div>

            {responses.length === 0 ? (
                <div className="card p-10 text-center">
                    <AlertCircle size={32} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold">No data yet</h3>
                    <p className="text-gray-500">Waiting for patient responses.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* 2. Radar Chart Visualization */}
                    <div className="card p-6">
                        <h3 className="text-lg font-bold mb-4">Performance Profile</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 6]} tick={false} axisLine={false} />
                                    <Radar name="Score" dataKey="A" stroke="var(--umbil-brand-teal)" fill="var(--umbil-brand-teal)" fillOpacity={0.4} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Detailed Breakdown */}
                    <div className="card p-6">
                        <h3 className="text-lg font-bold mb-6">Question Breakdown</h3>
                        <div className="space-y-5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {chartData.map((q, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-2 text-sm font-medium">
                                        <span className="text-gray-700 truncate pr-4">{i + 1}. {q.subject}</span>
                                        <span className="font-bold text-gray-900">{q.A.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ 
                                                width: `${(q.A / 6) * 100}%`, 
                                                backgroundColor: q.A >= 5 ? '#22c55e' : q.A >= 4 ? 'var(--umbil-brand-teal)' : '#f59e0b'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Written Feedback (Full Width) */}
                    <div className="card p-6 lg:col-span-2">
                        <h3 className="text-lg font-bold mb-6">Patient Comments</h3>
                        {feedbackList.length === 0 ? (
                            <p className="text-gray-400 italic">No written comments provided.</p>
                        ) : (
                            <div className="grid gap-4">
                                {feedbackList.map((comment, i) => (
                                    <div key={i} className="p-4 bg-[var(--umbil-bg)] rounded-xl border border-[var(--umbil-divider)] text-gray-700 leading-relaxed italic relative">
                                        <span className="absolute top-2 left-2 text-4xl text-gray-200 font-serif leading-none">&ldquo;</span>
                                        <span className="relative z-10 pl-4 block">{comment}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* --- REFLECTION MODAL --- */}
        {isReflectionOpen && (
            <ReflectionModal
                isOpen={isReflectionOpen}
                onClose={() => setIsReflectionOpen(false)}
                onSave={handleSaveReflection}
                currentStreak={0}
                cpdEntry={reflectionContext}
            />
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
        @media print {
            .print\\:hidden { display: none !important; }
            body { background: white !important; }
            .card { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; }
        }
      `}</style>
    </section>
  );
}