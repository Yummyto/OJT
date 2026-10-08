import { useEffect, useState } from 'react';
import { borrowAPI } from '../../services/api.js';
import { Search, ClipboardList, Package, Plus, Mail, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge.jsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MyBorrowings() {
  const [studentId, setStudentId] = useState('');
  const [searched, setSearched] = useState(false);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDate = (value) => value ? format(new Date(value), 'MMM d, yyyy') : 'Date to be confirmed';

  const loadTickets = async (identifier, showLoading = true) => {
    if (!identifier.trim()) return;
    if (showLoading) setLoading(true);
    try {
      const borrowRes = await borrowAPI.lookup(identifier);
      setBorrows(borrowRes.data);
    } catch (err) {
      toast.error('Failed to load your records');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearched(true);
    await loadTickets(studentId.trim());
  };

  useEffect(() => {
    if (!searched || !studentId.trim()) return undefined;
    const refreshTimer = setInterval(() => loadTickets(studentId.trim(), false), 30000);
    return () => clearInterval(refreshTimer);
  }, [searched, studentId]);

  return (
    <div className="my-borrowings-page">
      <div className="borrowings-hero">
        <h1>My Tickets</h1>
        <p>Search with your Student ID or ticket number to check status and replies from support.</p>

        <form onSubmit={handleSearch} className="student-search-form">
          <div className="student-search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Student ID or ticket number (e.g., BR-ABC123)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Look Up'}
          </button>
        </form>
        <Link to="/submit-ticket" className="btn btn-secondary"><Plus size={16} /> Submit a new ticket</Link>
      </div>

      {searched && !loading && (
        <div className="borrowings-content">
          <div className="ticket-results-header">
            <span className="text-muted text-sm">Replies refresh automatically.</span>
            <button className="btn btn-ghost btn-sm" onClick={() => loadTickets(studentId.trim())}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {borrows.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={48} />
                <h3>No tickets found</h3>
                <p>No tickets were found for this Student ID.</p>
              </div>
            ) : (
              <div className="borrowings-list">
                {borrows.map((r) => (
                  <div key={r.id} className="borrowing-card">
                    <div className="borrowing-card-left">
                      <div className="borrowing-item-image">
                        {r.items?.images?.length > 0 ? (
                          <img src={r.items.images[0]} alt={r.items?.name} />
                        ) : (
                          <Package size={24} />
                        )}
                      </div>
                      <div className="borrowing-info">
                        <h4>{r.ticket_number || 'Ticket'} <span className="text-muted">· {r.ticket_category?.replaceAll('_', ' ') || 'support request'}</span></h4>
                        <p className="text-muted text-sm">{r.items?.name || 'General support request'} · Opened {formatDate(r.created_at)}</p>
                        <p className="borrowing-dates">
                          {r.borrow_date ? `${formatDate(r.borrow_date)} → ${formatDate(r.expected_return_date)}` : 'Support ticket · Status updates are sent by email'}
                        </p>
                        <p className="borrowing-purpose">{r.purpose}</p>
                        {r.admin_notes && (
                          <p className="admin-note"><Mail size={14} /> Support reply: {r.admin_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="borrowing-card-right">
                      <StatusBadge status={r.status} />
                      <span className="borrowing-qty">Qty: {r.quantity || 1}</span>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </div>
      )}
    </div>
  );
}
