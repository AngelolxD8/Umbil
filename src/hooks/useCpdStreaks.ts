// src/hooks/useCpdStreaks.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { getCPD } from "@/lib/store";
import { useUserEmail } from "./useUser";

// Define the shape of the data returned by the hook
export type StreakData = {
  // NEW: A map of 'YYYY-MM-DD' to the count of CPD logs (number)
  dates: Map<string, number>; 
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
  hasLoggedToday: boolean;
};

/**
 * Calculates CPD streaks and calendar data for the authenticated user.
 */
export function useCpdStreaks(): StreakData {
  const { email, loading: userLoading } = useUserEmail();
  const [cpdTimestamps, setCpdTimestamps] = useState<string[]>([]); // Store all timestamps
  const [loading, setLoading] = useState(true);

  // 1. Fetch CPD data on load or when user status changes
  useEffect(() => {
    const fetchCpdDates = async () => {
      if (userLoading || !email) {
        setLoading(false);
        setCpdTimestamps([]);
        return;
      }
      
      setLoading(true);
      const entries = await getCPD();
      // Store all raw timestamps for processing
      const timestamps = entries.map(e => e.timestamp);
      
      setCpdTimestamps(timestamps);
      setLoading(false);
    };

    fetchCpdDates();
  }, [email, userLoading]);
  
  // 2. Memoize streak and calendar calculations for performance
  const { dates, currentStreak, longestStreak, hasLoggedToday } = useMemo(() => {
    // --- START: NEW STREAK LOGIC ---

    // Helper to get YYYY-MM-DD string from a Date object
    const toDateString = (date: Date): string => date.toISOString().split('T')[0];

    // 1. Create a Map of date strings to their log counts
    const dateCounts = new Map<string, number>();
    for (const ts of cpdTimestamps) {
        const dateStr = toDateString(new Date(ts));
        dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
    }
    
    // Get a set of unique dates where logging occurred
    const loggedDatesSet = new Set(dateCounts.keys());

    if (loggedDatesSet.size === 0) {
      return { dates: dateCounts, currentStreak: 0, longestStreak: 0, hasLoggedToday: false };
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

    // 4. Iterate backwards from today for 1 year (or more)
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
          // If the gap is today (i=0), the current streak is 0.
          // If the gap is yesterday (i=1), the current streak was `tempStreakCount` (which would be 1 if logged today).
          // This is simpler: if we find a gap, the "current" streak is whatever we counted *before* this gap.
          // But since we start at i=0 (today), if `hasLoggedToday` is false, `tempStreakCount` will be 0, so `currentStreakCount` will be 0.
          if (i === 0 && !hasLoggedToday) {
            currentStreakCount = 0;
          } else {
            // This is the first gap *after* today. The streak we just counted *was* the current streak.
            // We only set this once.
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
    
    // 5. Final check
    // If the streak ran for the entire loop, `isCurrentStreak` will still be true
    if (isCurrentStreak) {
      currentStreakCount = tempStreakCount;
    }
    // Final check for longest streak
    longestStreakCount = Math.max(longestStreakCount, tempStreakCount);

    return { 
      dates: dateCounts, 
      currentStreak: currentStreakCount, 
      longestStreak: longestStreakCount, 
      hasLoggedToday: hasLoggedToday 
    };
    
    // --- END: NEW STREAK LOGIC ---
  }, [cpdTimestamps]);

  // Return the Map object (now correctly typed as Map<string, number>)
  return { dates, currentStreak, longestStreak, loading, hasLoggedToday };
}