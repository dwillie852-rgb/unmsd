import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '6rem', fontFamily: 'Times New Roman, serif', color: '#ccc', lineHeight: 1, marginBottom: '1rem' }}>404</div>
          <h1 style={{ fontFamily: 'Times New Roman, serif', fontSize: '1.5rem', color: '#111', marginBottom: '0.5rem' }}>Page Not Found</h1>
          <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            The requested resource could not be located within the UNMSD information system. It may have been moved, archived, or you may not have the necessary clearance.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: '#005bbb', color: '#fff', textDecoration: 'none', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.875rem' }}>
            Return to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
