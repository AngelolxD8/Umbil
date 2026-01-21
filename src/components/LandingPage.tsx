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
    hero: { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff" },
    card: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#334155" },
    sectionTitle: { color: "#0f172a" },
    textMuted: { color: "#475569" },
  };

  const featureIconBg = {
    blue: "#ecfeff",
    red: "#fff1f2", 
    green: "#f0fdf4",
    orange: "#fff7ed",
    purple: "#f5f3ff"
  };

  return (
    <div style={styles.page}>
      
      {/* --- HERO SECTION: WORKFLOW RELIEF --- */}
      <section style={{
        ...styles.hero,
        padding: '120px 20px 140px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '700px'
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          <div style={{ 
            display: 'inline-block', 
            background: 'rgba(255,255,255,0.1)', 
            backdropFilter: 'blur(10px)', 
            padding: '8px 24px', 
            borderRadius: '30px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            marginBottom: '32px',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#cbd5e1'
          }}>
            ⚡️ The Clinical Assistant for High-Pressure Shifts
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', 
            fontWeight: 800, 
            marginBottom: '28px', 
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            Write Referrals, Safety-Nets & <br/>
            <span style={{ color: '#38bdf8' }}>SBAR Handovers in Seconds</span>
          </h1>
          
          <p style={{ 
            fontSize: '1.35rem', 
            opacity: 0.9, 
            maxWidth: '680px', 
            margin: '0 auto 56px', 
            lineHeight: 1.6,
            color: '#e2e8f0'
          }}>
            Umbil clears your admin list. Turn rough shorthand notes into structured <strong>referral letters</strong>, medico-legal <strong>safety netting</strong>, and safe <strong>handovers</strong> instantly.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ 
              backgroundColor: '#38bdf8', 
              color: '#0f172a', 
              padding: '18px 40px', 
              fontSize: '1.15rem', 
              fontWeight: 700,
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              transition: 'all 0.2s',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              Try in Clinic Now
            </Link>
            
            <Link href="/dashboard?tour=true&forceTour=true" style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)', 
              color: 'white',
              padding: '18px 40px',
              fontSize: '1.15rem', 
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
          
          <p style={{ marginTop: '32px', fontSize: '0.9rem', opacity: 0.5, fontWeight: 500 }}>
            No installation • No credit card • Works on NHS computers
          </p>
        </div>
      </section>

      {/* --- THE WEDGE: FEATURES GRID --- */}
      <section style={{ padding: '100px 20px', background: '#f8fafc' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '1000px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '16px', color: styles.sectionTitle.color }}>
            Tools that clear the backlog
          </h2>
          <p style={{ fontSize: '1.1rem', color: styles.textMuted.color, marginBottom: '70px', maxWidth: '600px', margin: '0 auto 70px' }}>
            Reduce cognitive load. Focus on the patient, not the paperwork.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', textAlign: 'left' }}>
            
            {/* FEATURE 1: REFERRALS (The Hook) */}
            <div style={{ ...styles.card, padding: '36px', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1' }}>
              <div style={{ width: '56px', height: '56px', background: featureIconBg.blue, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '28px' }}>✉️</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Referral Letter Writer</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6, fontSize: '1.05rem' }}>
                <strong>The Primary Entry Point.</strong> Paste your rough history and examination notes. Umbil instantly drafts a structured, polite, and professional referral letter to the specialist.
              </p>
            </div>

            {/* FEATURE 2: SAFETY NETTING */}
            <div style={{ ...styles.card, padding: '36px', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1' }}>
              <div style={{ width: '56px', height: '56px', background: featureIconBg.red, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '28px' }}>🛡️</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Safety-Net Generator</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6, fontSize: '1.05rem' }}>
                <strong>Reduce Medico-Legal Anxiety.</strong> Generate clear, patient-friendly safety-netting instructions for chest pain, fever, or head injury. Copy, paste, and document that you did it.
              </p>
            </div>

            {/* FEATURE 3: SBAR / HANDOVERS */}
            <div style={{ ...styles.card, padding: '36px', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1' }}>
              <div style={{ width: '56px', height: '56px', background: featureIconBg.green, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '28px' }}>🤝</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>SBAR Handover Tool</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6, fontSize: '1.05rem' }}>
                <strong>Standardize Your Handovers.</strong> Don't rely on memory at 8pm. Turn a complex case into a concise SBAR summary for the night team or registrars.
              </p>
            </div>

            {/* FEATURE 4: PATIENT TRANSLATOR */}
            <div style={{ ...styles.card, padding: '36px', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1' }}>
              <div style={{ width: '56px', height: '56px', background: featureIconBg.purple, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '28px' }}>🗣️</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Patient Translator</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6, fontSize: '1.05rem' }}>
                 Bridge the gap. Paste complex discharge notes or terms, and rewrite them into <strong>clear, 5th-grade English</strong> for your patients to take home.
              </p>
            </div>
            
             {/* FEATURE 5: CLINICAL SEARCH (Demoted but present) */}
             <div style={{ ...styles.card, padding: '36px', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1' }}>
              <div style={{ width: '56px', height: '56px', background: featureIconBg.orange, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '28px' }}>🧠</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: 700, color: styles.sectionTitle.color }}>Clinical Search</h3>
              <p style={{ color: styles.textMuted.color, lineHeight: 1.6, fontSize: '1.05rem' }}>
                Ask <em>"UTI guidelines NICE"</em>. Get instant, cited answers from CKS & BNF. No more trawling through PDFs while the patient waits.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- THE MAGICAL BYPRODUCT (CPD) --- */}
      <section style={{ padding: '100px 20px', background: '#0f172a', color: 'white' }}>
        <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px', color: '#38bdf8' }}>
                You do the work. We catch the credit.
            </h2>
            <p style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '60px', maxWidth: '700px', margin: '0 auto 60px', lineHeight: 1.7 }}>
                You are already learning every day. You just aren't logging it.
                <br/>
                Umbil turns your referrals, searches, and safety-netting into <strong>verified CPD entries</strong> automatically.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', textAlign: 'left' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>⚡️ Zero-Click Logging</h3>
                    <p style={{ opacity: 0.7, lineHeight: 1.6 }}>We detect when you've done clinical work and log the time automatically. No "adding reflections" at midnight.</p>
                </div>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>📂 GMC Domain Mapping</h3>
                    <p style={{ opacity: 0.7, lineHeight: 1.6 }}>Every action is automatically tagged with GMC domains (e.g., Safety & Quality, Communication) ready for appraisal.</p>
                </div>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>📝 Instant Reflections</h3>
                    <p style={{ opacity: 0.7, lineHeight: 1.6 }}>Need a formal reflection? Click one button, and Umbil drafts a "What, So What, Now What" entry based on the work you just did.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- USE CASES / SOCIAL PROOF --- */}
      <section style={{ padding: '100px 20px', background: 'white' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '24px', color: styles.sectionTitle.color, fontWeight: 800 }}>Used by clinicians to survive the shift.</h2>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0284c7' }}>GP Partners & Locums</h3>
                <p style={{ color: styles.textMuted.color }}>"I cleared a 2-hour admin block in 20 minutes using the referral writer. It pays for itself in one clinic."</p>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0284c7' }}>Hospital Trainees (SHO/Reg)</h3>
                <p style={{ color: styles.textMuted.color }}>"The SBAR tool saved me during a chaotic night shift. My registrar actually complimented the handover."</p>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#0284c7' }}>ARCP Prep</h3>
                <p style={{ color: styles.textMuted.color }}>"I didn't realize I had 40 hours of CPD logged just by doing my job until I checked Umbil before my appraisal."</p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '20px', fontWeight: 600, color: styles.sectionTitle.color }}>Common Workflow Actions:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {["Referral: Orthopaedics Knee", "Safety Net: Head Injury Child", "SBAR: Sepsis Deterioration", "Explain: Atrial Fibrillation", "Referral: 2WW Breast", "Email: Patient Advice", "Summary: Complex Geriatrics"].map(tag => (
                  <span key={tag} style={{ fontSize: '0.85rem', background: 'white', padding: '8px 16px', borderRadius: '20px', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 500, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>⚡️ {tag}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section style={{ padding: '100px 20px', textAlign: 'center', background: '#f0f9ff' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 800, color: styles.sectionTitle.color }}>Think less. Do more.</h2>
        <p style={{ fontSize: '1.2rem', color: styles.textMuted.color, marginBottom: '40px' }}>Zero permission required. Open it in a browser tab and start working.</p>
        <Link href="/auth" style={{ padding: '18px 48px', fontSize: '1.2rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)', textDecoration: 'none', display: 'inline-block' }}>Get Started Free</Link>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{ background: '#0f172a', color: 'white', padding: '60px 20px', fontSize: '0.9rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#38bdf8', marginBottom: '8px' }}>Umbil</div>
            <div style={{ opacity: 0.6 }}>The Clinical Workflow OS.</div>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <Link href="/auth" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontWeight: 500 }}>Login</Link>
            <Link href="/about" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontWeight: 500 }}>About</Link>
            <Link href="/privacy" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontWeight: 500 }}>Privacy</Link>
          </div>
        </div>
        <div className="container" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', opacity: 0.4, fontSize: '0.8rem' }}>© {new Date().getFullYear()} Umbil. All rights reserved.</div>
      </footer>
    </div>
  );
}