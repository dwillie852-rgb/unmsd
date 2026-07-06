import { useState, useMemo } from 'react';
import styles from '../page.module.css';
import ApplicationCard from './ApplicationCard';
import { 
  getFilteredApplications, 
  isActionNeeded, 
  isTravelReady, 
  formatMoney,
  statusOptions,
  paymentOptions
} from '../utils';

export default function Dashboard({ applications, onSaveReview, onIssuePaymentRequest }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");
  const [quickFilter, setQuickFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const queuePageSize = 5;

  const [openIds, setOpenIds] = useState(new Set());

  const handleToggle = (id, isOpen) => {
    const newIds = new Set(openIds);
    if (isOpen) newIds.add(id);
    else newIds.delete(id);
    setOpenIds(newIds);
  };

  // Reset page when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const filteredApplications = useMemo(() => {
    return getFilteredApplications(applications, {
      query: searchQuery,
      statusFilter,
      paymentFilter,
      quickFilter,
      sortFilter
    });
  }, [applications, searchQuery, statusFilter, paymentFilter, quickFilter, sortFilter]);

  const totalPages = Math.ceil(filteredApplications.length / queuePageSize) || 1;
  const paginatedApplications = filteredApplications.slice((currentPage - 1) * queuePageSize, currentPage * queuePageSize);

  // Stats
  const needsAction = applications.filter(isActionNeeded).length;
  const travelReady = applications.filter(isTravelReady).length;
  const paidOrEstimated = applications.reduce((sum, item) => sum + (item.costs?.total || 0), 0);

  return (
    <div className={styles.dashboardView}>
      <section className={styles.adminStats}>
        <article>
          <strong>{applications.length}</strong>
          <span>Total applications</span>
        </article>
        <article>
          <strong>{needsAction}</strong>
          <span>Needs action</span>
        </article>
        <article>
          <strong>{travelReady}</strong>
          <span>Travel ready</span>
        </article>
        <article>
          <strong>{formatMoney(paidOrEstimated)}</strong>
          <span>Paid or estimated fees</span>
        </article>
      </section>

      <section className={styles.queueControls}>
        <div className={styles.quickFilters}>
          <button 
            className={`${styles.buttonSecondary} ${quickFilter === 'all' ? styles.isActive : ''}`}
            onClick={() => handleFilterChange(setQuickFilter, 'all')}
          >All queue</button>
          <button 
            className={`${styles.buttonSecondary} ${quickFilter === 'action' ? styles.isActive : ''}`}
            onClick={() => handleFilterChange(setQuickFilter, 'action')}
          >Action needed</button>
          <button 
            className={`${styles.buttonSecondary} ${quickFilter === 'payment' ? styles.isActive : ''}`}
            onClick={() => handleFilterChange(setQuickFilter, 'payment')}
          >Payment open</button>
          <button 
            className={`${styles.buttonSecondary} ${quickFilter === 'travel' ? styles.isActive : ''}`}
            onClick={() => handleFilterChange(setQuickFilter, 'travel')}
          >Travel ready</button>
        </div>
        
        <div className={styles.detailedFilters}>
          <input 
            type="search" 
            placeholder="Search applicants, doctors, zones..." 
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            className={styles.inputField}
          />
          <select value={statusFilter} onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)} className={styles.selectField}>
            <option value="all">Any review status</option>
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e) => handleFilterChange(setPaymentFilter, e.target.value)} className={styles.selectField}>
            <option value="all">Any payment status</option>
            {paymentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={sortFilter} onChange={(e) => handleFilterChange(setSortFilter, e.target.value)} className={styles.selectField}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="startDate">Earliest leave window</option>
            <option value="highestCost">Highest cost estimate</option>
          </select>
        </div>
      </section>

      <div className={styles.applicationList}>
        {paginatedApplications.length === 0 ? (
          <div className={styles.emptyState}>No applications match the current filters.</div>
        ) : (
          paginatedApplications.map(app => (
            <ApplicationCard 
              key={app.id}
              application={app}
              isOpen={openIds.has(app.id)}
              onToggle={handleToggle}
              onSaveReview={onSaveReview}
              onIssuePaymentRequest={onIssuePaymentRequest}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.queuePagination}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`${styles.button} ${page === currentPage ? styles.buttonPrimary : styles.buttonSecondary}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
