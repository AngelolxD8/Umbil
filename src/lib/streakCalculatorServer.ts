// src/lib/streakCalculator.ts
/**
 * Server-side streak calculation utility
 * Replicates the client-side logic from useCpdStreak.ts
 */

export type UserStreakData = {
  currentStreak: number;
  longestStreak: number;
  hasLoggedToday: boolean;
  lastLogDate: string | null;
}

/**
 * Calculate streak data from an array of timestamps
 */
export function calculateStreaks(timestamps: string[]): UserStreakData {
  // Helper to get YYYY-MM-DD string from a Date object
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
      lastLogDate: null
    };
  }

  // 2. Initialize counters
  let currentStreakCount = 0;
  let longestStreakCount = 0;
  let tempStreakCount = 0;

  // 3. Get today's date string
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);
  const hasLoggedToday = loggedDatesSet.has(todayStr);

  // 4. Get the most recent log date
  const sortedDates = Array.from(loggedDatesSet).sort().reverse();
  const lastLogDate = sortedDates[0] || null;

  // 5. Iterate backwards from today for 1 year
  const checkDate = new Date(today);
  let isCurrentStreak = true; // Flag to track if we are still in the "current" streak

  for (let i = 0; i < 365; i++) {
    const dateStr = toDateString(checkDate);

    if (loggedDatesSet.has(dateStr)) {
      // Log found, increment temp streak
      tempStreakCount++;
    } else {
      // No log found, streak is broken
      
      // Check if this was the "current" streak
      if (isCurrentStreak) {
        if (i === 0 && !hasLoggedToday) {
          currentStreakCount = 0;
        } else {
          if (isCurrentStreak) {
            currentStreakCount = tempStreakCount;
          }
        }
        isCurrentStreak = false; // We've found the end of the current streak
      }

      // Update longest streak
      longestStreakCount = Math.max(longestStreakCount, tempStreakCount);
      // Reset temp counter
      tempStreakCount = 0;
    }
    
    // Move to the previous day
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  // 6. Final check
  if (isCurrentStreak) {
    currentStreakCount = tempStreakCount;
  }
  longestStreakCount = Math.max(longestStreakCount, tempStreakCount);

  return { 
    currentStreak: currentStreakCount, 
    longestStreak: longestStreakCount, 
    hasLoggedToday,
    lastLogDate
  };
}