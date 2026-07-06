'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function FraudAlertModal({ isOpen, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderTop: '4px solid #d32f2f',
        width: '100%',
        maxWidth: '600px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#d32f2f' }}>
            <AlertTriangle size={24} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Times New Roman, serif', color: '#111', fontWeight: 700, textTransform: 'uppercase' }}>Fraud Alert</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', maxHeight: '70vh', color: '#333', fontSize: '0.95rem', lineHeight: 1.6 }}>
          <p style={{ fontWeight: 700, marginBottom: '1rem', color: '#111' }}>Beware of Scams Implying Association with the United Nations</p>
          <p style={{ marginBottom: '1rem' }}>
            The United Nations has been made aware of various correspondences, being circulated via e-mail, from Internet web sites, text messages and via regular mail or facsimile, falsely stating that they are issued by, or in association with the United Nations and/or its officials. These scams, which may seek to obtain money and/or in many cases personal details from the recipients of such correspondence, are fraudulent.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            The United Nations wishes to warn the public at large about these fraudulent activities being perpetrated purportedly in the name of the Organisation, and/or its officials, through different fraud schemes.
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>The United Nations does not charge a fee at any stage of its recruitment process</strong> (application, interview, processing, training) or other fee, or request information on applicants' bank accounts.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>The United Nations does not charge a fee at any stage of its procurement process</strong> (supplier registration, bids submission) or other fee.</li>
            <li style={{ marginBottom: '0.5rem' }}>The United Nations does not request any information related to bank accounts or other private information.</li>
            <li>The United Nations does not offer prizes, awards, funds, certificates, automated teller machine (ATM) cards, compensation for Internet fraud, or scholarships, or conduct lotteries.</li>
          </ul>
          <p style={{ margin: 0 }}>
            If you suspect you have been the victim of a fraud, we strongly recommend that you contact your local law enforcement authorities.
          </p>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} style={{ backgroundColor: '#111', color: '#fff', padding: '0.5rem 1.5rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.875rem' }}>
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
