'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, ArrowRight, BarChart3, Download, Copy, Check } from 'lucide-react';

export default function PSQDashboard() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
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

    const { data, error } = await supabase
      .from('psq_surveys')
      .insert({ user_id: user.id, title: 'PSQ Cycle ' + new Date().getFullYear() })
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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Feedback</h1>
          <p className="text-gray-500 mt-2">Manage your PSQ cycles for revalidation.</p>
        </div>
        <button
          onClick={createSurvey}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={20} />
          Start New Cycle
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No surveys yet</h3>
          <p className="text-gray-500">Start a new PSQ cycle to begin collecting feedback.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:border-teal-100">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg text-gray-900">{survey.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${survey.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {survey.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Created {new Date(survey.created_at).toLocaleDateString()} • 
                  <span className="font-medium text-teal-600 ml-1">
                    {survey.psq_responses?.[0]?.count || 0} responses
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => copyLink(survey.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  {copiedId === survey.id ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
                  {copiedId === survey.id ? 'Copied' : 'Copy Link'}
                </button>
                
                <Link 
                  href={`/psq/${survey.id}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-sm font-medium transition-colors"
                >
                  View Report <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}