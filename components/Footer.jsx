'use client';

import { useState } from 'react';
import Link from 'next/link';
import FraudAlertModal from './FraudAlertModal';
import styles from './Footer.module.css';

export default function Footer() {
  const [isFraudAlertOpen, setIsFraudAlertOpen] = useState(false);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.brandCol}>
              <Link href="/" className={styles.brand}>
                <div className={styles.brandMark}>
                  <span className={styles.brandBadge}>UN</span>
                  <span className={styles.brandText}>Medical Services Division</span>
                </div>
              </Link>
              <p className={styles.desc}>
                Providing independent medical assistance, occupational health management, and global field hospital operations for United Nations personnel worldwide.
              </p>
            </div>

            <nav className={styles.navCol}>
              <h2 className={styles.navTitle}>Mission</h2>
              <Link href="/about" className={styles.link}>Mandate</Link>
              <Link href="/operations" className={styles.link}>Field Hospitals</Link>
              <Link href="/data" className={styles.link}>Health Updates</Link>
            </nav>

            <nav className={styles.navCol}>
              <h2 className={styles.navTitle}>Resources</h2>
              <a href="https://www.un.org" className={styles.link} target="_blank" rel="noopener noreferrer">United Nations</a>
              <a href="https://hr.un.org" className={styles.link} target="_blank" rel="noopener noreferrer">UN Human Resources</a>
              <a href="https://www.un.org/Depts/ptd/" className={styles.link} target="_blank" rel="noopener noreferrer">Procurement</a>
            </nav>

            <nav className={styles.navCol}>
              <h2 className={styles.navTitle}>Internal</h2>
              <Link href="/staff" className={styles.link}>Staff Care Portal</Link>
              <Link href="/admin" className={styles.link}>Duty Officer Login</Link>
              <a href="https://mail.un.org/" className={styles.link} target="_blank" rel="noopener noreferrer">Webmail</a>
            </nav>
          </div>

          <div className={styles.bottom}>
            <span>&copy; {new Date().getFullYear()} United Nations. All rights reserved.</span>
            <span>
              <a href="https://www.un.org/en/about-us/privacy-notice" className={styles.link} target="_blank" rel="noopener noreferrer" style={{marginRight: '1rem'}}>Privacy Notice</a>
              <button 
                onClick={() => setIsFraudAlertOpen(true)} 
                className={styles.link} 
                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
              >
                Fraud Alert
              </button>
            </span>
          </div>
        </div>
      </footer>

      <FraudAlertModal 
        isOpen={isFraudAlertOpen} 
        onClose={() => setIsFraudAlertOpen(false)} 
      />
    </>
  );
}
