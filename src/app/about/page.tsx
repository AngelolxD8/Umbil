// src/app/about/page.tsx
"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="main-content">
      <div className="container">
        <h2 style={{marginBottom: 24}}>About Umbil</h2>
        
        {/* The Intelligent Learning Platform for Modern Medicine */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 8}}>The Intelligent Learning Platform for Modern Medicine</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              Umbil is a next-generation medtech platform redefining how clinicians learn, reflect, and grow.
              Built by frontline doctors, it merges trusted medical knowledge with intelligent automation &mdash; transforming everyday clinical questions into meaningful professional development.
            </p>
            <p className="section-description" style={{marginBottom: 16}}>
              In a world where information is limitless but time is not, Umbil makes lifelong learning effortless.
            </p>
            <p style={{ fontWeight: 700, color: 'var(--umbil-brand-teal)' }}>
              Ask. Learn. Reflect. Log.
              <br/>
              All in one seamless experience.
            </p>
          </div>
        </div>

        {/* Our Mission */}
        <div className="card" style={{ marginBottom: 24 }}>
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
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12}}>How It Works</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: '16px 0 16px 0' }}>
              <li style={{marginBottom: 8}}>
                Ask clinical questions. Umbil retrieves concise, evidence-based answers from UK-trusted sources &mdash; NICE, SIGN, CKS, and the BNF.
              </li>
              <li style={{marginBottom: 8}}>
                Reflect instantly. With one click, generate structured reflections aligned with GMC domains.
              </li>
              <li style={{marginBottom: 8}}>
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

        {/* Privacy and Trust - Aesthetic Flair Added */}
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--umbil-brand-teal)' }}>
          <div className="card__body">
            <h3 style={{marginBottom: 12, color: 'var(--umbil-brand-teal)'}}>Privacy and Trust</h3>
            <p className="section-description" style={{marginBottom: 16}}>
              Security and transparency are at the heart of Umbil.
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: '16px 0 16px 0' }}>
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
            <p className="section-description" style={{ fontWeight: 600, color: 'var(--umbil-brand-teal)' }}>
              &rarr; <Link href="/privacy" className="link">Read the Full Privacy Policy and Legal Terms</Link>
            </p>
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