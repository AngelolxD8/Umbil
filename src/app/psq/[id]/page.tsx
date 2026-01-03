'use client';

import { useEffect, useState } from 'react';
// 👇 CHANGE THIS LINE
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import Link from 'next/link';
// import { PSQ_QUESTIONS } from '@/lib/psq-questions'; // Uncomment if needed

export default function SurveyReport() {
  const { id } = useParams();
  const router = useRouter();
  // 👇 DELETE THIS LINE (supabase is now imported globally)
  // const supabase = createClientComponentClient(); 

  const [responses, setResponses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('psq_responses')
        .select('*')
        .eq('survey_id', id);
      
      if (data) {
        setResponses(data);
        calculateStats(data);
      }
    };
    fetchReport();
  }, [id]);

  const calculateStats = (data: any[]) => {
    setStats({ total: data.length });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/psq" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Results</h1>
          <p className="text-gray-500">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Responses</p>
          <p className="text-4xl font-bold text-teal-600 mt-2">{responses.length}</p>
          <p className="text-xs text-gray-400 mt-2">Target: 34+</p>
        </div>
        
        <div className="bg-teal-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between cursor-pointer hover:bg-teal-700 transition-colors">
          <div className="flex justify-between items-start">
            <p className="font-medium opacity-90">Download PDF</p>
            <Download className="opacity-80" size={20} />
          </div>
          <p className="text-sm opacity-80 mt-4">Formal report for appraisal</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer hover:border-teal-200 transition-colors">
           <div className="flex justify-between items-start">
            <p className="font-medium text-gray-900">Generate Reflection</p>
            <FileText className="text-teal-600" size={20} />
          </div>
          <p className="text-sm text-gray-500 mt-4">Create AI reflection from feedback</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Patient Comments</h3>
        {responses.filter(r => r.feedback_text).length === 0 ? (
          <p className="text-gray-500 italic">No text feedback received yet.</p>
        ) : (
          <div className="grid gap-4">
            {responses.filter(r => r.feedback_text).map((r, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-gray-700">"{r.feedback_text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}