export default function StatusBadge({ status }) {
  const statusMap = {
    pending: { label: 'Pending', className: 'badge-warning' },
    approved: { label: 'Approved', className: 'badge-info' },
    rejected: { label: 'Rejected', className: 'badge-danger' },
    borrowed: { label: 'Borrowed', className: 'badge-purple' },
    returned: { label: 'Returned', className: 'badge-success' },
    overdue: { label: 'Overdue', className: 'badge-danger' },
    cancelled: { label: 'Cancelled', className: 'badge-muted' },
    completed: { label: 'Completed', className: 'badge-success' },
  };

  const info = statusMap[status] || { label: status, className: 'badge-muted' };

  return (
    <span className={`status-badge ${info.className}`}>
      {info.label}
    </span>
  );
}
