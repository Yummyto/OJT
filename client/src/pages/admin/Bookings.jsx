import { useState, useEffect } from 'react';
import { bookingsAPI } from '../../services/api';
import { CalendarClock, Check, X, MessageSquare } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { loadBookings(); }, [page, filterStatus]);

  const loadBookings = async () => {
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      const { data } = await bookingsAPI.getAll(params);
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await bookingsAPI.updateStatus(id, status, adminNote);
      toast.success(`Booking ${status}`);
      setNoteModal(null);
      setAdminNote('');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update booking');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading bookings...</p></div>;
  }

  return (
    <div className="requests-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">Manage tool and equipment reservations</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          {['', 'pending', 'approved', 'rejected', 'completed', 'cancelled'].map(s => (
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

      {bookings.length === 0 ? (
        <div className="empty-state">
          <CalendarClock size={48} />
          <h3>No bookings found</h3>
          <p>{filterStatus ? `No ${filterStatus} bookings.` : 'No bookings yet.'}</p>
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
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="cell-stack">
                        <span className="fw-500">{b.student_name}</span>
                        <span className="text-muted text-sm">{b.student_id}</span>
                      </div>
                    </td>
                    <td className="fw-500">{b.items?.name || '—'}</td>
                    <td>{b.quantity}</td>
                    <td>{format(new Date(b.start_date), 'MMM d, yyyy')}</td>
                    <td>{format(new Date(b.end_date), 'MMM d, yyyy')}</td>
                    <td className="purpose-cell">{b.purpose?.substring(0, 50) || '—'}{b.purpose?.length > 50 ? '...' : ''}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div className="action-btns">
                        {b.status === 'pending' && (
                          <>
                            <button
                              className="icon-btn success"
                              onClick={() => { setNoteModal({ booking: b, status: 'approved' }); setAdminNote(''); }}
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="icon-btn danger"
                              onClick={() => { setNoteModal({ booking: b, status: 'rejected' }); setAdminNote(''); }}
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <button
                            className="icon-btn success"
                            onClick={() => updateStatus(b.id, 'completed')}
                            title="Mark Completed"
                          >
                            <Check size={16} />
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
        title={`${noteModal?.status === 'approved' ? 'Approve' : 'Reject'} Booking`}
      >
        <div className="modal-form">
          <p className="modal-info">
            <strong>{noteModal?.booking?.student_name}</strong> booked <strong>{noteModal?.booking?.items?.name}</strong>
          </p>
          <div className="form-group">
            <label><MessageSquare size={16} /> Admin Note (optional)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setNoteModal(null)}>Cancel</button>
            <button
              className={`btn ${noteModal?.status === 'approved' ? 'btn-success' : 'btn-danger'}`}
              onClick={() => updateStatus(noteModal.booking.id, noteModal.status)}
            >
              {noteModal?.status === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
