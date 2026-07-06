import Link from 'next/link';
import { ArrowRight, CalendarDays, BrainCircuit, Stethoscope, Briefcase } from 'lucide-react';
import Button from '@/components/Button';
import styles from './page.module.css';

export default function StaffPortal() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">UN</span>
          <span>UNMSD Portal</span>
        </Link>
        <Button href="/" variant="outline">Exit Portal</Button>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Internal Gateway</p>
          <h1 className={styles.title}>Staff Care Portal</h1>
          <p className={styles.desc}>
            Secure access to support programs, clinical supervision resources, and administrative relief for active field medical personnel.
          </p>

          <div className={styles.grid}>
            <Link href="/staff/leave-relief" className={styles.portalCard}>
              <div className={styles.iconWrapper}>
                <CalendarDays size={32} />
              </div>
              <h2 className={styles.cardTitle}>Leave Relief & Handover</h2>
              <p className={styles.cardDesc}>
                Submit requests for family-initiated leave, track replacement contracting status, and coordinate clinical handover schedules.
              </p>
              <div className={styles.cardLink}>
                Manage Leave <ArrowRight size={16} />
              </div>
            </Link>

            <Link href="/staff/psychosocial-support" className={styles.portalCard}>
              <div className={styles.iconWrapper}>
                <BrainCircuit size={32} />
              </div>
              <h2 className={styles.cardTitle}>Psychosocial Support</h2>
              <p className={styles.cardDesc}>
                Confidential access to trauma counseling, stress management protocols, and mandatory incident debriefing schedules.
              </p>
              <div className={styles.cardLink}>
                Access Resources <ArrowRight size={16} />
              </div>
            </Link>

            <Link href="/staff/clinical-supervision" className={styles.portalCard}>
              <div className={styles.iconWrapper}>
                <Stethoscope size={32} />
              </div>
              <h2 className={styles.cardTitle}>Clinical Supervision</h2>
              <p className={styles.cardDesc}>
                Access updated WHO treatment protocols, submit peer-review clinical audits, and request remote specialist telemedicine consults.
              </p>
              <div className={styles.cardLink}>
                Enter Clinical Hub <ArrowRight size={16} />
              </div>
            </Link>

            <Link href="/staff/deployment-logistics" className={styles.portalCard}>
              <div className={styles.iconWrapper}>
                <Briefcase size={32} />
              </div>
              <h2 className={styles.cardTitle}>Deployment Logistics</h2>
              <p className={styles.cardDesc}>
                View upcoming rotation schedules, check security clearance status, and download mandatory pre-deployment briefing packets.
              </p>
              <div className={styles.cardLink}>
                View Deployments <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
