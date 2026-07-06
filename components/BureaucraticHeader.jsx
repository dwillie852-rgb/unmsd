export default function BureaucraticHeader({
  documentRef,
  classification = "UNCLASSIFIED",
  department = "UNMSD",
  date = new Date().toLocaleDateString('en-GB')
}) {
  return (
    <div style={{
      borderBottom: '2px solid #111',
      paddingBottom: '0.75rem',
      marginBottom: '2rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1.5rem',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      color: '#333'
    }}>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <strong style={{ display: 'block', color: '#777', fontSize: '0.75rem', textTransform: 'uppercase' }}>Department</strong>
          {department}
        </div>
        <div>
          <strong style={{ display: 'block', color: '#777', fontSize: '0.75rem', textTransform: 'uppercase' }}>Document Ref</strong>
          {documentRef}
        </div>
        <div>
          <strong style={{ display: 'block', color: '#777', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date Issued</strong>
          {date}
        </div>
      </div>
      <div>
        <span style={{
          backgroundColor: classification === 'UNCLASSIFIED' ? '#e8f5e9' : '#ffebee',
          color: classification === 'UNCLASSIFIED' ? '#2e7d32' : '#c62828',
          border: `1px solid ${classification === 'UNCLASSIFIED' ? '#2e7d32' : '#c62828'}`,
          padding: '0.25rem 0.75rem',
          fontWeight: 'bold',
          letterSpacing: '0.05em'
        }}>
          {classification}
        </span>
      </div>
    </div>
  );
}
