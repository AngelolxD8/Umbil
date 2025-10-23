// src/app/about/page.tsx
"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="main-content">
      <div className="container">
        {/* Added extra space after the main title for a cleaner look */}
        <h2 style={{marginBottom: 32}}>About Umbil</h2>
        
        {/* The Intelligent Learning Platform for Modern Medicine */}
        {/* Increased vertical spacing around card */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>The Intelligent Learning Platform for Modern Medicine</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              Umbil is a next-generation medtech platform redefining how clinicians learn, reflect, and grow.
              Built by frontline doctors, it merges trusted medical knowledge with intelligent automation &mdash; transforming everyday clinical questions into meaningful professional development.
            </p>
            <p className="section-description" style={{marginBottom: 16}}>
              In a world where information is limitless but time is not, Umbil makes lifelong learning effortless.
            </p>
            {/* Removed teal color, relying on inherited text color */}
            <p style={{ fontWeight: 700 }}>
              Ask. Learn. Reflect. Log.
              <br/>
              All in one seamless experience.
            </p>
          </div>
        </div>

        {/* Our Mission */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>Our Mission</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              To empower every clinician with <strong>instant access to trusted knowledge</strong> and <strong>automatic reflection tools</strong> &mdash; turning real-time curiosity into lasting competence.
            </p>
            <p className="section-description">
              Umbil exists to reduce cognitive load, save time, and make staying up to date part of the working day, not another task at the end of it.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>How It Works</h3>
            {/* Adjusted top margin on list for better flow and added spacing between list items */}
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: '20px 0 20px 0' }}>
              <li style={{marginBottom: 12}}>
                Ask clinical questions. Umbil retrieves concise, evidence-based answers from UK-trusted sources &mdash; NICE, SIGN, CKS, and the BNF.
              </li>
              <li style={{marginBottom: 12}}>
                Reflect instantly. With one click, generate structured reflections aligned with GMC domains.
              </li>
              <li style={{marginBottom: 12}}>
                Build your PDP automatically. Umbil recognises learning patterns and suggests development goals.
              </li>
              <li>
                Stay organised. Every learning moment is securely logged, time-stamped, and export-ready for appraisal.
              </li>
            </ul>
            <p className="section-description" style={{marginTop: 16}}>
              Umbil is not just a tool &mdash; it&apos;s a companion for clinical reasoning, self-reflection, and continuous improvement.
            </p>
          </div>
        </div>

        {/* Privacy and Trust - Keeping the teal border as a nice visual cue */}
        <div className="card" style={{ marginBottom: 32, borderLeft: '4px solid var(--umbil-brand-teal)' }}>
          <div className="card__body">
            {/* Removed teal color from header and relied on inherited text color */}
            <h3 style={{marginBottom: 12}}>Privacy and Trust</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              Security and transparency are at the heart of Umbil.
            </p>
            {/* Adjusted top margin on list for better flow and bottom margin for more separation */}
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: '20px 0 20px 0' }}>
              <li style={{marginBottom: 12}}>
                All user data is encrypted and managed through secure Supabase Authentication.
              </li>
              <li style={{marginBottom: 12}}>
                Server-side filters automatically remove identifiable patient details before any data is processed by the AI model.
              </li>
              <li style={{marginBottom: 12}}>
                Users retain complete control: delete entries, clear CPD data, or remove your account entirely at any time.
              </li>
              <li>
                Umbil supports learning and education only &mdash; never direct patient care or diagnosis.
              </li>
            </ul>
            <p className="section-description" style={{marginBottom: 16}}>
              Our approach meets GDPR and NHS data-governance standards, ensuring compliance from design to delivery.
            </p>
            {/* Removed teal color, relying on inherited text color. Changed from p to Link for better linking */}
            <Link href="/privacy" className="link" style={{ fontWeight: 600, display: 'inline-block', marginTop: '8px' }}>
                &rarr; Read the Full Privacy Policy and Legal Terms
            </Link>
          </div>
        </div>
        
        {/* Our Vision */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>Our Vision</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              To become the trusted learning layer of healthcare &mdash; a digital ecosystem where knowledge, reflection, and growth are seamlessly connected.
            </p>
            <p className="section-description" style={{marginBottom: 16}}>
              Umbil bridges the gap between evidence and experience, building a generation of clinicians who learn continuously, reflect meaningfully, and thrive sustainably.
            </p>
            <p style={{ fontWeight: 700, fontStyle: 'italic' }}>
              Umbil &mdash; the lifeline of modern medical learning.
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}