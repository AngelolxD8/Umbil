// src/lib/streakCalculator.ts
/**
 * Server-side streak calculation utility
 * Replicates the client-side logic from useCpdStreak.ts
 */

export type UserStreakData = {
  currentStreak: number;
  longestStreak: number;
  hasLoggedToday: boolean;
}

/**
 * Calculate streak data from an array of timestamps
 */
export function calculateStreaks(timestamps: string[]): UserStreakData {

  const toDateString = (date: Date): string => date.toISOString().split('T')[0];

  // 1. Create a Set of unique dates where logging occurred
  const loggedDatesSet = new Set<string>();
  for (const ts of timestamps) {
    const dateStr = toDateString(new Date(ts));
    loggedDatesSet.add(dateStr);
  }

  if (loggedDatesSet.size === 0) {
    return { 
      currentStreak: 0, 
      longestStreak: 0, 
      hasLoggedToday: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);
  const hasLoggedToday = loggedDatesSet.has(todayStr);


  let currentStreakCount = 0;
  let longestStreakCount = 0;
  let tempStreakCount = 0;

  const checkDate = new Date(today);
  let isCurrentStreak = true; // Flag to track if we are still in the "current" streak

  for (let i = 0; i < 365; i++) {
    const dateStr = toDateString(checkDate);

    if (loggedDatesSet.has(dateStr)) {
      tempStreakCount++;
    } else {
      if (isCurrentStreak) {
        if (hasLoggedToday) {
          currentStreakCount = 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = toDateString(yesterday);

          if (loggedDatesSet.has(yesterdayStr)) {
            currentStreakCount = 1;
            checkDate.setTime(yesterday.getTime());
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            currentStreakCount = 0;
          }
        }

        isCurrentStreak = false;
      }

      longestStreakCount = Math.max(longestStreakCount, tempStreakCount);

      tempStreakCount = 0;
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  if (isCurrentStreak) {
    currentStreakCount = tempStreakCount;
  }
  longestStreakCount = Math.max(longestStreakCount, tempStreakCount);

  return { 
    currentStreak: currentStreakCount, 
    longestStreak: longestStreakCount, 
    hasLoggedToday,
  };
}