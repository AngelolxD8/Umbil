"use client";

import { useUserEmail } from "@/hooks/useUser";
import HomeContent from "@/components/HomeContent";
import LandingPage from "@/components/LandingPage";
import { useEffect, useState } from "react";

export default function MainWrapper() {
  const { email, loading } = useUserEmail();
  const [showLanding, setShowLanding] = useState(true);

  // Sync state with auth loading
  useEffect(() => {
    if (!loading) {
      if (email) {
        setShowLanding(false);
      } else {
        setShowLanding(true);
      }
    }
  }, [loading, email]);

  if (loading) {
    // A nice loading state while checking session
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100dvh',
        background: 'var(--umbil-bg)'
      }}>
        <div className="loading-indicator" style={{ fontSize: '1.2rem' }}>
          Umbil<span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage />;
  }

  return <HomeContent />;
}