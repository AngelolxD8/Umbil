// src/app/about/page.tsx
"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="main-content">
      <div className="container">
        <h2 style={{marginBottom: 24}}>About Umbil: Your Medical Lifeline</h2>
        
        {/* What is Umbil? */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3>What is Umbil?</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              Umbil is a web-based clinical co-pilot designed for doctors, students, and allied health professionals. 
              It uses AI to answer clinical queries in real time, summarises evidence-based UK guidelines, and logs reflective learning for CPD and appraisal.
            </p>
          </div>
        </div>

        {/* Clinical Safety Disclaimer */}
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--umbil-brand-teal)' }}>
          <div className="card__body">
            <h3 style={{color: 'var(--umbil-brand-teal)', marginBottom: 8}}>⚠️ Critical Safety Disclaimer</h3>
            <p className="section-description" style={{ fontWeight: 600, marginBottom: 8 }}>
              Umbil is an &quot;assistance tool&quot; designed to support&mdash;not replace&mdash;professional clinical judgement.
            </p>
            <p className="section-description">
              AI-generated summaries can occasionally contain errors, omissions, or misinterpretations. Always <strong>double-check</strong> all advice and information against trusted medical sources (NICE, BNF, local guidelines) before making patient-care decisions.
            </p>
          </div>
        </div>

        {/* GDPR and Data Safety - UPDATED HEADING AND LINK */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 8}}>Data Safety Summary (Read Full Privacy Policy)</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              We take data security seriously. Here is a summary of how your data is handled. For the full legal terms, please read our <strong><Link href="/privacy" className="link">Privacy Policy</Link></strong> (required under GDPR).
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: '16px 0 0 0' }}>
              <li style={{marginBottom: 12}}>
                <strong>No Patient Data</strong>: You must never enter <strong>patient-identifiable information (PHI)</strong> into Umbil. Our platform is not built for storing or processing PHI.
              </li>
              <li style={{marginBottom: 12}}>
                <strong>CPD Logging</strong>: All conversations and reflections are securely stored for your CPD/PDP log. This data is kept local to your browser until you sign in, at which point it is associated with your private account.
              </li>
              <li>
                <strong>Your Rights</strong>: You have the right to access, export (<Link href="/cpd" className="link">Download CSV</Link> from CPD), and erase your data. Please visit <Link href="/settings" className="link">Settings</Link> for tools to manage your stored information.
              </li>
            </ul>
          </div>
        </div>
        
        {/* Updated FAQ Section */}
        <div className="card">
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>Frequently Asked Questions (FAQ)</h3>
            <div style={{ marginTop: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Q: Is Umbil free?</p>
                <p className="section-description" style={{ marginBottom: 16 }}>A: Umbil is currently in a beta/early access phase. Our goal is to keep essential features affordable and accessible for all medical professionals.</p>
                
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Q: Which guidelines does Umbil use?</p>
                <p className="section-description" style={{ marginBottom: 16 }}>A: Umbil is specifically prompted to reference UK-based trusted sources like NICE, SIGN, CKS, and the BNF where relevant.</p>

                <p style={{ fontWeight: 600, marginBottom: 4 }}>Q: How is my personal data used?</p>
                <p className="section-description" style={{ marginBottom: 16 }}>A: Your full name and professional grade are used solely to personalize the AI&apos;s system prompt (e.g., &quot;answering a GP Trainee&quot;) to provide more relevant context-aware guidance. They are never shared with the AI or used for targeted marketing.</p>
                
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Q: What technology powers Umbil?</p>
                <p className="section-description" style={{ marginBottom: 16 }}>A: Umbil is built on modern technologies including Next.js/React, TypeScript, and utilizes the OpenAI API (GPT-4o-mini) for its core clinical intelligence functions. We use Supabase for secure user authentication.</p>
                
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Q: What kind of questions can I ask?</p>
                <p className="section-description">A: You can ask clinical questions (&quot;Management of community acquired pneumonia?&quot;), educational questions (&quot;What is the mechanism of action of SGLT2 inhibitors?&quot;), or reflective prompts (&quot;What did I learn from the recent chest pain case?&quot;).</p>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}