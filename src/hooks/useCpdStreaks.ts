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
    // Determine today's date string once
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ensure consistency
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate date counts (Map<string, number>)
    const dateCounts = new Map<string, number>();
    for (const ts of cpdTimestamps) {
        const dateStr = new Date(ts).toISOString().split('T')[0];
        dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
    }

    if (cpdTimestamps.length === 0) {
      return { dates: dateCounts, currentStreak: 0, longestStreak: 0, hasLoggedToday: false };
    }
    
    let current = 0;
    let longest = 0;
    let maxSoFar = 0;
    
    // Check if user has logged today
    const hasEntryToday = dateCounts.has(todayStr);
    
    // The starting day for our current streak check is TODAY
    const checkDate = new Date(today); 
    
    // Set initial current streak count
    if (hasEntryToday) {
        current = 1;
    } 
    
    // Start iterating from YESTERDAY backwards
    checkDate.setDate(checkDate.getDate() - 1);
    
    // Iterative logic to find both current and longest streaks
    // We use a new mutable variable for date checking to avoid ESLint errors.
    // eslint-disable-next-line prefer-const
    let cursorDate = checkDate;

    for (let i = 0; i < 365; i++) { 
      const dateStr = cursorDate.toISOString().split('T')[0];
      const hadCpd = dateCounts.has(dateStr);
      
      if (hadCpd) {
        maxSoFar++;
        // If we are currently counting the streak *before* today, keep counting it.
        if (hasEntryToday || maxSoFar === 1) { 
             current = (hasEntryToday ? 1 : 0) + maxSoFar; 
        }
      } else {
        // Gap found.
        longest = Math.max(longest, maxSoFar);
        maxSoFar = 0; 
      }
      
      // Move to the previous day
      cursorDate.setDate(cursorDate.getDate() - 1);
    }
    
    // Final check to capture the longest streak that might run up to the loop end
    longest = Math.max(longest, current, maxSoFar); 

    return { dates: dateCounts, currentStreak: current, longestStreak: longest, hasLoggedToday: hasEntryToday };
  }, [cpdTimestamps]);

  // Return the Map object (now correctly typed as Map<string, number>)
  return { dates, currentStreak, longestStreak, loading, hasLoggedToday };
}