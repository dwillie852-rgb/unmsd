import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Global Hero Section */}
        <section className={styles.hero} id="home">
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>
              United Nations Peace Operations
            </p>
            <h1 className={styles.heroTitle}>
              Medical Services Division
            </h1>
            <p className={styles.heroDesc}>
              Ensuring the health, safety, and well-being of all United Nations personnel worldwide. Coordinating global medical policy, field operations, and occupational health standards.
            </p>
            <div className={styles.heroActions}>
              <Link href="#advisories" className={styles.primaryBtn}>
                Health Advisories
              </Link>
              <Link href="/operations" className={styles.outlineBtn}>
                Global Field Operations
              </Link>
            </div>
          </div>
        </section>

        {/* Formal Advisory Ticker */}
        <section className={styles.advisorySection} id="advisories">
          <div className={styles.advisoryBanner}>
            <span className={styles.advisoryLabel}>Health Alert</span>
            <div className={styles.advisoryText}>
              Updated protocols for deployed personnel regarding seasonal outbreaks in the African Region. <Link href="/data">Read the full epidemiological report</Link>.
            </div>
          </div>
        </section>

        {/* Core Pillars of Service */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>Core Mandate & Services</h2>
              <p>
                The UNMSD is tasked with a comprehensive mandate spanning operational deployment, policy making, and direct personnel care across the globe.
              </p>
            </div>
            
            <div className={styles.editorialGrid}>
              <article className={styles.editorialBlock}>
                <h3 className={styles.editorialTitle}>Global Field Operations</h3>
                <p className={styles.editorialDesc}>
                  Standardization and oversight of Level I, II, and III medical facilities across all active UN peacekeeping and political missions, ensuring continuous operational readiness in high-risk zones.
                </p>
                <Link href="/operations" className={styles.editorialLink}>
                  View Operations <ArrowRight size={16} style={{ marginLeft: '4px' }} />
                </Link>
              </article>
              
              <article className={styles.editorialBlock}>
                <h3 className={styles.editorialTitle}>Occupational Safety</h3>
                <p className={styles.editorialDesc}>
                  Developing global policies to mitigate workplace hazards and ensure secure, healthy environments for all UN staff members, from headquarters to remote duty stations.
                </p>
                <Link href="/about" className={styles.editorialLink}>
                  Read Policy <ArrowRight size={16} style={{ marginLeft: '4px' }} />
                </Link>
              </article>

              <article className={styles.editorialBlock}>
                <h3 className={styles.editorialTitle}>Mental Health Strategy</h3>
                <p className={styles.editorialDesc}>
                  Implementing psychosocial support frameworks, stress management protocols, and resilience training for personnel deployed in conflict and disaster environments.
                </p>
                <Link href="/staff" className={styles.editorialLink}>
                  Access Resources <ArrowRight size={16} style={{ marginLeft: '4px' }} />
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* Global Footprint */}
        <section className={styles.sectionAlt}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>Global Footprint & Impact</h2>
              <p>
                UNMSD coordinates health support for a massive, globally distributed workforce operating in some of the world's most challenging environments.
              </p>
            </div>

            <div className={styles.statsTable}>
              <div className={styles.statCell}>
                <div className={styles.statNum}>100K+</div>
                <div className={styles.statLabel}>Personnel Supported</div>
                <div className={styles.statDesc}>Civilian, military, and police staff relying on UN medical standards globally.</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statNum}>120+</div>
                <div className={styles.statLabel}>Field Hospitals</div>
                <div className={styles.statDesc}>Active UN-affiliated medical facilities in continuous operation worldwide.</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statNum}>193</div>
                <div className={styles.statLabel}>Member States</div>
                <div className={styles.statDesc}>Collaborating nations working to ensure global health security and logistics.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources & Quick Access */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <h2>Internal Portals & Resources</h2>
              <p>
                Direct access for active medical staff, administrative officers, and logistics coordinators.
              </p>
            </div>
            
            <div className={styles.editorialGrid}>
              <article className={styles.editorialBlock}>
                <h3 className={styles.editorialTitle}>Staff Care Portal</h3>
                <p className={styles.editorialDesc}>
                  Secure gateway for psychosocial support, clinical supervision, and leave relief administration for field doctors.
                </p>
                <Link href="/staff" className={styles.editorialLink}>
                  Login to Portal <ArrowRight size={16} style={{ marginLeft: '4px' }} />
                </Link>
              </article>
              
              <article className={styles.editorialBlock}>
                <h3 className={styles.editorialTitle}>Medical Logistics (MedLog)</h3>
                <p className={styles.editorialDesc}>
                  Global supply chain tracking for pharmaceuticals, cold-chain vaccines, and emergency trauma kits.
                </p>
                <Link href="/operations" className={styles.editorialLink}>
                  Track Shipments <ArrowRight size={16} style={{ marginLeft: '4px' }} />
                </Link>
              </article>
              
              <article className={styles.editorialBlock}>
                <h3 className={styles.editorialTitle}>Health Data Hub</h3>
                <p className={styles.editorialDesc}>
                  Access the latest epidemiological reports, mission capacity metrics, and regional outbreak tracking data.
                </p>
                <Link href="/data" className={styles.editorialLink}>
                  View Analytics <ArrowRight size={16} style={{ marginLeft: '4px' }} />
                </Link>
              </article>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
