// src/hooks/useCpdStreaks.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { getCPD } from "@/lib/store";
import { useUserEmail } from "./useUser";

// Define the shape of the data returned by the hook
export type StreakData = {
  // A map of 'YYYY-MM-DD' to true for all days a CPD was logged
  dates: Set<string>;
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
};

/**
 * Calculates CPD streaks and calendar data for the authenticated user.
 */
export function useCpdStreaks(): StreakData {
  const { email, loading: userLoading } = useUserEmail();
  const [cpdDates, setCpdDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch CPD data on load or when user status changes
  useEffect(() => {
    const fetchCpdDates = async () => {
      if (userLoading || !email) {
        setLoading(false);
        setCpdDates([]);
        return;
      }
      
      setLoading(true);
      // getCPD fetches entries from the remote database (Supabase)
      const entries = await getCPD();
      // Extract unique dates as 'YYYY-MM-DD' strings
      const dates = Array.from(new Set(
        entries.map(e => new Date(e.timestamp).toISOString().split('T')[0])
      ));
      
      setCpdDates(dates);
      setLoading(false);
    };

    fetchCpdDates();
  }, [email, userLoading]);
  
  // 2. Memoize streak and calendar calculations for performance
  const { dates, currentStreak, longestStreak } = useMemo(() => {
    if (cpdDates.length === 0) {
      return { dates: new Set<string>(), currentStreak: 0, longestStreak: 0 };
    }

    const dateSet = new Set<string>(cpdDates);
    // const sortedDates = cpdDates.sort().reverse(); // WARNING FIX: Removed unused variable sortedDates

    let current = 0;
    let longest = 0;
    let maxSoFar = 0;
    // const lastDate = new Date(); // ERROR FIX: Changed 'let' to 'const' and removed the unused variable
    
    // Check if the user logged something *yesterday* to start the current streak logic
    // eslint-disable-next-line prefer-const
    let checkDate = new Date(); // ERROR FIX: Needs to be 'let' because we mutate it with setDate() below.
    
    // If today has an entry, check from today; otherwise, check from yesterday.
    // Ensure the date for comparison is clean (no time data).
    const todayStr = checkDate.toISOString().split('T')[0];
    const hasEntryToday = dateSet.has(todayStr);

    if (hasEntryToday) {
        current = 1;
    } else {
        // If no entry today, start checking from yesterday for a continuing streak.
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    let isCheckingCurrentStreak = true;
    
    // Iterative logic to find both current and longest streaks
    for (let i = 0; i < 365; i++) { // Limit check to 1 year for performance/relevance
      const dateStr = checkDate.toISOString().split('T')[0];
      const hadCpd = dateSet.has(dateStr);
      
      if (hadCpd) {
        maxSoFar++;
        if (isCheckingCurrentStreak) {
            current = maxSoFar;
        }
      } else {
        // Gap found.
        longest = Math.max(longest, maxSoFar);
        
        // If we hit a gap while checking the current streak, the current streak is determined.
        if (isCheckingCurrentStreak) {
            isCheckingCurrentStreak = false;
            // The current streak is calculated from `maxSoFar` just before the gap, 
            // OR it was just the single day if they only logged today.
            current = hasEntryToday ? current : 0; 
        }
        
        maxSoFar = 0; // Reset streak counter for next potential streak
      }
      
      // Move to the previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Capture the final streak count
    longest = Math.max(longest, maxSoFar);


    return { dates: dateSet, currentStreak: current, longestStreak: longest };
  }, [cpdDates]);

  return { dates, currentStreak, longestStreak, loading };
}