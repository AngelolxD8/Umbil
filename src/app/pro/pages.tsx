// src/app/pro/page.tsx
import Link from "next/link";

export default function ProPage() {
  return (
    <section className="main-content">
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 24, marginTop: 40 }}>Umbil Pro: Unlimited Learning</h2>
        
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: '40px' }}>
          <div className="card__body">
            <h3 style={{ color: 'var(--umbil-brand-teal)', marginBottom: 20 }}>This Page is Under Development</h3>
            <p style={{ marginBottom: 16 }}>
              Thank you for your interest in Umbil Pro! For early adopters, access to Umbil remains entirely free for now.
            </p>
            <p style={{ marginBottom: 30 }}>
              In the future, this is where you'll manage your subscription to unlock **unlimited daily queries**, advanced features, and priority support.
            </p>
            <Link href="/" className="btn btn--primary">
              ← Continue to Free Umbil
            </Link>
          </div>
        </div>
        
        {/* Placeholder for future Pro details */}
        <div style={{ marginTop: 40, color: 'var(--umbil-muted)', fontSize: '0.9rem' }}>
             <p>Stay tuned for more updates on Umbil Pro features!</p>
        </div>
      </div>
    </section>
  );
}