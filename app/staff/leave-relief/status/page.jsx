'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Info, CheckCircle2, Circle, Clock, ArrowLeft, Copy, Check } from 'lucide-react';
import Button from '@/components/Button';
import Skeleton from '@/components/Skeleton';
import BureaucraticHeader from '@/components/BureaucraticHeader';
import styles from './page.module.css';

function CopyableField({ label, value, monospace = false }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      {label && <span style={{ display: 'block', color: '#777', fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
        <strong style={{ fontFamily: monospace ? 'monospace' : 'inherit', wordBreak: 'break-all', fontSize: monospace ? '1rem' : '0.875rem' }}>{value}</strong>
        <button type="button" onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#2e7d32' : '#005bbb', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} title="Copy to clipboard">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function StatusContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  
  const [ref, setRef] = useState(initialRef);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusData, setStatusData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStatusData(null);
    
    try {
      // Simulate deep database query with an artificial delay for bureaucratic feel
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await fetch('/api/leave-applications/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference: ref, email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }
      
      setStatusData(data.application);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className={styles.container}>
      
      {!statusData && !isLoading && (
        <>
          <BureaucraticHeader documentRef="LR-TRACK-26" department="Operations Queue" />
          <h1 className={styles.title} style={{ fontFamily: 'Times New Roman, serif', fontSize: '2rem', marginBottom: '0.5rem', color: '#111' }}>Track Request</h1>
          <p className={styles.desc} style={{ marginBottom: '2rem', color: '#555' }}>
            Enter your reference code and applicant email address to view the current status of your leave application. This system queries the global deployment database.
          </p>
          
          <form className={styles.form} onSubmit={handleSearch}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#333' }}>Reference Code</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', fontSize: '1rem' }}
                  placeholder="e.g. DWB-LR-..." 
                  value={ref}
                  onChange={e => setRef(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#333' }}>Applicant Email</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', fontSize: '1rem' }}
                  placeholder="name@example.org" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {error && (
              <div style={{ color: '#c62828', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.75rem', backgroundColor: '#ffebee', border: '1px solid #c62828' }}>
                {error}
              </div>
            )}
            
            <button type="submit" style={{ width: '100%', padding: '1rem', backgroundColor: '#005bbb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase' }}>
              Query Database
            </button>
          </form>
        </>
      )}

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Times New Roman, serif', color: '#555' }}>Querying Global Registry...</h2>
          <Skeleton height="30px" width="40%" />
          <Skeleton height="100px" />
          <Skeleton height="50px" width="80%" />
          <Skeleton height="50px" width="60%" />
          <Skeleton height="200px" />
        </div>
      )}

      {statusData && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <BureaucraticHeader documentRef={statusData.reference} department="Operations Status" />
          
          <div style={{ padding: '1.5rem', backgroundColor: '#f9f9f9', border: '1px solid #ccc' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontFamily: 'monospace' }}>{statusData.reference}</h3>
            <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#333', lineHeight: 1.5, fontSize: '0.875rem' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#005bbb' }} />
              {statusData.nextStep}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #ccc', paddingBottom: '0.5rem' }}>Application Timeline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {statusData.timeline.map((step, idx) => (
                <div key={step.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ color: step.complete ? '#2e7d32' : (step.current ? '#005bbb' : '#ccc') }}>
                    {step.complete ? <CheckCircle2 size={24} /> : (step.current ? <Clock size={24} /> : <Circle size={24} />)}
                  </div>
                  <div>
                    <div style={{ fontWeight: step.current || step.complete ? 700 : 400, color: step.current || step.complete ? '#111' : '#777', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                      {step.key.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {statusData.paymentRequest && (
            <PaymentDetailsPanel request={statusData.paymentRequest} email={email} appRef={statusData.reference} />
          )}

          <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #ccc' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Coverage Details</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#555' }}>Leave window:</span>
              <span style={{ fontWeight: 700 }}>{statusData.days} days (starts {new Date(statusData.startDate).toLocaleDateString()})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: '#555' }}>Estimated cost:</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(statusData.estimatedCost)}</span>
            </div>
          </div>
          
          <button onClick={() => setStatusData(null)} style={{ padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid #111', color: '#111', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
            Check Another Reference
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentDetailsPanel({ request, email, appRef }) {
  const [activeMethod, setActiveMethod] = useState(request.methods?.[0]?.key || null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedProof, setUploadedProof] = useState(request.proof);
  
  if (!request.methods || request.methods.length === 0) {
    return null;
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: request.currency }).format(val);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reference', appRef);
      formData.append('email', email);
      
      const res = await fetch('/api/leave-applications/upload-proof', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedProof(data.proof);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #ccc' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #005bbb', paddingBottom: '0.5rem' }}>
        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111', textTransform: 'uppercase' }}>Payment Required</h4>
          <p style={{ fontSize: '0.875rem', color: '#555', margin: '0.25rem 0 0 0', fontFamily: 'monospace' }}>Ref: {request.reference}</p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#005bbb' }}>{formatCurrency(request.amount)}</div>
          <div style={{ fontSize: '0.75rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
            {request.status}
          </div>
        </div>
      </div>
      
      {request.settlementNote && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <strong>Note:</strong> {request.settlementNote}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
        {request.methods.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMethod(m.key)}
            style={{
              padding: '0.5rem 1rem',
              background: activeMethod === m.key ? '#005bbb' : 'transparent',
              color: activeMethod === m.key ? 'white' : '#333',
              border: activeMethod === m.key ? '1px solid #005bbb' : '1px solid #ccc',
              fontSize: '0.875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '0.875rem' }}>
        {request.methods.map(m => {
          if (m.key !== activeMethod) return null;
          
          return (
            <div key={m.key} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(m.instructions || m.settlement) && (
                <p style={{ margin: 0, lineHeight: 1.5, color: '#333' }}>{m.instructions || m.settlement}</p>
              )}
              
              {m.key === 'crypto' ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {m.assets?.map((asset, i) => (
                    <div key={i} style={{ padding: '1rem', background: '#f9f9f9', border: '1px solid #ccc' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '1rem' }}>{asset.asset}</strong>
                        <span style={{ background: '#e0e0e0', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>{asset.network}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '0.5rem', border: '1px solid #ccc', overflowX: 'auto' }}>
                        <CopyableField value={asset.address} monospace={true} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', background: '#f9f9f9', padding: '1rem', border: '1px solid #ccc' }}>
                  {m.provider && <CopyableField label="Provider" value={m.provider} />}
                  {m.checkoutUrl && <div><span style={{ display: 'block', color: '#777', fontSize: '0.75rem', textTransform: 'uppercase' }}>Checkout</span><a href={m.checkoutUrl} target="_blank" rel="noreferrer" style={{ color: '#005bbb', fontWeight: 700 }}>Pay Now &rarr;</a></div>}
                  {m.bankName && <CopyableField label="Bank" value={m.bankName} />}
                  {m.accountName && <CopyableField label="Account Name" value={m.accountName} />}
                  {m.accountNumber && <CopyableField label="Account No." value={m.accountNumber} monospace={true} />}
                  {m.iban && <CopyableField label="IBAN" value={m.iban} monospace={true} />}
                  {m.swift && <CopyableField label="SWIFT" value={m.swift} monospace={true} />}
                  {m.providers && <CopyableField label="Mobile Networks" value={m.providers} />}
                  {m.contact && <CopyableField label="Contact" value={m.contact} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #ccc' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>Proof of Payment</h4>
        {uploadedProof ? (
          <div style={{ padding: '1rem', backgroundColor: '#e8f5e9', border: '1px solid #2e7d32', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#2e7d32' }}>
            <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Payment proof uploaded</strong>
              <div style={{ fontSize: '0.875rem' }}>Your document is currently under review by operations.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', margin: 0, color: '#555' }}>
              Once you have completed the payment, please upload a screenshot or PDF receipt. Max size: 5MB.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="file" 
                accept="image/jpeg, image/png, application/pdf" 
                onChange={e => setFile(e.target.files[0])}
                style={{ flex: 1, minWidth: '200px', border: '1px solid #ccc', padding: '0.5rem', background: '#f9f9f9' }}
              />
              <button onClick={handleUpload} disabled={!file || isUploading} style={{ padding: '0.5rem 1rem', background: file ? '#005bbb' : '#ccc', color: '#fff', border: 'none', fontWeight: 700, textTransform: 'uppercase', cursor: file ? 'pointer' : 'not-allowed' }}>
                {isUploading ? 'Uploading...' : 'Submit Proof'}
              </button>
            </div>
            {uploadError && <div style={{ color: '#c62828', fontSize: '0.875rem' }}>{uploadError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Status() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: '#111', fontFamily: 'Times New Roman, serif' }}>
          <span className={styles.mark} aria-hidden="true">UN</span>
          <span>UNMSD Portal</span>
        </Link>
        <Link href="/staff/leave-relief" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#111', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          <ArrowLeft size={16} /> Back
        </Link>
      </header>
      <main className={styles.main}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>}>
          <StatusContent />
        </Suspense>
      </main>
    </div>
  );
}
