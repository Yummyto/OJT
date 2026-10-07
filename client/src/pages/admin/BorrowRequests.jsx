import { useState, useEffect } from 'react';
import { borrowAPI } from '../../services/api';
import { ClipboardList, Check, X, RotateCcw, MessageSquare } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { loadRequests(); }, [page, filterStatus]);

  const loadRequests = async () => {
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
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
          <h1 className="page-title">Borrow Requests</h1>
          <p className="page-subtitle">Review and manage student borrowing requests</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          {['', 'pending', 'approved', 'borrowed', 'returned', 'overdue', 'rejected'].map(s => (
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

      {requests.length === 0 ? (
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
                <tr>
                  <th>Student</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Borrow Date</th>
                  <th>Return Date</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="cell-stack">
                        <span className="fw-500">{r.student_name}</span>
                        <span className="text-muted text-sm">{r.student_id}</span>
                      </div>
                    </td>
                    <td className="fw-500">{r.items?.name || '—'}</td>
                    <td>{r.quantity}</td>
                    <td>{format(new Date(r.borrow_date), 'MMM d, yyyy')}</td>
                    <td>{format(new Date(r.expected_return_date), 'MMM d, yyyy')}</td>
                    <td className="purpose-cell">{r.purpose?.substring(0, 50) || '—'}{r.purpose?.length > 50 ? '...' : ''}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="action-btns">
                        {r.status === 'pending' && (
                          <>
                            <button
                              className="icon-btn success"
                              onClick={() => openNoteModal(r, 'approved')}
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="icon-btn danger"
                              onClick={() => openNoteModal(r, 'rejected')}
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <button
                            className="icon-btn info"
                            onClick={() => updateStatus(r.id, 'borrowed')}
                            title="Mark as Borrowed"
                          >
                            <ClipboardList size={16} />
                          </button>
                        )}
                        {['approved', 'borrowed', 'overdue'].includes(r.status) && (
                          <button
                            className="icon-btn success"
                            onClick={() => updateStatus(r.id, 'returned')}
                            title="Mark as Returned"
                          >
                            <RotateCcw size={16} />
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
        title={`${noteModal?.status === 'approved' ? 'Approve' : 'Reject'} Request`}
      >
        <div className="modal-form">
          <p className="modal-info">
            <strong>{noteModal?.request?.student_name}</strong> wants to borrow <strong>{noteModal?.request?.items?.name}</strong>
          </p>
          <div className="form-group">
            <label><MessageSquare size={16} /> Admin Note (optional)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note for the student..."
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setNoteModal(null)}>Cancel</button>
            <button
              className={`btn ${noteModal?.status === 'approved' ? 'btn-success' : 'btn-danger'}`}
              onClick={() => updateStatus(noteModal.request.id, noteModal.status)}
            >
              {noteModal?.status === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
