// src/app/about/page.tsx
"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="main-content">
      <div className="container">
        <h2 style={{marginBottom: 24}}>About Umbil: Your Medical Lifeline</h2>
        
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3>What is Umbil?</h3>
            <p className="section-description">
              [cite_start]Umbil is a **web-based clinical co-pilot** designed for doctors, students, and allied health professionals[cite: 161]. 
              [cite_start]It uses AI to answer clinical queries in real time, summarises **evidence-based UK guidelines**, and logs reflective learning for **CPD and appraisal**[cite: 162].
            </p>
          </div>
        </div>

        {/* Clinical Safety Disclaimer */}
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--umbil-brand-teal)' }}>
          <div className="card__body">
            <h3 style={{color: 'var(--umbil-brand-teal)'}}>⚠️ Critical Safety Disclaimer</h3>
            <p className="section-description" style={{ fontWeight: 600 }}>
              [cite_start]Umbil is an **assistance tool** designed to support—not replace—professional clinical judgement[cite: 198].
            </p>
            <p className="section-description">
              AI-generated summaries can occasionally contain errors, omissions, or misinterpretations. **Always double-check** all advice and information against trusted medical sources (NICE, BNF, local guidelines) before making patient-care decisions.
            </p>
          </div>
        </div>

        {/* GDPR and Data Safety */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3>Data Safety & GDPR Compliance</h3>
            <p className="section-description">
              We take data security seriously. Here is how your data is handled:
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: '12px 0 0 0' }}>
              <li style={{marginBottom: 8}}>
                **No Patient Data**: You must **never enter any patient-identifiable information (PHI)** into Umbil. Our platform is not built for storing or processing PHI.
              </li>
              <li style={{marginBottom: 8}}>
                **CPD Logging**: All conversations and reflections are securely stored for your CPD/PDP log. This data is kept local to your browser until you sign in, at which point it is associated with your private account.
              </li>
              <li>
                **Your Rights**: You have the right to access, export (<Link href="/cpd" className="link">Download CSV</Link> from CPD), and erase your data. Please visit <Link href="/settings" className="link">Settings</Link> for tools to manage your stored information.
              </li>
            </ul>
          </div>
        </div>
        
        {/* Simple FAQ Section */}
        <div className="card">
          <div className="card__body">
            <h3>Frequently Asked Questions (FAQ)</h3>
            <div style={{ marginTop: 12 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Q: Is Umbil free?</p>
                <p className="section-description" style={{ marginBottom: 12 }}>A: Umbil is currently in a beta/early access phase. Our goal is to keep essential features affordable and accessible for all medical professionals.</p>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Q: Which guidelines does Umbil use?</p>
                <p className="section-description">A: Umbil is specifically prompted to reference **UK-based trusted sources** like NICE, SIGN, CKS, and the BNF where relevant.</p>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}