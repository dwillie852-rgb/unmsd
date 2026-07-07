'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, ArrowLeft, Send, Copy } from 'lucide-react';
import Button from '@/components/Button';
import styles from './page.module.css';

export default function Apply() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    doctor: '',
    doctorEmail: '',
    station: '',
    role: 'medical',
    zone: 'standard',
    days: 14,
    startDate: '',
    travel: true,
    applicant: '',
    email: '',
    familyNotes: '',
    consent: false
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successRef, setSuccessRef] = useState(null);
  const [feeSettings, setFeeSettings] = useState(null);

  useEffect(() => {
    fetch('/api/fee-settings')
      .then(res => res.json())
      .then(data => {
        if (data.feeSettings) setFeeSettings(data.feeSettings);
      })
      .catch(err => console.error("Failed to load fee settings:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/leave-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.errors?.[0] || 'Failed to submit application');
      }
      
      setSuccessRef(data.application.reference);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  // Fallback defaults while loading
  const rates = feeSettings?.roleRates || { medical: 245, emergency: 380, surgical: 520, maternal: 320, mental: 290 };
  const multipliers = feeSettings?.zoneMultipliers || { standard: 1, hardship: 1.18, critical: 1.35 };
  const handoverRates = feeSettings?.handover || { default: 650, surgical: 900 };
  const travelCoord = feeSettings?.travelCoordination ?? 480;
  const reservePercent = feeSettings?.reservePercent ?? 8;

  const coverageCost = Math.round((rates[formData.role] || 245) * (multipliers[formData.zone] || 1) * formData.days);
  const handoverCost = formData.role === 'surgical' ? handoverRates.surgical : handoverRates.default;
  const travelCost = formData.travel ? travelCoord : 0;
  const reserveCost = Math.round((coverageCost + handoverCost + travelCost) * (reservePercent / 100));
  const total = coverageCost + handoverCost + travelCost + reserveCost;

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (successRef) {
    return (
      <div className={styles.layout}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            <span className={styles.mark} aria-hidden="true">UN</span>
            <span>UNMSD Portal</span>
          </Link>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', position: 'fixed', inset: 0, zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem 1.5rem', borderRadius: '8px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#005bbb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Send size={32} color="white" />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111' }}>Application Submitted</h2>
            <p style={{ color: '#555', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Your leave replacement application has been received and is now in the review queue.
            </p>
            <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #ccc', padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem', fontWeight: 700 }}>Tracking Reference ID</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#005bbb', wordBreak: 'break-all', margin: 0 }}>{successRef}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(successRef);
                    const btn = document.getElementById('copy-btn-icon');
                    if (btn) {
                      btn.style.stroke = '#28a745';
                      setTimeout(() => btn.style.stroke = 'currentColor', 2000);
                    }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#555' }}
                  title="Copy to clipboard"
                >
                  <Copy id="copy-btn-icon" size={20} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button href={`/staff/leave-relief/status?ref=${successRef}`} variant="primary">
                Track Status
              </Button>
              <Button href="/staff" variant="outline">
                Return to Portal
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">UN</span>
          <span>UNMSD Portal</span>
        </Link>
        <Button href="/staff/leave-relief" variant="outline">Cancel</Button>
      </header>

      <main className={styles.main}>
        <div className={styles.formContainer}>
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span className={styles.eyebrow}>Secure intake</span>
              <h2>Leave request</h2>
              <span className={styles.pill}>
                <Lock size={14} /> Review queue
              </span>
            </div>

            <div className={styles.steps}>
              <div className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ''}`}>1. Field details</div>
              <div className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ''}`}>2. Dates & coverage</div>
              <div className={`${styles.stepDot} ${step >= 3 ? styles.stepDotActive : ''}`}>3. Applicant details</div>
            </div>

            <div className={styles.costPanel}>
              <div className={styles.costRow}>
                <span>Replacement coverage</span>
                <strong>{formatCurrency(coverageCost)}</strong>
              </div>
              <div className={styles.costRow}>
                <span>Handover & onboarding</span>
                <strong>{formatCurrency(handoverCost)}</strong>
              </div>
              <div className={styles.costRow}>
                <span>Travel coordination</span>
                <strong>{formatCurrency(travelCost)}</strong>
              </div>
              <div className={styles.costRow}>
                <span>Operations reserve</span>
                <strong>{formatCurrency(reserveCost)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Estimated cost</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            </div>
          </div>

          <form className={styles.content} onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <h3>1. Field details</h3>
                <p className={styles.formNote}>Provide the doctor's details and operations zone. This helps us locate an exact replacement match.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Field doctor</label>
                    <input className={styles.input} name="doctor" value={formData.doctor} onChange={handleChange} placeholder="Full Name" required />
                  </div>
                  <div className={styles.field}>
                    <label>Doctor's Email</label>
                    <input className={styles.input} type="email" name="doctorEmail" value={formData.doctorEmail} onChange={handleChange} placeholder="doctor@unmiss.org" required />
                  </div>
                  <div className={styles.field}>
                    <label>Field station</label>
                    <input className={styles.input} name="station" value={formData.station} onChange={handleChange} placeholder="Location or desk" required />
                  </div>
                  <div className={styles.field}>
                    <label>Replacement role</label>
                    <select className={styles.input} name="role" value={formData.role} onChange={handleChange}>
                      <option value="medical">Medical officer</option>
                      <option value="emergency">Emergency physician</option>
                      <option value="surgical">Surgical or anaesthesia doctor</option>
                      <option value="maternal">OB or maternal health clinician</option>
                      <option value="mental">Mental health clinician</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Field pressure</label>
                    <select className={styles.input} name="zone" value={formData.zone} onChange={handleChange}>
                      <option value="standard">Standard mission</option>
                      <option value="hardship">Hardship mission</option>
                      <option value="critical">Critical or conflict mission</option>
                    </select>
                  </div>
                </div>

                <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                  <Button type="button" onClick={handleNext}>
                    Next step <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3>2. Dates & coverage</h3>
                <p className={styles.formNote}>Select the preferred leave window. The total cost reflects the exact days of replacement coverage.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-brand)' }}>
                      Requested leave <span>{formData.days} days</span>
                    </label>
                    <input className={styles.input} type="range" name="days" min="7" max="45" value={formData.days} onChange={handleChange} />
                  </div>
                  <div className={styles.field}>
                    <label>Preferred start date</label>
                    <input className={styles.input} type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                  </div>
                </div>

                <label className={styles.checkboxRow}>
                  <input type="checkbox" name="travel" checked={formData.travel} onChange={handleChange} />
                  <span>Include family travel coordination support for field movement and flights.</span>
                </label>

                <div className={styles.actions}>
                  <Button type="button" variant="secondary" onClick={handlePrev}>
                    <ArrowLeft size={18} /> Back
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Next step <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3>3. Applicant details</h3>
                <p className={styles.formNote}>Who should operations contact to confirm this request?</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Applicant name</label>
                    <input className={styles.input} name="applicant" value={formData.applicant} onChange={handleChange} placeholder="Family member name" required />
                  </div>
                  <div className={styles.field}>
                    <label>Email</label>
                    <input className={styles.input} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.org" required />
                  </div>
                  <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                    <label>Family notes</label>
                    <textarea className={styles.input} rows="3" name="familyNotes" value={formData.familyNotes} onChange={handleChange} placeholder="Urgent context or constraints..." />
                  </div>
                </div>

                <label className={styles.checkboxRow}>
                  <input type="checkbox" name="consent" checked={formData.consent} onChange={handleChange} required />
                  <span>I understand this starts an operations review and does not approve travel until coverage, payment status, security movement, and handover are cleared.</span>
                </label>

                {error && (
                  <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}
                
                <div className={styles.actions}>
                  <Button type="button" variant="secondary" onClick={handlePrev} disabled={isSubmitting}>
                    <ArrowLeft size={18} /> Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Send size={18} /> {isSubmitting ? 'Submitting...' : 'Submit application'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
