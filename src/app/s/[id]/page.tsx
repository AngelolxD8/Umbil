"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PSQ_QUESTIONS } from "@/lib/psq-questions";
import { ArrowLeft, Download, Sparkles, Users, Activity } from "lucide-react";
import dynamic from "next/dynamic";
import { useUserEmail } from "@/hooks/useUser";
import Link from "next/link";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { addCPD } from "@/lib/store";

const ReflectionModal = dynamic(() => import('@/components/ReflectionModal'));

export default function PSQReportPage() {
  const { id } = useParams();
  const { email, loading: authLoading } = useUserEmail();
  
  const [survey, setSurvey] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [reflectionContext, setReflectionContext] = useState<{question: string, answer: string} | null>(null);
  const [averageScore, setAverageScore] = useState(0);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => { if (email) fetchData(); }, [email, id]);

  const fetchData = async () => {
    const { data: surveyData } = await supabase.from('psq_surveys').select('*').eq('id', id).single();
    const { data: responseData } = await supabase.from('psq_responses').select('*').eq('survey_id', id);
    setSurvey(surveyData);
    if (responseData) {
      setResponses(responseData);
      processStats(responseData);
    }
    setLoading(false);
  };

  const processStats = (data: any[]) => {
    const feedbacks = data.map(r => r.feedback_text).filter(t => t && t.trim().length > 0);
    setFeedbackList(feedbacks);
    const ratingMap: Record<string, number> = { 'poor': 1, 'fair': 2, 'good': 3, 'very_good': 4, 'excellent': 5, 'outstanding': 6 };
    let totalSum = 0;
    let totalCount = 0;
    const shortLabels = ["Empathy", "Listening", "Attention", "Holistic", "Understanding", "Compassion", "Positivity", "Clarity", "Empowerment", "Planning"];

    const breakdown = PSQ_QUESTIONS.map((q, index) => {
      let qSum = 0, qCount = 0;
      data.forEach(r => {
        const val = r.answers?.[q.id];
        if (val && ratingMap[val]) { qSum += ratingMap[val]; qCount++; }
      });
      const avg = qCount > 0 ? (qSum / qCount) : 0;
      totalSum += qSum; totalCount += qCount;
      return { subject: shortLabels[index], A: parseFloat(avg.toFixed(2)), fullMark: 6 };
    });

    setChartData(breakdown);
    setAverageScore(totalCount > 0 ? (totalSum / totalCount) : 0);
  };

  const handleOpenReflection = () => {
    setReflectionContext({
      question: `Reflection on PSQ Feedback: ${survey?.title}`,
      answer: `Average Score: ${averageScore.toFixed(1)}/6.0 based on ${responses.length} responses.`
    });
    setIsReflectionOpen(true);
  };

  const handleSaveReflection = async (reflection: string, tags: string[], duration: number) => {
    const { error } = await addCPD({
        timestamp: new Date().toISOString(),
        question: reflectionContext!.question,
        answer: "Automated entry from PSQ Report.",
        reflection,
        tags: [...tags, 'Patient Feedback'],
        duration
    });
    if (!error) { setIsReflectionOpen(false); alert("Reflection saved!"); }
  };

  if (authLoading || loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <section className="main-content">
      <div className="container" style={{ maxWidth: '1000px', paddingBottom: '80px' }}>
        
        <div className="print:hidden mb-8">
            <Link href="/psq" className="btn btn--outline" style={{ padding: '8px 12px', border: 'none', background: 'none', color: 'var(--umbil-muted)', marginBottom: '16px' }}>
                <ArrowLeft size={18} /> Back
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{survey.title}</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => window.print()} className="btn btn--outline"><Download size={18} /></button>
                    <button onClick={handleOpenReflection} className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18} /> Reflect</button>
                </div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            {/* Stats Card: Left-aligned icon */}
            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(31, 184, 205, 0.1)', borderRadius: '16px', color: 'var(--umbil-brand-teal)' }}><Users size={32} /></div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--umbil-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Responses</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{responses.length}</div>
                </div>
            </div>
            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '16px', color: '#22c55e' }}><Activity size={32} /></div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--umbil-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Average Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{averageScore.toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--umbil-muted)' }}>/6.0</span></div>
                </div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px' }}>Strengths Profile</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="var(--umbil-divider)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--umbil-muted)', fontSize: 10 }} />
                            <Radar name="Score" dataKey="A" stroke="var(--umbil-brand-teal)" fill="var(--umbil-brand-teal)" fillOpacity={0.4} />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px' }}>Patient Comments</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {feedbackList.length === 0 ? <p style={{ color: 'var(--umbil-muted)' }}>No comments yet.</p> : feedbackList.map((f, i) => (
                        <div key={i} style={{ padding: '12px', background: 'var(--umbil-bg)', borderRadius: '10px', fontSize: '0.9rem', border: '1px solid var(--umbil-divider)' }}>"{f}"</div>
                    ))}
                </div>
            </div>
        </div>

        {isReflectionOpen && (
            <ReflectionModal isOpen={isReflectionOpen} onClose={() => setIsReflectionOpen(false)} onSave={handleSaveReflection} currentStreak={0} cpdEntry={reflectionContext} />
        )}
      </div>
    </section>
  );
}