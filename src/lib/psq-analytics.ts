import { PSQ_QUESTIONS } from './psq-questions';

// --- NEW TYPES (Used by your new Analytics Page) ---
export interface SurveyData {
  id: string;
  title: string;
  created_at: string;
  psq_responses: Array<{
    answers: Record<string, any>;
    created_at: string;
    feedback_text?: string;
  }>;
}

export interface AnalyticsResult {
  stats: {
    totalResponses: number;
    averageScore: number;
    topArea: string;
    lowestArea: string;
  };
  trendData: Array<{
    name: string;
    date: string;
    score: number;
  }>;
  breakdown: Array<{
    id: string;
    name: string;
    score: number;
  }>;
  textFeedback: Array<{
    date: string;
    positive: string;
    improve: string;
  }>;
}

// --- LOGIC ---
const RATING_MAP: Record<string, number> = {
  'Yes, definitely': 5, 'Yes, always': 5, 'Very good': 5, 'Yes': 5,
  'Yes, to some extent': 3, 'Yes, mostly': 3, 'Good': 4, 'Neither good nor poor': 3,
  'No': 1, 'Poor': 2, 'Very poor': 1,
  'Not applicable': -1, 'Not sure': -1
};

function getScore(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 5 : 1;
  if (typeof val === 'string') {
    if (RATING_MAP[val] !== undefined) return RATING_MAP[val];
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getAnswerValue(answers: Record<string, any>, id: string) {
  return answers[id] ?? answers[`q${id}`];
}

export function calculateAnalytics(surveys: SurveyData[]): AnalyticsResult {
  let totalScoreSum = 0;
  let totalResponseCount = 0;
  
  const textFeedback: any[] = [];
  const domainScores: Record<string, { sum: number; count: number }> = {};
  
  const uniqueDomains = Array.from(new Set(PSQ_QUESTIONS.map(q => q.domain)));
  uniqueDomains.forEach(d => {
    domainScores[d] = { sum: 0, count: 0 };
  });

  // 1. Process Trends
  const trendData = surveys.map(survey => {
    const responses = survey.psq_responses || [];
    if (responses.length === 0) return null;

    let surveySum = 0;
    let surveyCount = 0;

    responses.forEach(r => {
      const answers = r.answers || {};
      
      const positive = getAnswerValue(answers, '11') || getAnswerValue(answers, 'positive');
      const improve = getAnswerValue(answers, '12') || getAnswerValue(answers, 'improve');
      
      if ((positive && typeof positive === 'string') || (improve && typeof improve === 'string')) {
         textFeedback.push({
            date: new Date(r.created_at).toLocaleDateString(),
            positive: typeof positive === 'string' ? positive : '',
            improve: typeof improve === 'string' ? improve : ''
         });
      }

      let responseTotal = 0;
      let responseQCount = 0;

      PSQ_QUESTIONS.forEach(q => {
        if (['11', '12'].includes(q.id)) return; 
        const val = getAnswerValue(answers, q.id);
        const score = getScore(val);

        if (score > -1) {
            responseTotal += score;
            responseQCount++;
            if (domainScores[q.domain]) {
                domainScores[q.domain].sum += score;
                domainScores[q.domain].count += 1;
            }
        }
      });

      if (responseQCount > 0) {
        const avg = responseTotal / responseQCount;
        surveySum += avg;
        surveyCount++;
      }
    });

    if (surveyCount === 0) return null;

    const surveyAvg = parseFloat((surveySum / surveyCount).toFixed(2));
    totalScoreSum += surveySum;
    totalResponseCount += surveyCount;

    return {
      name: survey.title.replace('PSQ Cycle ', '') || 'Untitled',
      date: new Date(survey.created_at).toLocaleDateString(),
      score: surveyAvg
    };
  }).filter(Boolean) as any[];

  // 2. Process Breakdown
  const breakdown = Object.entries(domainScores)
    .map(([name, data]) => ({
      id: name,
      name: name,
      score: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(2)) : 0
    }))
    .sort((a, b) => b.score - a.score);

  // 3. Final Stats
  const averageScore = totalResponseCount > 0 
    ? parseFloat((totalScoreSum / totalResponseCount).toFixed(2)) 
    : 0;

  return {
    stats: {
      totalResponses: totalResponseCount,
      averageScore,
      topArea: breakdown.length > 0 ? breakdown[0].name : 'N/A',
      lowestArea: breakdown.length > 0 ? breakdown[breakdown.length - 1].name : 'N/A'
    },
    trendData: trendData,
    breakdown: breakdown,
    textFeedback: textFeedback.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  };
}

// --- LEGACY / DEPRECATED TYPES (Restored for Build Compatibility) ---
// These are needed because src/components/ReportModal.tsx still imports them.

export interface SectionScore {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface PsqAnalytics {
  overallScore: number;
  keyStrength: string;
  breakdown: SectionScore[];
  trend: { date: string; score: number }[];
  totalQuestions: number;
  completedResponses: number;
  lastUpdated: string;
}