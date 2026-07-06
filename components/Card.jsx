import styles from './Card.module.css';

export default function Card({ children, interactive = false, className = '' }) {
  return (
    <div className={`${styles.card} ${interactive ? styles.interactive : ''} ${className}`}>
      {children}
    </div>
  );
}
