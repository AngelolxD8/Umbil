// src/components/MainWrapper.tsx
"use client";

import { useUserEmail } from "@/hooks/useUser";
import HomeContent from "@/components/HomeContent";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainWrapper() {
  const { email, loading } = useUserEmail();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Logic Update: Allow access regardless of auth status to support Guest Mode
      setIsAuthenticated(true);
    }
  }, [loading, email, router]);

  // Show loading spinner while checking auth
  if (loading || !isAuthenticated) {
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

  // Once authenticated (or guest mode allowed), render the App content
  // Note: HomeContent can handle the 'forceStartTour' prop via URL params logic inside it
  return <HomeContent />;
}