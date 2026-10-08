import { useState, useEffect } from 'react';
import { authAPI, borrowAPI } from '../../services/api.js';
import { ClipboardList, X, MessageSquare, Search, UserRound, Mail, Clock3 } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BorrowRequests({ repliesOnly = false }) {
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [ticketTags, setTicketTags] = useState([]);

  useEffect(() => { loadRequests(); }, [page, filterStatus, filterPriority]);
  useEffect(() => { loadAgents(); }, []);
  useEffect(() => {
    const refreshTimer = setInterval(loadRequests, 30000);
    return () => clearInterval(refreshTimer);
  }, [page, filterStatus, filterPriority]);

  const loadAgents = async () => {
    try {
      const { data } = await authAPI.getAgents();
      setAgents(data);
    } catch (_err) {
      toast.error('Failed to load ticket agents');
    }
  };

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
      await borrowAPI.updateStatus(id, status, adminNote, ticketTags);
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
    setTicketTags(request.tags || []);
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading requests...</p></div>;
  }

  return (
    <div className="requests-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{repliesOnly ? 'Ticket replies' : 'Ticket requests'}</h1>
          <p className="page-subtitle">{repliesOnly ? 'Review requester conversations and send email replies' : 'A shared support queue for OJTees handling requester conversations'}</p>
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
        if (repliesOnly && !r.admin_notes) return false;
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
                <tr><th>Ticket</th><th>Requester</th><th>Request</th><th>Assigned agent</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {requests.filter((r) => {
                  if (repliesOnly && !r.admin_notes) return false;
                  const value = `${r.ticket_number || ''} ${r.student_name || ''} ${r.student_id || ''} ${r.items?.name || ''}`.toLowerCase();
                  return value.includes(search.toLowerCase());
                }).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="ticket-number">{r.ticket_number || `BR-${r.id.slice(0, 8).toUpperCase()}`}</span>
                      <span className="text-muted text-sm">Opened {format(new Date(r.created_at), 'MMM d, yyyy')}</span>
                    </td>
                    <td><div className="cell-stack"><span className="fw-500"><UserRound size={14} /> {r.student_name}</span><span className="text-muted text-sm">{r.requester_type || 'student'} · {r.department || r.student_department || '—'} · {r.student_id}</span></div></td>
                    <td><div className="cell-stack"><span className="fw-500">{r.ticket_category?.replace('_', ' ') || 'borrow'}{r.items?.name ? ` · ${r.items.name} × ${r.quantity}` : ''}</span><span className="text-muted text-sm purpose-cell">{r.purpose?.substring(0, 45) || 'No purpose provided'}{r.purpose?.length > 45 ? '...' : ''}</span>{r.admin_notes && <span className="ticket-conversation-preview" title={r.admin_notes}><MessageSquare size={12} /> {r.admin_notes.split(/\n+/).filter(Boolean).slice(-1)[0].substring(0, 54)}...</span>}{r.tags?.length > 0 && <span className="ticket-tags">{r.tags.map((tag) => <span className="ticket-tag" key={tag}>{tag}</span>)}</span>}</div></td>
                    <td>
                      <div className="cell-stack">
                        {r.assigned_to ? (
                          <span className="fw-500"><UserRound size={14} /> {agents.find((agent) => agent.id === r.assigned_to)?.name || 'Assigned agent'}</span>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                        <span className="text-muted text-sm">{r.assigned_at ? `Assigned ${format(new Date(r.assigned_at), 'MMM d, yyyy')}` : 'Awaiting first reply'}</span>
                      </div>
                    </td>
                    <td><span className={`priority-badge ${r.priority || 'medium'}`}>{r.priority || 'medium'}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="icon-btn info"
                          onClick={() => openNoteModal(r, r.status === 'closed' ? 'open' : 'pending')}
                          title="Open ticket replies and reply"
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
        title={`${noteModal?.status === 'closed' ? 'Close' : 'Ticket Replies'}`}
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
              <span><UserRound size={14} /> Assigned to {noteModal?.request?.assigned_to ? agents.find((agent) => agent.id === noteModal.request.assigned_to)?.name || 'an agent' : 'first responding agent'}</span>
              <StatusBadge status={noteModal?.request?.status} />
            </div>
          </div>
          {noteModal?.request?.admin_notes && (
            <div className="ticket-thread">
              <span className="ticket-reply-label">Replies and conversation</span>
              <p>{noteModal.request.admin_notes}</p>
            </div>
          )}
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
          <div className="form-group">
            <label>Ticket tags</label>
            <input
              value={ticketTags.join(', ')}
              onChange={(e) => setTicketTags(e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))}
              placeholder="billing, urgent, equipment"
            />
            <span className="form-hint">Separate tags with commas. Tags are visible to agents only.</span>
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
