"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="landing-page" style={{ overflowY: 'auto', height: '100%', background: 'var(--umbil-surface)' }}>
      {/* --- HERO SECTION --- */}
      <section className="hero-section" style={{
        background: 'linear-gradient(135deg, #1fb8cd 0%, #158a9a 100%)',
        color: 'white',
        padding: '80px 20px 100px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px'
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ 
            display: 'inline-block', 
            background: 'rgba(255,255,255,0.2)', 
            backdropFilter: 'blur(10px)', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            marginBottom: '24px' 
          }}>
            🚀 The #1 AI Medical Education Platform
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: 800, 
            marginBottom: '24px', 
            lineHeight: 1.1,
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            Your AI Clinical Co-Pilot & <br/>
            <span style={{ color: '#bafff9' }}>CPD Automation Tool</span>
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            opacity: 0.9, 
            maxWidth: '600px', 
            margin: '0 auto 40px', 
            lineHeight: 1.6 
          }}>
            Umbil turns your clinical curiosity into verified CPD. Get instant 
            <strong> NICE/SIGN clinical summaries</strong>, generate 
            <strong> GMC reflective entries</strong>, and automate your portfolio.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth" className="btn" style={{ 
              backgroundColor: 'white', 
              color: '#158a9a', 
              padding: '16px 32px', 
              fontSize: '1.1rem', 
              border: 'none',
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)'
            }}>
              Start Free Now
            </Link>
            <a href="#features" className="btn btn--outline" style={{ 
              borderColor: 'white', 
              color: 'white',
              padding: '16px 32px',
              fontSize: '1.1rem', 
            }}>
              See How It Works
            </a>
          </div>
          
          <p style={{ marginTop: '24px', fontSize: '0.9rem', opacity: 0.8 }}>
            Trusted by UK Doctors (GPs, FY2s, Trainees)
          </p>
        </div>
      </section>

      {/* --- PROBLEM/SOLUTION (SEO RICH) --- */}
      <section style={{ padding: '80px 20px' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '40px', color: 'var(--umbil-text)' }}>
            Reduce GP Workload & Streamline Admin
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', textAlign: 'left' }}>
            
            <div className="card feature-card">
              <div className="card__body">
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧠</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Clinical Queries Solved</h3>
                <p style={{ color: 'var(--umbil-muted)', fontSize: '0.95rem' }}>
                  Stop trawling through guideline PDFs. Ask questions like <em>"UTI management NICE"</em> or <em>"Red flags for vertigo"</em> and get instant, cited answers.
                </p>
              </div>
            </div>

            <div className="card feature-card">
              <div className="card__body">
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✍️</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Automated Reflection</h3>
                <p style={{ color: 'var(--umbil-muted)', fontSize: '0.95rem' }}>
                  Struggling with <strong>how to write a GMC reflection</strong>? Umbil converts your cases into structured entries ready for your appraisal or ARCP.
                </p>
              </div>
            </div>

            <div className="card feature-card">
              <div className="card__body">
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Effortless CPD Logging</h3>
                <p style={{ color: 'var(--umbil-muted)', fontSize: '0.95rem' }}>
                  The <strong>best way to log CPD</strong> is automatically. We track your learning streaks and map them to GMC domains effortlessly.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SEO FOOTER / KEYWORDS SECTION --- */}
      <section style={{ background: 'var(--umbil-bg)', padding: '60px 20px', borderTop: '1px solid var(--umbil-card-border)' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Why use Umbil?</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>For GP Trainees & FY2s</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--umbil-muted)', lineHeight: 1.6 }}>
                  Umbil is the ultimate <strong>trainee doctor learning tool</strong>. Whether you need <strong>FY2 portfolio help</strong> or are looking for <strong>GP ARCP tips</strong>, our AI ensures you never miss a learning opportunity. Use our <strong>GMC reflective template</strong> generator to save hours on ePortfolio.
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>For Busy GPs</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--umbil-muted)', lineHeight: 1.6 }}>
                  <strong>Streamline GP admin</strong> and <strong>reduce appraisal stress</strong>. Umbil acts as a <strong>medical education AI</strong> that sits in your pocket, helping you stay up to date with <strong>clinical guideline summaries</strong> without the headache.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '40px', padding: '20px', background: 'var(--umbil-surface)', borderRadius: '12px', border: '1px solid var(--umbil-card-border)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Popular Searches we Solve:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {["Chest pain red flags", "Vertigo vs Dizziness", "NICE summary asthma", "GORD management primary care", "Fever in child guidance"].map(tag => (
                  <span key={tag} style={{ 
                    fontSize: '0.8rem', 
                    background: 'var(--umbil-bg)', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    color: 'var(--umbil-muted)',
                    border: '1px solid var(--umbil-divider)'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Ready to upgrade your medical learning?</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--umbil-muted)', marginBottom: '32px' }}>
          Join thousands of clinicians using Umbil today.
        </p>
        <Link href="/auth" className="btn btn--primary" style={{ padding: '14px 40px', fontSize: '1.1rem' }}>
          Get Started for Free
        </Link>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{ background: '#0f172a', color: 'white', padding: '40px 20px', fontSize: '0.9rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1fb8cd' }}>Umbil</div>
            <div style={{ opacity: 0.6, marginTop: '4px' }}>Your Medical Education Lifeline.</div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/auth" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Login</Link>
            <Link href="/about" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>About</Link>
            <Link href="/privacy" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Privacy</Link>
          </div>
        </div>
        <div className="container" style={{ marginTop: '20px', opacity: 0.4, fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} Umbil. All rights reserved. Not for use in critical care.
        </div>
      </footer>
    </div>
  );
}