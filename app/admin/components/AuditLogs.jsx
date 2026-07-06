import { FilePenLine, Inbox } from 'lucide-react';
import styles from '../page.module.css';
import { formatStatus, formatDateTime } from '../utils';

export default function AuditLogs({ audit }) {
  if (!audit || audit.length === 0) {
    return (
      <div className={styles.auditView}>
        <h2>Audit Log</h2>
        <div className={styles.emptyState}>No audit events yet.</div>
      </div>
    );
  }

  return (
    <div className={styles.auditView}>
      <h2>Audit Log</h2>
      <div className={styles.auditList}>
        {audit.slice(0, 30).map(event => (
          <article key={event.id} className={styles.auditEvent}>
            <span className={styles.auditIcon} aria-hidden="true">
              {event.event === "APPLICATION_UPDATED" ? <FilePenLine size={20} /> : <Inbox size={20} />}
            </span>
            <div className={styles.auditDetails}>
              <strong>{formatStatus(event.event)}</strong>
              <span>{event.reference} | {event.actor}</span>
            </div>
            <time className={styles.auditTime}>{formatDateTime(event.at)}</time>
          </article>
        ))}
      </div>
    </div>
  );
}
