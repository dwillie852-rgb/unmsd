'use client';

import Link from 'next/link';
import styles from './Button.module.css';

export default function Button({ 
  children, 
  href, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) {
  const classes = `${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''} ${className}`;
  
  if (href) {
    if (href.startsWith('http') || href.startsWith('#')) {
      return (
        <a href={href} className={classes} {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
