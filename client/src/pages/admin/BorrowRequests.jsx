import { useState, useEffect } from 'react';
import { borrowAPI } from '../../services/api.js';
import { ClipboardList, X, MessageSquare, Search, UserRound, Mail, Clock3 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { loadRequests(); }, [page, filterStatus, filterPriority]);

  const loadRequests = async () => {
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const { data } = await borrowAPI.getAll(params);
      setRequests(data.requests);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await borrowAPI.updateStatus(id, status, adminNote);
      toast.success(`Request ${status}`);
      setNoteModal(null);
      setAdminNote('');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const openNoteModal = (request, status) => {
    setNoteModal({ request, status });
    setAdminNote('');
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading requests...</p></div>;
  }

  return (
    <div className="requests-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrow tickets</h1>
          <p className="page-subtitle">A support queue for equipment access requests</p>
        </div>
      </div>

      <div className="ticket-toolbar">
        <div className="ticket-search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets, names, or items" />
        </div>
        <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }} aria-label="Filter by priority">
          <option value="">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </div>

      <div className="filter-bar ticket-status-bar">
        <div className="filter-tabs">
          {['', 'pending', 'open', 'closed'].map(s => (
            <button
              key={s}
              className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
              onClick={() => { setFilterStatus(s); setPage(1); }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {requests.filter((r) => {
        const value = `${r.ticket_number || ''} ${r.student_name || ''} ${r.student_id || ''} ${r.items?.name || ''}`.toLowerCase();
        return value.includes(search.toLowerCase());
      }).length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>No requests found</h3>
          <p>{filterStatus ? `No ${filterStatus} requests.` : 'No borrow requests yet.'}</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Ticket</th><th>Requester</th><th>Request</th><th>Dates</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {requests.filter((r) => {
                  const value = `${r.ticket_number || ''} ${r.student_name || ''} ${r.student_id || ''} ${r.items?.name || ''}`.toLowerCase();
                  return value.includes(search.toLowerCase());
                }).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="ticket-number">{r.ticket_number || `BR-${r.id.slice(0, 8).toUpperCase()}`}</span>
                      <span className="text-muted text-sm">Opened {format(new Date(r.created_at), 'MMM d, yyyy')}</span>
                    </td>
                    <td><div className="cell-stack"><span className="fw-500"><UserRound size={14} /> {r.student_name}</span><span className="text-muted text-sm">{r.requester_type || 'student'} · {r.department || r.student_department || '—'} · {r.student_id}</span></div></td>
                    <td><div className="cell-stack"><span className="fw-500">{r.ticket_category?.replace('_', ' ') || 'borrow'}{r.items?.name ? ` · ${r.items.name} × ${r.quantity}` : ''}</span><span className="text-muted text-sm purpose-cell">{r.purpose?.substring(0, 45) || 'No purpose provided'}{r.purpose?.length > 45 ? '...' : ''}</span></div></td>
                    <td><div className="cell-stack"><span>{format(new Date(r.borrow_date), 'MMM d, yyyy')}</span><span className="text-muted text-sm">Due {format(new Date(r.expected_return_date), 'MMM d, yyyy')}</span></div></td>
                    <td><span className={`priority-badge ${r.priority || 'medium'}`}>{r.priority || 'medium'}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="icon-btn info"
                          onClick={() => openNoteModal(r, r.status === 'closed' ? 'open' : r.status || 'open')}
                          title="Reply by email"
                        >
                          <Mail size={16} />
                        </button>
                        {r.status !== 'closed' && (
                            <button
                              className="icon-btn danger"
                              onClick={() => openNoteModal(r, 'closed')}
                              title="Close ticket"
                            >
                              <X size={16} />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Admin Note Modal */}
      <Modal
        isOpen={!!noteModal}
        onClose={() => setNoteModal(null)}
        title={`${noteModal?.status === 'closed' ? 'Close' : 'Reply to'} Ticket`}
        size="lg"
      >
        <div className="modal-form">
          <div className="ticket-reply-summary">
            <div>
              <span className="ticket-reply-label">Requester</span>
              <strong>{noteModal?.request?.student_name}</strong>
              <a href={`mailto:${noteModal?.request?.student_email}`}><Mail size={14} /> {noteModal?.request?.student_email}</a>
            </div>
            <div className="ticket-reply-meta">
              <span className="ticket-number">{noteModal?.request?.ticket_number}</span>
              <span><Clock3 size={14} /> {noteModal?.request?.ticket_category?.replaceAll('_', ' ') || 'support request'}</span>
              <StatusBadge status={noteModal?.request?.status} />
            </div>
          </div>
          <div className="form-group">
            <label><MessageSquare size={16} /> {noteModal?.status === 'closed' ? 'Closing note' : 'Email reply'} *</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Write the response that will be emailed to the requester..."
              rows={3}
              required
            />
            <span className="form-hint">The requester will receive this message at {noteModal?.request?.student_email}.</span>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setNoteModal(null)}>Cancel</button>
            <button
              className={`btn ${noteModal?.status === 'closed' ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => updateStatus(noteModal.request.id, noteModal.status)}
              disabled={!adminNote.trim()}
            >
              <Mail size={16} /> {noteModal?.status === 'closed' ? 'Close and email' : 'Send email reply'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
