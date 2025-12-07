// src/components/MainWrapper.tsx
"use client";

import { useUserEmail } from "@/hooks/useUser";
import HomeContent from "@/components/HomeContent";
import LandingPage from "@/components/LandingPage";
import { useEffect, useState } from "react";

type ViewState = 'loading' | 'landing' | 'app';

export default function MainWrapper() {
  const { email, loading } = useUserEmail();
  const [view, setView] = useState<ViewState>('loading');
  const [startDemoTour, setStartDemoTour] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (email) {
        setView('app');
      } else {
        // If we are already in demo mode (user clicked the button), don't revert to landing
        if (!startDemoTour) {
          setView('landing');
        }
      }
    }
  }, [loading, email, startDemoTour]);

  const handleStartDemo = () => {
    setStartDemoTour(true);
    setView('app');
  };

  if (view === 'loading') {
    // A clean, minimal loading state that matches the brand
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100dvh',
        background: 'var(--umbil-bg)',
        color: 'var(--umbil-brand-teal)',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
           <div className="loading-pulse">Umbil</div>
        </div>
        <style jsx>{`
          @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
          .loading-pulse { animation: pulse 1.5s infinite; font-size: 1.5rem; letter-spacing: -0.02em; }
        `}</style>
      </div>
    );
  }

  if (view === 'landing') {
    return <LandingPage onStartDemo={handleStartDemo} />;
  }

  // Pass the forceTour prop if we are in demo mode
  return <HomeContent forceStartTour={startDemoTour} />;
}