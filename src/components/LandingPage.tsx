// src/components/LandingPage.tsx
"use client";

import Link from "next/link";
import { useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useUserEmail } from "@/hooks/useUser";

export default function LandingPage() {
  const { email, loading } = useUserEmail();
  const router = useRouter();

  // Redirect logged-in users to the Dashboard automatically
  useEffect(() => {
    if (!loading && email) {
      router.replace("/dashboard");
    }
  }, [loading, email, router]);

  // FIX: Explicitly type the styles object for TypeScript
  const styles: { [key: string]: CSSProperties } = {
    page: { backgroundColor: "#ffffff", color: "#1e293b", minHeight: "100vh", overflowY: "auto" },
    hero: { background: "linear-gradient(135deg, #1fb8cd 0%, #115e6e 100%)", color: "#ffffff" },
    card: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#334155" },
    sectionTitle: { color: "#0f172a" },
    textMuted: { color: "#475569" },
  };

  const featureIconBg = {
    blue: "#ecfeff",
    red: "#fff1f2", 
    green: "#f0fdf4",
    orange: "#fff7ed",
    purple: "#f5f3ff" // Added for the new tool
  };

  return (
    <div style={styles.page}>
      
      {/* --- HERO SECTION --- */}
      <section style={{
        ...styles.hero,
        padding: '100px 20px 120px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '650px'
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          <div style={{ 
            display: 'inline-block', 
            background: 'rgba(255,255,255,0.15)', 
            backdropFilter: 'blur(10px)', 
            padding: '8px 20px', 
            borderRadius: '30px', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            marginBottom: '32px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            ✨ The Intelligent Learning Platform for Modern Medicine
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
            fontWeight: 800, 
            marginBottom: '24px', 
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            Your AI Clinical Co-Pilot & <br/>
            <span style={{ color: '#bafff9' }}>CPD Automation Tool</span>
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            opacity: 0.9, 
            maxWidth: '640px', 
            margin: '0 auto 48px', 
            lineHeight: 1.6 
          }}>
            Umbil turns your daily clinical curiosity into verified CPD. Get instant 
            <strong> NICE/SIGN summaries</strong>, generate 
            <strong> GMC reflective entries</strong>, and draft referrals in seconds.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth" style={{ 
              backgroundColor: 'white', 
              color: '#0e7490', 
              padding: '16px 36px', 
              fontSize: '1.1rem', 
              fontWeight: 700,
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Start Free Now
            </Link>
            
            <Link href="/dashboard?tour=true&forceTour=true" style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.4)', 
              color: 'white',
              padding: '16px 36px',
              fontSize: '1.1rem', 
              fontWeight: 600,
              borderRadius: '12px',
              backdropFilter: 'blur(4px)',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              See How It Works
            </Link>
          </div>
          
          <p style={{ marginTop: '32px', fontSize: '0.9rem', opacity: 0.7, fontWeight: 500 }}>
            Trusted by UK Clinicians
          </p>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section style={{ padding: '100px 20px', background: '#f8fafc' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '1000px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '16px', color: styles.sectionTitle.color }}>
            Reduce Workload & Streamline Admin
          </h2>
          <p style={{ fontSize: '1.1rem', color: styles.textMuted.color, marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px' }}>
            Stop trawling through guidelines and writing reflections at midnight. Let Umbil handle the busywork.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', textAlign: 'left' }}>
            
            <div style={{ ...styles.card, padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: featureIconBg.blue, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '24px' }}>🧠</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Clinical Search Engine</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6 }}>
                Ask questions like <em>"UTI management NICE"</em> or <em>"Red flags for vertigo"</em>. Umbil scans trusted UK sources (CKS, BNF, SIGN) to give you instant, cited answers in Clinic, Standard, or Deep Dive modes.
              </p>
            </div>

            <div style={{ ...styles.card, padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: featureIconBg.red, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '24px' }}>✨</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Referral & SBAR Writer</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6 }}>
                Turn rough shorthand notes into professional <strong>referral letters</strong> or structured <strong>SBAR handovers</strong> instantly. Includes safety netting generation for medico-legal protection.
              </p>
            </div>

            <div style={{ ...styles.card, padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: featureIconBg.purple, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '24px' }}>❤️</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Patient Translator</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6 }}>
                 Bridge the communication gap. Paste complex discharge notes or terms, and Umbil rewrites them into <strong>clear, 5th-grade level English</strong> for your patients.
              </p>
            </div>

            <div style={{ ...styles.card, padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: featureIconBg.green, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '24px' }}>✍️</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Automated Reflection</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6 }}>
                Umbil automatically converts your clinical queries into <strong>GMC-compliant reflective entries</strong>. It tags them with domains (e.g., "Safety & Quality") and saves them to your timeline.
              </p>
            </div>

            <div style={{ ...styles.card, padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ width: '48px', height: '48px', background: featureIconBg.orange, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '24px' }}>📈</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>PDP & Analytics</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6 }}>
                Track your learning streaks and visualize your topic coverage. Umbil even <strong>suggests PDP goals</strong> automatically based on the topics you search for most often.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- USE CASES --- */}
      <section style={{ padding: '80px 20px', background: 'white' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '24px', color: styles.sectionTitle.color }}>Built for Every Clinician</h2>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#1fb8cd' }}>For Trainees & FY2s</h3>
                <p style={{ color: styles.textMuted.color }}>The ultimate <strong>portfolio companion</strong>. Prepare for ARCP, generate case-based discussions, and ensure you never miss a learning opportunity on the wards.</p>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#1fb8cd' }}>For Primary Care & GPs</h3>
                <p style={{ color: styles.textMuted.color }}>Streamline admin and stay up to date with changing guidelines. Use the <strong>Discharge Condenser</strong> to process clinic letters faster and log CPD effortlessly.</p>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#1fb8cd' }}>For Hospital Doctors</h3>
                <p style={{ color: styles.textMuted.color }}>Support your decision making with "Deep Dive" mode for complex cases and keep a permanent record of your CPD for appraisal.</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '20px', fontWeight: 600, color: styles.sectionTitle.color }}>Popular Clinical Searches:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {["Chest pain red flags", "Vertigo vs Dizziness", "NICE asthma summary", "GORD management", "Fever in child <5", "Hypertension guidelines", "Diabetes meds review", "Sepsis screen criteria", "Headache red flags"].map(tag => (
                  <span key={tag} style={{ fontSize: '0.85rem', background: 'white', padding: '8px 16px', borderRadius: '20px', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 500, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>🔍 {tag}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section style={{ padding: '100px 20px', textAlign: 'center', background: '#f0f9ff' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 800, color: styles.sectionTitle.color }}>Start learning smarter.</h2>
        <p style={{ fontSize: '1.2rem', color: styles.textMuted.color, marginBottom: '40px' }}>Join the community of clinicians using Umbil today.</p>
        <Link href="/auth" style={{ padding: '16px 48px', fontSize: '1.2rem', backgroundColor: '#1fb8cd', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 14px rgba(31, 184, 205, 0.4)', textDecoration: 'none', display: 'inline-block' }}>Get Started for Free</Link>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{ background: '#0f172a', color: 'white', padding: '60px 20px', fontSize: '0.9rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1fb8cd', marginBottom: '8px' }}>Umbil</div>
            <div style={{ opacity: 0.6 }}>Your Medical Education Lifeline.</div>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <Link href="/auth" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontWeight: 500 }}>Login</Link>
            <Link href="/about" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontWeight: 500 }}>About</Link>
            <Link href="/privacy" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
          </div>
        </div>
        <div className="container" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', opacity: 0.4, fontSize: '0.8rem' }}>© {new Date().getFullYear()} Umbil. All rights reserved.</div>
      </footer>
    </div>
  );
}