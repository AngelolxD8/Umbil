// src/app/profile/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { getMyProfile, upsertMyProfile, Profile } from "@/lib/profile";
import { useUserEmail } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import ResetPassword from "@/components/ResetPassword"; 
import { useCpdStreaks } from "@/hooks/useCpdStreaks"; // <-- NEW IMPORT

/**
 * Utility function to get a user-friendly error message from an unknown error object.
 * @param e - The error object/value.
 * @returns A string containing the error message.
 */
function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "An unknown error occurred.";
}

// --- NEW COMPONENT: Streak Calendar ---

// Helper to generate the last 365 days of dates
const getLastYearDates = () => {
    const dates: { date: Date; dateStr: string; }[] = [];
    let d = new Date();
    // Adjust to today's start
    d.setHours(0, 0, 0, 0); 
    
    // Start with the Sunday of the current week (day 0)
    const dayOfWeek = d.getDay(); 
    d.setDate(d.getDate() - dayOfWeek);
    
    // Go back ~52 weeks (365 days)
    for (let i = 0; i < 53 * 7; i++) {
        const current = new Date(d);
        const dateStr = current.toISOString().split('T')[0];
        dates.unshift({ date: current, dateStr }); // Add to the front
        d.setDate(d.getDate() - 1);
    }
    
    // Filter to only include the last ~365 days to avoid too many squares
    return dates.filter((_, i) => i < 365); 
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
    
    if (loading) {
        return <p>Loading streak data...</p>;
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

            <div className="calendar-grid">
                {/* Day of the week labels (Mon, Wed, Fri) - simplified view */}
                <div className="day-label" style={{ gridRow: 2 }}>M</div>
                <div className="day-label" style={{ gridRow: 4 }}>W</div>
                <div className="day-label" style={{ gridRow: 6 }}>F</div>
                
                {/* Calendar Squares */}
                {calendarDates.map(({ dateStr }, index) => {
                    const hasCpd = loggedDates.has(dateStr);
                    const isToday = dateStr === todayStr;
                    
                    // Column is the week number (0-52), Row is the day of the week (0-6)
                    // We render backwards (latest day first) but arrange left-to-right.
                    // The CSS handles the layout based on flex/grid.
                    return (
                        <div
                            key={index}
                            className={`calendar-square ${hasCpd ? 'has-cpd' : ''} ${isToday ? 'is-today' : ''}`}
                            data-date={dateStr}
                            title={`${dateStr}: ${hasCpd ? 'Logged' : 'No Log'}`}
                        />
                    );
                })}
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