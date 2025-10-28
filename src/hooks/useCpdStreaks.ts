// src/hooks/useCpdStreaks.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { getCPD } from "@/lib/store";
import { useUserEmail } from "./useUser";

// Define the shape of the data returned by the hook
export type StreakData = {
  dates: Set<string>;
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
  hasLoggedToday: boolean; // <-- NEW: Flag for today's status
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
  const { dates, currentStreak, longestStreak, hasLoggedToday } = useMemo(() => {
    // Determine today's date string once
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ensure consistency
    const todayStr = today.toISOString().split('T')[0];
    
    if (cpdDates.length === 0) {
      return { dates: new Set<string>(), currentStreak: 0, longestStreak: 0, hasLoggedToday: false };
    }

    const dateSet = new Set<string>(cpdDates);
    
    let current = 0;
    let longest = 0;
    let maxSoFar = 0;
    
    // Check if user has logged today
    const hasEntryToday = dateSet.has(todayStr);
    
    // The starting day for our current streak check is TODAY
    // eslint-disable-next-line prefer-const
    let checkDate = new Date(today); // ERROR FIX: Suppress prefer-const for this line
    
    // Set initial current streak count
    if (hasEntryToday) {
        current = 1;
    } 
    
    // Start iterating from YESTERDAY backwards
    checkDate.setDate(checkDate.getDate() - 1);
    
    // Iterative logic to find both current and longest streaks
    // We only iterate backwards, so 'current' is calculated first, then 'longest' is found by iterating all days.
    for (let i = 0; i < 365; i++) { 
      const dateStr = checkDate.toISOString().split('T')[0];
      const hadCpd = dateSet.has(dateStr);
      
      if (hadCpd) {
        maxSoFar++;
        // If we are currently counting the streak *before* today, keep counting it.
        // The effective current streak is (current + days logged before today).
        if (hasEntryToday || maxSoFar === 1) { // Only count towards current streak if today has a log OR this is the start of a streak
             current = (hasEntryToday ? 1 : 0) + maxSoFar; // Recalculate current streak length
        }
      } else {
        // Gap found.
        longest = Math.max(longest, maxSoFar);
        
        // If a gap is found, reset maxSoFar for finding the next potential longest streak
        maxSoFar = 0; 
      }
      
      // Move to the previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Final check to capture the longest streak that might run up to the loop end
    longest = Math.max(longest, current, maxSoFar); 

    return { dates: dateSet, currentStreak: current, longestStreak: longest, hasLoggedToday: hasEntryToday };
  }, [cpdDates]);

  return { dates, currentStreak, longestStreak, loading, hasLoggedToday };
}