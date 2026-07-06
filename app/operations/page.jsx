'use client';

import dynamic from 'next/dynamic';
import { Stethoscope, HeartPulse, Truck, Plane } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BureaucraticHeader from '@/components/BureaucraticHeader';
import styles from './page.module.css';

// Dynamically import the map to prevent SSR issues with Leaflet
const OperationsMap = dynamic(() => import('@/components/OperationsMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '500px', backgroundColor: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map Interface...</div>
});

export default function Operations() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>Field Hospitals & Logistics</p>
            <h1 className={styles.title}>Global Medical Operations</h1>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.container}>
            <BureaucraticHeader documentRef="OP-2026-X8" department="Medical Services Division" />

            <div className={styles.layout}>
              {/* Sidebar Filters */}
              <aside className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>Operations Filter</h3>
                
                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Region</span>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Africa</label>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Middle East</label>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Europe</label>
                </div>

                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Facility Type</span>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Level I Clinic</label>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Level II Hospital</label>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Level III Hospital</label>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Logistics Hub</label>
                </div>

                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Threat Level</span>
                  <label className={styles.checkboxRow}><input type="checkbox" /> Extreme (Active Conflict)</label>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> High (Hardship)</label>
                  <label className={styles.checkboxRow}><input type="checkbox" defaultChecked /> Standard</label>
                </div>
                
                <button style={{ width: '100%', padding: '0.5rem', backgroundColor: '#005bbb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Apply Filters
                </button>
              </aside>

              {/* Main Operations Blocks */}
              <div style={{ flex: 1 }}>
                <div className={styles.grid}>
                  <article className={styles.opsBlock}>
                    <header className={styles.opsHeader}>
                      <Stethoscope size={24} className={styles.opsIcon} />
                      <h2 className={styles.opsTitle}>Level I Clinics</h2>
                    </header>
                    <div className={styles.opsBody}>
                      <p className={styles.opsDesc}>
                        Forward-deployed primary care and trauma stabilization units operating directly alongside peacekeeping battalions and within major UN operational hubs worldwide.
                      </p>
                      <ul className={styles.opsList}>
                        <li><span>Active Units:</span> <strong>85+ Globally</strong></li>
                        <li><span>Core Capability:</span> <strong>ATLS / Primary Care</strong></li>
                        <li><span>Patient Hold:</span> <strong>Max 48 hours</strong></li>
                      </ul>
                    </div>
                  </article>

                  <article className={styles.opsBlock}>
                    <header className={styles.opsHeader}>
                      <HeartPulse size={24} className={styles.opsIcon} />
                      <h2 className={styles.opsTitle}>Level II & III Hospitals</h2>
                    </header>
                    <div className={styles.opsBody}>
                      <p className={styles.opsDesc}>
                        Advanced surgical, diagnostic, and intensive care facilities located in regional hubs. These facilities manage all acute surgical referrals and complex medical cases from deep-field deployments.
                      </p>
                      <ul className={styles.opsList}>
                        <li><span>Active Units:</span> <strong>35+ Globally</strong></li>
                        <li><span>Core Capability:</span> <strong>Damage Control Surgery / ICU</strong></li>
                        <li><span>Locations:</span> <strong>Major Mission HQs</strong></li>
                      </ul>
                    </div>
                  </article>

                  <article className={styles.opsBlock}>
                    <header className={styles.opsHeader}>
                      <Truck size={24} className={styles.opsIcon} />
                      <h2 className={styles.opsTitle}>Global Medical Logistics</h2>
                    </header>
                    <div className={styles.opsBody}>
                      <p className={styles.opsDesc}>
                        The backbone of the medical mission, ensuring cold-chain integrity for vaccines, managing global stockpiles of PPE, and maintaining continuous supply lines in extreme environments.
                      </p>
                      <ul className={styles.opsList}>
                        <li><span>Hub Locations:</span> <strong>Brindisi, Entebbe, Valencia</strong></li>
                        <li><span>Cold Chain:</span> <strong>End-to-end global compliance</strong></li>
                        <li><span>Resupply Cycle:</span> <strong>Strategic airlifts</strong></li>
                      </ul>
                    </div>
                  </article>

                  <article className={styles.opsBlock}>
                    <header className={styles.opsHeader}>
                      <Plane size={24} className={styles.opsIcon} />
                      <h2 className={styles.opsTitle}>Aero-Medical Evacuation</h2>
                    </header>
                    <div className={styles.opsBody}>
                      <p className={styles.opsDesc}>
                        Dedicated global rotary and fixed-wing assets configured for in-flight intensive care, coordinating rapid extraction of critical casualties across international borders.
                      </p>
                      <ul className={styles.opsList}>
                        <li><span>Response Framework:</span> <strong>24/7 Global Dispatch</strong></li>
                        <li><span>Assets:</span> <strong>Chartered Air Ambulances</strong></li>
                        <li><span>Partners:</span> <strong>Level IV Hospitals</strong></li>
                      </ul>
                    </div>
                  </article>
                </div>

                <section className={styles.mapSection}>
                  <h2>Global Operational Footprint</h2>
                  <p style={{ color: '#555', marginBottom: '2rem' }}>
                    Live tracking of active Level I-III facilities and logistics hubs. Map data syncs automatically with regional command centers.
                  </p>
                  <OperationsMap />
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
