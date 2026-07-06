import { useState } from 'react';
import { ChevronDown, Save, Zap, ReceiptText, Check, Circle } from 'lucide-react';
import Button from '@/components/Button';
import styles from '../page.module.css';
import {
  escapeHtml,
  formatStatus,
  formatDate,
  formatDateTime,
  formatMoney,
  statusClass,
  paymentClass,
  progressClass,
  urgencyLabel,
  statusOptions,
  paymentOptions,
  statusSteps
} from '../utils';

export default function ApplicationCard({ application, isOpen, onToggle, onSaveReview, onIssuePaymentRequest }) {
  const urgency = urgencyLabel(application);
  const submitted = `${formatDate(application.createdAt)} at ${new Date(application.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const leaveWindow = `${application.days} days from ${formatDate(application.startDate)}`;

  const [adminNotes, setAdminNotes] = useState(application.adminNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveReview(application.id, { status: application.status, paymentStatus: application.paymentStatus, adminNotes });
    setIsSaving(false);
  };

  const handleIssue = async () => {
    setIsIssuing(true);
    await onIssuePaymentRequest(application.id);
    setIsIssuing(false);
  };

  const coverageDone = statusSteps.indexOf(application.status) >= statusSteps.indexOf("COVERAGE_MATCHED");
  const paymentDone = ["PAID", "WAIVED"].includes(application.paymentStatus);
  const travelDone = application.status === "APPROVED_FOR_TRAVEL" || application.status === "CLOSED";
  const closedDone = ["APPROVED_FOR_TRAVEL", "CLOSED"].includes(application.status);

  return (
    <details 
      className={styles.applicationCard} 
      open={isOpen} 
      onToggle={(e) => onToggle(application.id, e.target.open)}
    >
      <summary className={styles.applicationCardSummary}>
        <div className={styles.applicationCardHeader}>
          <div>
            <div className={styles.referenceRow}>
              <span className={`${styles.statusPill} ${styles.statusRed}`}>{application.reference}</span>
              <span className={`${styles.urgencyPill} ${styles[urgency.className]}`}>{urgency.label}</span>
            </div>
            <h3>{application.doctor}</h3>
            <p>{application.roleLabel} | {application.station}</p>
            <div className={styles.applicationBadges}>
              <span className={`${styles.statusBadge} ${styles[statusClass(application.status)]}`}>{formatStatus(application.status)}</span>
              <span className={`${styles.statusBadge} ${styles[paymentClass(application.paymentStatus)]}`}>{formatStatus(application.paymentStatus)}</span>
            </div>
          </div>
          <div className={styles.applicationSummarySide}>
            <div className={styles.applicationTotal}>
              <strong>{formatMoney(application.costs.total)}</strong>
              <span>{leaveWindow}</span>
            </div>
            <span className={styles.accordionIndicator} aria-hidden="true">
              <ChevronDown size={20} />
            </span>
          </div>
        </div>
        <div className={styles.progressTrack} aria-label="Application progress">
          <span className={`${styles.progressFill} ${styles[progressClass(application.status)]}`}></span>
        </div>
      </summary>

      <div className={styles.applicationDetailPanel}>
        <div className={styles.applicationMeta}>
          <div>
            <span>Applicant</span>
            <strong>{application.applicant}</strong>
            <small>{application.email}</small>
            <small>Doctor: {application.doctorEmail || 'N/A'}</small>
          </div>
          <div>
            <span>Field pressure</span>
            <strong>{application.zoneLabel}</strong>
            <small>{application.travel ? "Travel coordination included" : "No travel coordination"}</small>
          </div>
          <div>
            <span>Submitted</span>
            <strong>{submitted}</strong>
            <small>Updated {formatDateTime(application.updatedAt)}</small>
          </div>
          <div>
            <span>Coverage estimate</span>
            <strong>{formatMoney(application.costs.coverage)}</strong>
            <small>Reserve {formatMoney(application.costs.reserve)}</small>
          </div>
        </div>

        <div className={styles.opsChecklist} aria-label="Operational readiness">
          <span className={coverageDone ? styles.isDone : ""}>{coverageDone ? <Check size={16} /> : <Circle size={16} />} Coverage</span>
          <span className={paymentDone ? styles.isDone : ""}>{paymentDone ? <Check size={16} /> : <Circle size={16} />} Payment</span>
          <span className={travelDone ? styles.isDone : ""}>{travelDone ? <Check size={16} /> : <Circle size={16} />} Movement</span>
          <span className={closedDone ? styles.isDone : ""}>{closedDone ? <Check size={16} /> : <Circle size={16} />} Handover</span>
        </div>

        <div className={`${styles.costPanel} ${styles.compactCosts}`}>
          <div><span>Coverage</span><strong>{formatMoney(application.costs.coverage)}</strong></div>
          <div><span>Handover</span><strong>{formatMoney(application.costs.handover)}</strong></div>
          <div><span>Travel</span><strong>{formatMoney(application.costs.travelCoordination)}</strong></div>
          <div><span>Reserve</span><strong>{formatMoney(application.costs.reserve)}</strong></div>
        </div>

        <PaymentRequestPanel application={application} />

        <div className={styles.adminControls} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>Current Stage: {formatStatus(application.status)}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                {application.status === 'RECEIVED' && 'Application received. Review field details before matching coverage.'}
                {application.status === 'COVERAGE_REVIEW' && 'Find an operational replacement match for this doctor.'}
                {application.status === 'COVERAGE_MATCHED' && 'Coverage secured. Issue a payment request to the applicant.'}
                {application.status === 'PAYMENT_PENDING' && (application.paymentStatus === 'PAID' ? 'Payment received. Ready for travel approval.' : 'Waiting for payment. Mark as paid once received.')}
                {application.status === 'APPROVED_FOR_TRAVEL' && 'Travel approved. Close application once handover is complete.'}
                {['DECLINED', 'REFUNDED', 'CLOSED'].includes(application.status) && 'This application is no longer active.'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {application.status === 'RECEIVED' && (
                <Button variant="primary" onClick={() => onSaveReview(application.id, { status: 'COVERAGE_REVIEW', paymentStatus: application.paymentStatus, adminNotes })}>
                  Begin Coverage Review
                </Button>
              )}
              
              {application.status === 'COVERAGE_REVIEW' && (
                <Button variant="primary" onClick={() => onSaveReview(application.id, { status: 'COVERAGE_MATCHED', paymentStatus: application.paymentStatus, adminNotes })}>
                  Confirm Coverage Matched
                </Button>
              )}
              
              {application.status === 'COVERAGE_MATCHED' && (
                <Button variant="primary" onClick={handleIssue} disabled={isIssuing}>
                  <ReceiptText size={16} /> {isIssuing ? 'Issuing...' : 'Issue Payment Request'}
                </Button>
              )}
              
              {application.status === 'PAYMENT_PENDING' && application.paymentStatus !== 'PAID' && (
                <Button variant="primary" onClick={() => onSaveReview(application.id, { status: application.status, paymentStatus: 'PAID', adminNotes })}>
                  Mark Invoice as Paid
                </Button>
              )}
              
              {application.status === 'PAYMENT_PENDING' && application.paymentStatus === 'PAID' && (
                <Button variant="primary" onClick={() => onSaveReview(application.id, { status: 'APPROVED_FOR_TRAVEL', paymentStatus: application.paymentStatus, adminNotes })}>
                  <Check size={16} /> Approve for Travel
                </Button>
              )}
              
              {application.status === 'APPROVED_FOR_TRAVEL' && (
                <Button variant="primary" onClick={() => onSaveReview(application.id, { status: 'CLOSED', paymentStatus: application.paymentStatus, adminNotes })}>
                  Close Application
                </Button>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              Terminate / Override: 
              <select 
                className={styles.selectField} 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
                value=""
                onChange={(e) => {
                  if(e.target.value && confirm(`Are you sure you want to change status to ${e.target.value}?`)) {
                    onSaveReview(application.id, { status: e.target.value, paymentStatus: application.paymentStatus, adminNotes });
                  }
                }}
              >
                <option value="">Select override...</option>
                <option value="DECLINED">Decline Application</option>
                <option value="REFUNDED">Refund Application</option>
                <option value="CLOSED">Close Application</option>
              </select>
            </label>
          </div>
        </div>

        <label className={styles.notesField}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span>Operations notes</span>
            <Button variant="outline" onClick={handleSave} disabled={isSaving} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
              <Save size={14} style={{ marginRight: '0.25rem' }}/> {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
          <textarea 
            className={styles.textareaField}
            rows="3" 
            maxLength="1600" 
            placeholder="Coverage match, payment notes, handover risks"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        </label>

        {application.familyNotes && (
          <details className={styles.familyNote}>
            <summary>Family context</summary>
            <p>{application.familyNotes}</p>
          </details>
        )}
      </div>
    </details>
  );
}

function PaymentRequestPanel({ application }) {
  const request = application.paymentRequest;
  if (!request) {
    return (
      <div className={`${styles.paymentRequestPanel} ${styles.isEmpty}`}>
        <div>
          <span>Payment request</span>
          <strong>No payment request issued</strong>
        </div>
        <p>Issue a request after coverage review so the family can choose card, bank, mobile money, or crypto settlement.</p>
      </div>
    );
  }

  return (
    <div className={styles.paymentRequestPanel}>
      <div className={styles.paymentRequestHeader}>
        <div>
          <span>Payment request</span>
          <strong>{request.reference}</strong>
          <small>{request.status} | Expires {formatDate(request.expiresAt)}</small>
        </div>
        <div className={styles.applicationTotal}>
          <strong>{formatMoney(request.amount)}</strong>
          <span>{request.currency}</span>
        </div>
      </div>
      <p>{request.settlementNote}</p>
      
      {request.proof && (
        <div style={{ marginTop: '1rem', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ color: '#0369a1', display: 'block' }}>Applicant Uploaded Proof of Payment</strong>
            <small style={{ color: '#0c4a6e' }}>Uploaded at: {formatDateTime(request.proof.uploadedAt)}</small>
          </div>
          <a 
            href={request.proof.fileUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{ padding: '0.5rem 1rem', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
          >
            View Document
          </a>
        </div>
      )}

      <div className={styles.paymentMethodGrid}>
        {(request.methods || []).map((m, i) => <PaymentMethod key={i} method={m} />)}
      </div>
    </div>
  );
}

function PaymentMethod({ method }) {
  const isCrypto = method.key === "crypto";
  return (
    <article className={styles.paymentMethodCard}>
      <div>
        <span className={`${styles.statusBadge} ${styles.statusTeal}`}>{method.key}</span>
        <h4>{method.label}</h4>
        <p>{method.instructions || method.settlement}</p>
      </div>
      
      {isCrypto ? (
        <div className={styles.paymentMethodAssets}>
          {(method.assets || []).map((asset, i) => (
            <div key={i}>
              <span>{asset.asset} / {asset.network}</span>
              <strong>{asset.address}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.paymentMethodFields}>
          {method.provider && <div><span>Provider</span><strong>{method.provider}</strong></div>}
          {method.checkoutUrl && <div><span>Checkout</span><strong>{method.checkoutUrl}</strong></div>}
          {method.accountName && <div><span>Account</span><strong>{method.accountName}</strong></div>}
          {method.bankName && <div><span>Bank</span><strong>{method.bankName}</strong></div>}
          {method.iban && <div><span>IBAN</span><strong>{method.iban}</strong></div>}
          {method.swift && <div><span>SWIFT</span><strong>{method.swift}</strong></div>}
          {method.providers && <div><span>Mobile routes</span><strong>{method.providers}</strong></div>}
          {method.contact && <div><span>Contact</span><strong>{method.contact}</strong></div>}
        </div>
      )}
    </article>
  );
}
