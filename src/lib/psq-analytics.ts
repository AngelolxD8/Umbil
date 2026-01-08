import { PSQ_QUESTIONS } from './psq-questions';

// --- Types ---
export interface SectionScore {
  id: string;
  label: string;
  score: number;      // Average score (0-5 or 0-100 normalized)
  maxScore: number;
  percentage: number; // 0-100%
}

export interface PsqAnalytics {
  overallScore: number;
  keyStrength: string;
  breakdown: SectionScore[];
  trend: { date: string; score: number }[];
  totalQuestions: number;
  completedResponses: number; // Changed from 'completedQuestions' to 'completedResponses'
  lastUpdated: string;
}

// --- Logic ---
// Now accepts an Array of responses (from your DB)
export function calculatePsqAnalytics(responses: Array<{ answers: Record<string, any>, created_at?: string }>): PsqAnalytics {
  const safeResponses = responses || [];
  const totalResponses = safeResponses.length;
  
  // 1. Identify Unique Domains
  const uniqueDomains = Array.from(new Set(PSQ_QUESTIONS.map(q => q.domain)));

  // 2. Calculate Breakdown (Average across all responses)
  const breakdown: SectionScore[] = uniqueDomains.map((domainName) => {
    const domainQuestions = PSQ_QUESTIONS.filter((q) => q.domain === domainName);
    
    let totalDomainScore = 0;
    let totalDomainMax = 0;

    // Loop through every response to get an aggregate for this domain
    safeResponses.forEach(response => {
       const answers = response.answers || {};
       
       domainQuestions.forEach((q) => {
         const answer = answers[q.id];
         let val = 0;
         let maxVal = 5; // Likert 1-5

         if (typeof answer === 'number') {
           val = answer;
         } else if (typeof answer === 'string') {
           val = parseInt(answer, 10) || 0;
         } else if (answer === true) {
           val = 1; maxVal = 1;
         }

         // Add to totals
         totalDomainScore += val;
         totalDomainMax += maxVal;
       });
    });

    // Calculate Percentage for this domain across all surveys
    const percentage = totalDomainMax > 0 ? Math.round((totalDomainScore / totalDomainMax) * 100) : 0;

    return {
      id: domainName,
      label: domainName,
      score: totalDomainScore, // Raw sum (optional use)
      maxScore: totalDomainMax,
      percentage: percentage,
    };
  });

  // 3. Overall Score (Average of domain percentages)
  // We use average of domain percentages to ensure equal weight to domains
  const validDomains = breakdown.filter(b => b.maxScore > 0);
  const sumPercentages = validDomains.reduce((acc, item) => acc + item.percentage, 0);
  const overallScore = validDomains.length > 0 ? Math.round(sumPercentages / validDomains.length) : 0;

  // 4. Key Strength
  const sortedStats = [...breakdown].sort((a, b) => b.percentage - a.percentage);
  const keyStrength = (sortedStats.length > 0 && sortedStats[0].percentage > 0)
    ? sortedStats[0].label
    : 'No Data Yet';

  // 5. Trend Analysis (Group by date)
  // Simple trend: Sort responses by date, average score per response chunk or just last 5 responses
  const trend = [];
  if (totalResponses > 0) {
      // Sort by date if available
      const sortedResponses = [...safeResponses].sort((a, b) => 
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );

      // Create a simplified trend line (e.g. grouped by batch or individual response average)
      // Here we just map the last 5 responses to show "recent performance"
      const recent = sortedResponses.slice(-5);
      
      recent.forEach((res, index) => {
         // Calculate single score for this response
         let currentSum = 0;
         let currentMax = 0;
         PSQ_QUESTIONS.forEach(q => {
            const val = Number(res.answers[q.id]) || 0;
            currentSum += val;
            currentMax += 5;
         });
         const score = currentMax > 0 ? Math.round((currentSum / currentMax) * 100) : 0;
         
         trend.push({
             date: res.created_at ? new Date(res.created_at).toLocaleDateString() : `Response ${index + 1}`,
             score: score
         });
      });
  } else {
    trend.push({ date: 'Start', score: 0 });
  }

  return {
    overallScore,
    keyStrength,
    breakdown,
    trend,
    totalQuestions: PSQ_QUESTIONS.length,
    completedResponses: totalResponses,
    lastUpdated: new Date().toLocaleDateString(),
  };
}