'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useUserEmail } from '@/hooks/useUser'; 
import { calculatePsqAnalytics, PsqAnalytics } from '@/lib/psq-analytics';
import ReportModal from '@/components/ReportModal';
// Import new function
import { getPsqData, PsqResponseRow } from '@/lib/store';

// --- VISUAL COMPONENTS ---

const TrendBar = ({ height, label, active }: { height: number; label: string; active?: boolean }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className="relative h-32 w-4 flex items-end bg-gray-100 rounded-full overflow-hidden">
      <div 
        className={`w-full rounded-full transition-all duration-1000 ${active ? 'bg-blue-600' : 'bg-blue-300'}`}
        style={{ height: `${height}%` }}
      ></div>
    </div>
    <span className={`text-xs ${active ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{label}</span>
  </div>
);

const ScoreCard = ({ title, score, total, suffix = '', subtext }: { title: string, score: number, total?: number, suffix?: string, subtext?: string }) => (
  <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full">
    <div>
      <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
      <dd className="mt-4 flex items-baseline">
        <span className="text-4xl font-extrabold tracking-tight text-gray-900">
          {score}
        </span>
        {total && <span className="ml-1 text-xl font-semibold text-gray-400">/{total}</span>}
        {suffix && <span className="ml-1 text-xl font-semibold text-gray-400">{suffix}</span>}
      </dd>
    </div>
    {subtext && <p className="mt-4 text-sm text-gray-500">{subtext}</p>}
    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
       <div 
         className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000" 
         style={{ width: `${total ? (score/total)*100 : score}%` }}
       />
    </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---

export default function MyPsqPage() {
  const router = useRouter();
  const { email, loading: userLoading } = useUserEmail(); 

  const [responses, setResponses] = useState<PsqResponseRow[]>([]);
  const [stats, setStats] = useState<PsqAnalytics | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // --- 1. Load Data from Supabase ---
  useEffect(() => {
    async function loadData() {
      if (userLoading || !email) {
         if (!userLoading) setDataLoading(false);
         return;
      }

      const { responses } = await getPsqData();
      setResponses(responses || []);
      setDataLoading(false);
    }

    loadData();
  }, [email, userLoading]);

  // --- 2. Calculate Analytics ---
  useEffect(() => {
    // Pass ALL responses to analytics engine
    const currentStats = calculatePsqAnalytics(responses);
    setStats(currentStats);
  }, [responses]);

  if (userLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HERO HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PSQ Results Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Aggregated feedback from your Patient Satisfaction Questionnaires.
              </p>
              {email && <p className="mt-1 text-xs text-gray-400">Logged in as {email}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <button
                 onClick={() => router.push('/psq/assessment')}
                 className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
               >
                 Survey Settings
               </button>
               <button
                 onClick={() => setIsReportOpen(true)}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
               >
                 Export Report PDF
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. Overall Score */}
          <ScoreCard 
            title="Overall Satisfaction" 
            score={stats?.overallScore ?? 0} 
            total={100} 
            subtext="Average across all domains"
          />

          {/* 2. Key Strength */}
          <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full">
            <div>
              <dt className="text-sm font-medium text-gray-500">Top Performing Area</dt>
              <dd className="mt-4 text-xl font-bold text-green-600">
                {stats?.keyStrength || 'N/A'}
              </dd>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Highest rated domain
            </p>
          </div>

          {/* 3. Responses Count */}
          <ScoreCard 
            title="Total Responses" 
            score={stats?.completedResponses ?? 0} 
            subtext="Surveys submitted by patients"
          />

          {/* 4. Action Card */}
          <div className="bg-blue-600 overflow-hidden rounded-xl shadow-sm border border-blue-600 p-6 flex flex-col justify-center items-center text-center h-full">
            <h3 className="text-white font-bold text-lg mb-2">Need more data?</h3>
            <p className="text-blue-100 text-sm mb-4">Share your survey link with more patients.</p>
            <button 
              onClick={() => {
                 // Logic to copy link or go to share page
                 // For now just refresh
                 router.refresh();
              }}
              className="px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              Share Survey
            </button>
          </div>
        </div>

        {/* MAIN SPLIT: Breakdown vs Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* BREAKDOWN (Left 2/3) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-lg font-medium leading-6 text-gray-900">Domain Breakdown</h3>
               <span className="text-xs text-gray-400 uppercase tracking-wider">Patient Ratings</span>
            </div>
            <div className="p-6 flex-1 space-y-6">
              {stats?.breakdown && stats.breakdown.length > 0 ? (
                stats.breakdown.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${
                          item.percentage >= 80 ? 'bg-green-500' : 
                          item.percentage >= 50 ? 'bg-blue-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <p>No feedback received yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* TREND & INSIGHTS (Right 1/3) */}
          <div className="space-y-6">
            
            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               <h3 className="text-sm font-medium text-gray-500 mb-6">Recent Responses</h3>
               <div className="flex items-end justify-around h-40 px-2 border-b border-gray-100 pb-4">
                 {stats?.trend && stats.trend.length > 0 ? (
                    stats.trend.map((t, idx) => (
                      <TrendBar 
                        key={idx} 
                        height={t.score} 
                        label={t.date} 
                        active={idx === stats.trend.length - 1} 
                      />
                    ))
                 ) : (
                    <span className="text-gray-400 text-sm self-center">No history</span>
                 )}
               </div>
               <p className="mt-4 text-xs text-gray-400 text-center">
                 Trend of the last 5 feedback submissions.
               </p>
            </div>

            {/* Quick Tip */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <div>
                   <h4 className="text-blue-900 font-medium text-sm">Focus Area</h4>
                   <p className="text-blue-700 text-sm mt-1 leading-relaxed">
                     {stats?.keyStrength !== 'No Data Yet' 
                       ? `Patients appreciate your ${stats?.keyStrength}. Keep maintaining high standards here.`
                       : "Waiting for more data to generate insights."}
                   </p>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* PDF REPORT MODAL */}
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        stats={stats}
      />

    </div>
  );
}