import { useState } from 'react';
import styles from '../page.module.css';
import Button from '@/components/Button';

export default function LoginForm({ onLogin, authStatus }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(username, password);
    setIsLoading(false);
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.loginCard}>
        <h2>Operations Admin</h2>
        <p className={styles.desc}>Sign in to manage leave relief applications.</p>
        
        {authStatus && (
          <div className={authStatus.isError ? styles.statusError : styles.statusInfo}>
            {authStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          <Button type="submit" variant="primary" disabled={isLoading} className={styles.fullWidthBtn}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
