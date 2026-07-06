'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PanelLeft, LogOut, RefreshCw, LayoutDashboard, Settings, ScrollText, X } from 'lucide-react';
import Button from '@/components/Button';
import styles from './page.module.css';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import FeeSettings from './components/FeeSettings';
import PaymentSettings from './components/PaymentSettings';
import AuditLogs from './components/AuditLogs';

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [applications, setApplications] = useState([]);
  const [audit, setAudit] = useState([]);
  const [feeSettings, setFeeSettings] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [adminStatus, setAdminStatus] = useState("");

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchWithAuth = useCallback(async (path, options = {}) => {
    if (!session?.csrfToken) throw new Error("Sign in to the operations dashboard first.");
    const response = await fetch(path, {
      ...options,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "X-CSRF-Token": session.csrfToken,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setSession(false);
      }
      throw new Error(result.error || result.errors?.join(" ") || "Request failed.");
    }
    return result;
  }, [session]);

  const loadData = useCallback(async () => {
    try {
      setAdminStatus("Loading operations queue...");
      const [appData, feeData, paymentData] = await Promise.all([
        fetchWithAuth('/api/leave-applications'),
        fetchWithAuth('/api/fee-settings'),
        fetchWithAuth('/api/payment-settings')
      ]);
      setApplications(appData.applications || []);
      setAudit(appData.audit || []);
      setFeeSettings(feeData.feeSettings || null);
      setPaymentSettings(paymentData.paymentSettings || null);
      setAdminStatus(`Loaded ${appData.applications?.length || 0} applications.`);
    } catch (err) {
      setAdminStatus("Failed to load data.");
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          credentials: "same-origin",
          headers: { Accept: "application/json" }
        });
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          setSession(false);
        }
      } catch (err) {
        setSession(false);
      }
      setIsLoading(false);
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session, loadData]);

  const handleLogin = async (username, password) => {
    setAuthStatus({ message: "Checking credentials...", isError: false });
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.errors?.join(" ") || "Login failed");
      
      localStorage.removeItem("dwb-admin-token");
      setSession(data);
      setAuthStatus(null);
    } catch (err) {
      setAuthStatus({ message: err.message, isError: true });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {}
    setSession(false);
    setApplications([]);
    setAudit([]);
    setFeeSettings(null);
    setPaymentSettings(null);
  };

  const handleSaveReview = async (id, data) => {
    try {
      await fetchWithAuth(`/api/leave-applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      await loadData();
    } catch (err) {
      alert(`Error saving review: ${err.message}`);
    }
  };

  const handleIssuePaymentRequest = async (id) => {
    try {
      await fetchWithAuth(`/api/leave-applications/${id}/payment-request`, {
        method: 'POST'
      });
      await loadData();
    } catch (err) {
      alert(`Error issuing payment request: ${err.message}`);
    }
  };

  const handleSaveSettings = async (data) => {
    try {
      await fetchWithAuth('/api/fee-settings', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      await loadData();
    } catch (err) {
      throw err;
    }
  };

  const handleSavePaymentSettings = async (data) => {
    try {
      await fetchWithAuth('/api/payment-settings', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      await loadData();
    } catch (err) {
      throw err;
    }
  };

  if (isLoading) {
    return <div className={styles.loadingScreen}>Loading session...</div>;
  }

  if (!session) {
    return <LoginForm onLogin={handleLogin} authStatus={authStatus} />;
  }

  return (
    <div className={`${styles.adminLayout} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <aside className={styles.adminSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <div className={styles.mark}>UN</div>
            <span>Leave Relief Ops</span>
          </div>
          <button className={styles.mobileClose} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className={styles.sidebarNav}>
          <button className={`${styles.navLink} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className={`${styles.navLink} ${activeTab === 'settings' ? styles.active : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Fee Settings
          </button>
          <button className={`${styles.navLink} ${activeTab === 'paymentSettings' ? styles.active : ''}`} onClick={() => setActiveTab('paymentSettings')}>
            <Settings size={20} /> Payment Settings
          </button>
          <button className={`${styles.navLink} ${activeTab === 'audit' ? styles.active : ''}`} onClick={() => setActiveTab('audit')}>
            <ScrollText size={20} /> Audit Logs
          </button>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.sessionInfo}>
            <strong>{session.admin?.name || "Operations admin"}</strong>
            <span>{session.admin?.role || "Leave relief operations"}</span>
          </div>
        </div>
      </aside>

      <main className={styles.adminMain}>
        <header className={styles.adminHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
              <PanelLeft size={20} />
            </button>
            <span className={styles.adminStatus}>{adminStatus}</span>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.headerBtn} onClick={loadData} title="Refresh data">
              <RefreshCw size={18} />
            </button>
            <button className={styles.headerBtn} onClick={handleLogout} title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              applications={applications} 
              onSaveReview={handleSaveReview}
              onIssuePaymentRequest={handleIssuePaymentRequest}
            />
          )}
          {activeTab === 'settings' && (
            <FeeSettings 
              feeSettings={feeSettings} 
              onSaveSettings={handleSaveSettings}
            />
          )}
          {activeTab === 'paymentSettings' && (
            <PaymentSettings 
              paymentSettings={paymentSettings} 
              onSaveSettings={handleSavePaymentSettings}
            />
          )}
          {activeTab === 'audit' && (
            <AuditLogs audit={audit} />
          )}
        </div>
      </main>
    </div>
  );
}
