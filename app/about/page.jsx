import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function About() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>United Nations Medical Services Division</p>
            <h1 className={styles.title}>Global Mandate & Occupational Health</h1>
          </div>
        </header>

        <section className={styles.content}>
          <article className={styles.article}>
            <p>
              The United Nations Medical Services Division (UNMSD) operates under a strict mandate to provide impartial, high-quality medical care, formulate occupational safety policies, and govern the clinical standards for all deployed personnel across the global UN system.
            </p>

            <div className={styles.highlightBox}>
              <h3>Core Principle: Global Medical Independence</h3>
              <p style={{ marginBottom: 0 }}>
                Our clinical and public health decisions are made independently of political or economic interests. Medical interventions and safety protocols are prioritized strictly by clinical urgency and epidemiological data, adhering to international humanitarian law and the core principles of medical ethics worldwide.
              </p>
            </div>

            <h2>History of the Division</h2>
            <p>
              Established to ensure the health and safety of UN staff navigating the world's most complex environments, the UNMSD has continuously scaled its operations. From setting up the first dedicated peacekeeping field clinics to managing the massive logistical challenges of the COVID-19 pandemic across 193 member states, the division has evolved into a comprehensive global healthcare governance body.
            </p>
            <p>
              The division oversees a vast architecture of over 120 Level I, II, and III field hospitals, coordinating aero-medical evacuations globally, managing mass casualty events, and sustaining daily primary and occupational care for hundreds of thousands of peacekeepers, civilian staff, and affiliated personnel.
            </p>

            <h2>Command & Coordination Structure</h2>
            <p>
              The Medical Services Division operates under a centralized governance structure with decentralized, regional execution to ensure both global standardization and localized agility:
            </p>
            <ul>
              <li><strong>Director, Medical Services:</strong> Holds ultimate clinical authority over all global medical deployments, treatment protocols, and high-level medical evacuations.</li>
              <li><strong>Force Medical Officers (FMO):</strong> Coordinate the deployment of military medical assets (e.g., Troop Contributing Country field hospitals) in active peacekeeping theaters in alignment with UNMSD clinical directives.</li>
              <li><strong>Chief Medical Officers (CMO):</strong> Oversee the day-to-day clinical operations and public health surveillance for specific country-level missions or regional hubs.</li>
              <li><strong>Global Medical Logistics (MedLog):</strong> Manages the secure, cold-chain distribution of pharmaceuticals, surgical supplies, and vaccines across international borders.</li>
            </ul>

            <h2>Ethical Framework & Occupational Safety</h2>
            <p>
              All personnel operating under UNMSD are bound by a rigid ethical framework that guarantees patient confidentiality, informed consent, and protection against discrimination. Furthermore, the division actively enforces the Occupational Safety and Health (OSH) framework, monitoring workplace hazards and implementing resilience strategies for staff operating in high-stress zones globally.
            </p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
