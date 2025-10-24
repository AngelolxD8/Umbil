// src/components/ResetPassword.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setMsg("⚠️ Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg("⚠️ Passwords do not match.");
      return;
    }

    setLoading(true);
    setMsg(null);

    // Supabase allows you to update the user's password directly if they are currently logged in
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      setMsg(`⚠️ Error: ${error.message}`);
    } else {
      setMsg("✅ Success! Your password has been updated.");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    // REMOVED: The inline style borderLeft: '4px solid var(--umbil-brand-teal)'
    <div className="card" style={{ marginTop: 24 }}> 
      <div className="card__body">
        <h3 style={{ marginBottom: 16 }}>Change Password</h3>
        
        <div className="form-group">
          <label className="form-label">New Password (Min 6 chars)</label>
          <input
            className="form-control"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
          />
        </div>
        
        <button 
          className="btn btn--primary" 
          onClick={handleResetPassword} 
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
        
        {msg && <p style={{ marginTop: 12, color: msg.startsWith('⚠️') ? 'red' : 'var(--umbil-brand-teal)' }}>{msg}</p>}
      </div>
    </div>
  );
}