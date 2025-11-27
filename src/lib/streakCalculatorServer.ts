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
  const checkDate = new Date(today);

  // determine where to count from
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
      checkDate.setDate(yesterday.getDate() - 1);
    } else {
      currentStreakCount = 0;
    }
  }

  if (currentStreakCount > 0) {
    for (let days = 0; days < 365; days++) {
      const dateStr = toDateString(checkDate);

      if (loggedDatesSet.has(dateStr)) {
        currentStreakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak 'run' calculation 
  let longestStreakCount = 0;
  let tempStreakCount = 0;

  const iterDate = new Date(today);
  for (let days = 0; days < 365; days++) {
    const dateStr = toDateString(iterDate);

    if (loggedDatesSet.has(dateStr)) {
      tempStreakCount++;
      longestStreakCount = Math.max(longestStreakCount, tempStreakCount);
    } else {
      tempStreakCount = 0;
    }
    iterDate.setDate(iterDate.getDate() - 1);
  }

  return { 
    currentStreak: currentStreakCount, 
    longestStreak: longestStreakCount, 
    hasLoggedToday,
  };
}