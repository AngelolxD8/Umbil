// src/app/profile/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { getMyProfile, upsertMyProfile, Profile } from "@/lib/profile";
import { useUserEmail } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import ResetPassword from "@/components/ResetPassword"; 
import { useCpdStreaks } from "@/hooks/useCpdStreaks"; 

/**
 * Utility function to get a user-friendly error message from an unknown error object.
 * @param e - The error object/value.
 * @returns A string containing the error message.
 */
function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unknown error occurred.";
}

// --- NEW COMPONENT: Streak Calendar ---

// Helper to generate the last 364 days of dates + filler days to start on a Sunday (371 total)
const getLastYearDates = () => {
    const dates: { date: Date; dateStr: string; isFiller: boolean }[] = [];
    
    // eslint-disable-next-line prefer-const
    let d = new Date(); 
    d.setHours(0, 0, 0, 0); 
    
    // Determine the day of the week for today (0=Sunday, 6=Saturday)
    // const todayDayOfWeek = d.getDay(); // WARNING FIX: Removed unused variable
    
    // Calculate how many filler days we need at the beginning to ensure the first column is Sunday.
    // const fillerDaysAtStart = 7; // WARNING FIX: Removed unused variable
    
    // Total days needed: 52 weeks * 7 days + 7 filler days for initial alignment
    const TOTAL_DAYS_TO_RENDER = 365 + 7;
    
    // Clone today's date to work backwards
    const cursorDate = new Date(d);
    
    // Generate dates working backwards from today, plus extra days for alignment
    for (let i = 0; i < TOTAL_DAYS_TO_RENDER; i++) {
        const dateStr = cursorDate.toISOString().split('T')[0];
        
        // This is complex, but we need the date array to be in order of rendering: 
        // OLDER (top-left) -> NEWER (bottom-right).
        dates.unshift({ date: new Date(cursorDate), dateStr, isFiller: false });
        cursorDate.setDate(cursorDate.getDate() - 1);
    }
    
    // Now trim the beginning of the list so 'Today' is the very last square in the view.
    // The calendar shows 52 columns of 7 days, so 52 * 7 = 364 days needed.
    const trimAmount = dates.length - 364; // Keep only the last 364
    const trimmedDates = dates.slice(trimAmount);
    
    return trimmedDates;
};

type StreakCalendarProps = {
    loggedDates: Set<string>;
    currentStreak: number;
    longestStreak: number;
    loading: boolean;
}

