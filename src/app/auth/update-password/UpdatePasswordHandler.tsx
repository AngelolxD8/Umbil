// src/app/auth/update-password/UpdatePasswordHandler.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

// This is the actual client component logic
export default function UpdatePasswordHandler() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); 
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const failureTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

  useEffect(() => {
    let isMounted = true;
    
    // Check if the URL contains the access token, indicating a recovery session attempt
    const accessToken = searchParams.get('access_token');
    
    if (accessToken) {
        // We have a token in the URL, indicating Supabase is trying to authenticate.
        setIsReady(true);
        setMsg("Enter your new password below.");
        setLoading(false);
    } else {
        // If no access_token is present, this page was loaded incorrectly.
        setMsg("Checking link validity...");
        
        // Start a long timeout to assume the link is invalid if no auth event fires.
        failureTimeoutRef.current = setTimeout(() => {
            if (isMounted && !isReady) { 
                setMsg("⚠️ This reset link is expired or invalid. Redirecting to sign-in...");
                setTimeout(() => router.replace("/auth"), 2000); 
            }
        }, 7000); // Wait 7 seconds before confirming failure
        
        setLoading(false);
    }
    
    // 2. Listen for auth changes, which fires when the recovery token successfully authenticates
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (isMounted && session && event === 'SIGNED_IN') {
             // Success: Clear any pending failure timeout
             if (failureTimeoutRef.current) clearTimeout(failureTimeoutRef.current);
             
             // The session is confirmed via the URL/event, show the form
             setIsReady(true);
             setLoading(false);
             setMsg("Enter your new password below.");
        }
    });

    // Cleanup: Clear timeout and unsubscribe
    return () => {
        isMounted = false;
        if (failureTimeoutRef.current) clearTimeout(failureTimeoutRef.current);
        sub?.subscription.unsubscribe();
    };
  }, [searchParams, router, isReady]);

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setMsg("Please enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setMsg("⚠️ Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMsg("⚠️ Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setMsg(`⚠️ Error updating password: ${error.message}`);
      await supabase.auth.signOut();
    } else {
      setMsg("✅ Success! Your password has been updated. Redirecting to home...");
      setTimeout(() => router.replace("/"), 2000); // Use replace for final redirect
    }
  };

  return (
    <section className="main-content">
      <div className="container">
        <h2>Set New Password</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__body">
            
            {loading && <p>{msg || "Loading..."}</p>}
            
            {/* Show form only if we are ready (have the token) */}
            {!loading && isReady && (
                <>
                    <p style={{marginBottom: 16, color: 'var(--umbil-text)'}}>{msg}</p>
                    <div className="form-group">
                        <label className="form-label">New Password (Min 6 chars)</label>
                        <input
                            className="form-control"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            className="form-control"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                        />
                    </div>
                    <button 
                        className="btn btn--primary" 
                        onClick={handleUpdatePassword} 
                        disabled={loading || !password || !confirmPassword}
                    >
                        Update Password
                    </button>
                </>
            )}

            {/* Show error message if not ready and not loading (invalid link) */}
            {!loading && !isReady && <p style={{ color: msg?.startsWith('⚠️') ? 'red' : 'var(--umbil-brand-teal)' }}>{msg}</p>}

          </div>
        </div>
      </div>
    </section>
  );
}