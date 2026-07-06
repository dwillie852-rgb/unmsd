'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import Button from '@/components/Button';

export default function SecureLogin({ title, systemName }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      setError('Invalid UN credentials or unauthorized access to this system.');
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      <header style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/staff" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Staff Care Portal
        </Link>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{systemName}</span>
      </header>
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-brand)', color: 'white', marginBottom: '1rem' }}>
              <Lock size={24} />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{title}</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Authorized UNMSD personnel only.
            </p>
          </div>
          
          <form onSubmit={handleLogin} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>UN Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="firstname.lastname@un.org" 
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password / Passcode</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
              />
            </div>
            
            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.875rem', border: '1px solid #f87171' }}>
                {error}
              </div>
            )}
            
            <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </Button>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <a href="#" style={{ fontSize: '0.875rem', color: 'var(--color-brand)', textDecoration: 'none' }}>Forgot credentials?</a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
