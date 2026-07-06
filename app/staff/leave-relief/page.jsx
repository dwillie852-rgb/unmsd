'use client';

import { FileCheck2, ReceiptText, SearchCheck, UserPlus, ClipboardList, Route, ShieldPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function LeaveRelief() {
  return (
    <>
      <header style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/staff" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Staff Care Portal
        </Link>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Leave Relief Subsystem</span>
      </header>
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Global Staff Care Programme</p>
            <h1 className={styles.title}>Leave relief for global field doctors and their families.</h1>
            <p className={styles.desc}>
              A dedicated pathway for spouses and immediate family members to request time at home for doctors deployed globally in
              conflict, displacement, outbreak, or hardship missions without leaving patients uncovered.
            </p>
            <div className={styles.actions}>
              <Button href="/staff/leave-relief/apply" variant="primary">
                <FileCheck2 size={20} />
                Start application
              </Button>
              <Button href="#costs" variant="outline">
                <ReceiptText size={20} />
                View fee use
              </Button>
              <Button href="/staff/leave-relief/status" variant="secondary">
                <SearchCheck size={20} />
                Check status
              </Button>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelItem}>
                <strong>7-45</strong>
                <span>requested leave days</span>
              </div>
              <div className={styles.panelItem}>
                <strong>72h</strong>
                <span>replacement search target</span>
              </div>
              <div className={styles.panelItem}>
                <strong>100%</strong>
                <span>fee assigned to operations</span>
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Process</p>
            <h2 className={styles.title}>Four checks before a doctor travels home.</h2>
          </div>
          
          <div className={styles.timeline}>
            <div className={styles.timelineStep}>
              <span className={styles.timelineNumber}>01</span>
              <h3>Family request</h3>
              <p>The spouse or immediate family member submits the doctor, station, role, preferred window, and contact details.</p>
            </div>
            <div className={styles.timelineStep}>
              <span className={styles.timelineNumber}>02</span>
              <h3>Mission review</h3>
              <p>Operations confirms caseload, security movement, active referrals, pharmacy status, and leadership sign-off.</p>
            </div>
            <div className={styles.timelineStep}>
              <span className={styles.timelineNumber}>03</span>
              <h3>Replacement match</h3>
              <p>A clinician with the right specialty and field profile is contracted, briefed, and scheduled for handover.</p>
            </div>
            <div className={styles.timelineStep}>
              <span className={styles.timelineNumber}>04</span>
              <h3>Leave clearance</h3>
              <p>Travel is cleared when patient notes, referral lists, duty rosters, and security handover are complete.</p>
            </div>
          </div>
        </section>

        {/* Fee Use */}
        <section className={styles.section} id="costs">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Fee use</p>
            <h2 className={styles.title}>The application cost keeps the post covered.</h2>
          </div>
          
          <div className={styles.grid}>
            <div>
              <Card>
                <UserPlus size={32} color="var(--color-brand)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Replacement clinician</h3>
                <p>Daily coverage cost for the clinician who takes over the field doctor's duties.</p>
              </Card>
            </div>
            <div>
              <Card>
                <ClipboardList size={32} color="var(--color-brand)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Handover and onboarding</h3>
                <p>Clinical briefing, protocol review, security induction, pharmacy notes, and referral transfer.</p>
              </Card>
            </div>
            <div>
              <Card>
                <Route size={32} color="var(--color-brand)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Travel coordination</h3>
                <p>Family-facing support when movement, documentation, and flight timing need operational coordination.</p>
              </Card>
            </div>
            <div>
              <Card>
                <ShieldPlus size={32} color="var(--color-brand)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Operations reserve</h3>
                <p>A small reserve for urgent schedule changes, delayed movement, or replacement extension.</p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
