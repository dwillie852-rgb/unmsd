'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, UserCircle } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'Mandate' },
    { href: '/operations', label: 'Field Operations' },
    { href: '/data', label: 'Health Data' },
  ];

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.unTopBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={14} />
          <span>Welcome to the United Nations</span>
        </div>
        <a href="https://www.un.org">UN.org</a>
      </div>

      <header className={styles.mainHeader}>
        <Link href="/" className={styles.brand}>
          <div className={styles.brandMark}>
            <span className={styles.brandBadge}>UN</span>
            <span className={styles.brandText}>Medical Services Division</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`${styles.link} ${pathname === link.href ? styles.linkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
            <Link href="/staff" className={styles.staffPortalBtn}>
              <UserCircle size={16} />
              Staff Care
            </Link>
          </div>
        </nav>

        <button 
          className={styles.toggle}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {isOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileLinkActive : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <Link 
              href="/staff" 
              className={styles.mobileLink} 
              style={{ color: 'var(--color-un-blue)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}
            >
              Staff Care Portal
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