const StreakCalendar = ({ loggedDates, currentStreak, longestStreak, loading }: StreakCalendarProps) => {
    // Memoize the dates array to prevent recalculation on every render
    const calendarDates = useMemo(getLastYearDates, []);
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Display only 5 labels for better visibility: Sun, Mon, Wed, Fri, Sat
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    if (loading) {
        return <p>Loading CPD learning history...</p>;
    }
    
    return (
        <div className="card" style={{ marginTop: 24, padding: 20 }}>
            <h3 style={{ marginBottom: 16 }}>CPD Learning History</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '1rem' }}>
                <div style={{ fontWeight: 600 }}>
                    Current Streak: <span style={{ color: 'var(--umbil-brand-teal)' }}>{currentStreak} {currentStreak === 1 ? 'day' : 'days'} 🔥</span>
                </div>
                <div style={{ color: 'var(--umbil-muted)' }}>
                    Longest Streak: {longestStreak} days
                </div>
            </div>
            
            <div className="calendar-grid-container">
                {/* Day Labels Column - Positioned absolutely via CSS */}
                <div className="day-labels-column">
                    {dayLabels.map((label, index) => (
                        <div key={index} className="day-label-item">
                            {/* Only display M, W, F for less clutter */}
                            {(label === 'M' || label === 'W' || label === 'F') ? label : ''}
                        </div>
                    ))}
                </div>

                {/* Main Grid - Starts from Oldest (left) to Today (right) */}
                <div className="calendar-grid">
                    {calendarDates.map(({ date: dateObj, dateStr }, index) => {
                        const hasCpd = loggedDates.has(dateStr);
                        const isToday = dateStr === todayStr;
                        const dayOfWeek = dateObj.getDay(); // 0=Sunday, 6=Saturday
                        
                        // The CSS grid is set up to auto-flow, but we use inline styles to force
                        // the correct row based on the day of the week (0-indexed array = day of week)
                        return (
                            <div
                                key={index}
                                className={`calendar-square ${hasCpd ? 'has-cpd' : ''} ${isToday ? 'is-today' : ''}`}
                                // Set grid-row explicitly for perfect alignment
                                style={{ gridRow: dayOfWeek + 1 }} 
                                data-date={dateStr}
                                title={`${dateStr}: ${hasCpd ? 'Logged' : 'No Log'}`}
                            />
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', marginTop: 12 }}>
                <span style={{ color: 'var(--umbil-muted)', marginRight: 4 }}>Less</span>
                <span className="color-legend color-0"></span>
                <span className="color-legend has-cpd"></span>
                <span style={{ color: 'var(--umbil-muted)', marginLeft: 4 }}>More</span>
            </div>
        </div>
    );
}

// --- END NEW COMPONENT: Streak Calendar ---


export default function ProfilePage() {
  const { email, loading: userLoading } = useUserEmail();
  const router = useRouter();

  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Assume a new user if no profile data is loaded initially
  const [isNewUser, setIsNewUser] = useState(true);
  
  // <-- NEW: Fetch streak data
  const { dates: loggedDates, currentStreak, longestStreak, loading: streaksLoading } = useCpdStreaks();

  // Redirect unauthenticated users to the sign-in page
  useEffect(() => {
    if (!userLoading && !email) {
      router.push("/auth");
    }
  }, [userLoading, email, router]);

  // Load the user's existing profile data from the database
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const userProfile = await getMyProfile();
      if (userProfile) {
        setProfile(userProfile);
        setIsNewUser(false); // User exists if a profile was returned
      }
      setLoading(false);
    };
    if (email) loadProfile();
  }, [email]);

  /**
   * Handles saving the updated profile data to the database (upsert operation).
   */
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await upsertMyProfile(profile);
      setLoading(false);
      // Navigate back to the home screen on successful save
      router.push("/");
    } catch (e: unknown) {
      setError(getErrorMessage(e));
      setLoading(false);
    }
  };

  if (userLoading || loading) return <p>Loading...</p>;

  return (
    <section className="main-content">
      <div className="container">
        <h2>{isNewUser ? "Complete Your Profile" : "Edit Profile"}</h2>
        
        {/* NEW: Streak Calendar Display */}
        <StreakCalendar 
            loggedDates={loggedDates} 
            currentStreak={currentStreak} 
            longestStreak={longestStreak} 
            loading={streaksLoading}
        />
        
        <div className="card" style={{ marginTop: 24 }}> {/* Adjusted margin-top */}
          <div className="card__body">
            <h3>Contact and Clinical Details</h3> {/* Added sub-heading for clarity */}
            <div className="form-group" style={{marginTop: 16}}>
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                type="text"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Dr. Mickey Mouse" // The updated placeholder text
              />
            </div>
            <div className="form-group">
              <label className="form-label">Position / Grade</label>
              <input
                className="form-control"
                type="text"
                value={profile.grade || ""}
                onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                placeholder="e.g., FY1 Doctor, GP Trainee"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Professional Body Number</label>
              <input
                className="form-control"
                type="text"
                value={profile.title || ""}
                // Note: The 'title' field is repurposed to store the Professional Body Number
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="e.g., GMC number"
              />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button className="btn btn--primary" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
        
        {/* Added the new password reset component */}
        <ResetPassword /> 

      </div>
    </section>
  );
}