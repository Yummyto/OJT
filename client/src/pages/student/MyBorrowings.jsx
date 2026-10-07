import { useState } from 'react';
import { borrowAPI, bookingsAPI } from '../../services/api';
import { Search, ClipboardList, CalendarClock, Package } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MyBorrowings() {
  const [studentId, setStudentId] = useState('');
  const [searched, setSearched] = useState(false);
  const [borrows, setBorrows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('borrows');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [borrowRes, bookingRes] = await Promise.all([
        borrowAPI.getByStudent(studentId.trim()),
        bookingsAPI.getByStudent(studentId.trim())
      ]);
      setBorrows(borrowRes.data);
      setBookings(bookingRes.data);
    } catch (err) {
      toast.error('Failed to load your records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-borrowings-page">
      <div className="borrowings-hero">
        <h1>My Borrowings & Bookings</h1>
        <p>Enter your Student ID to view your borrowing history and booking status</p>

        <form onSubmit={handleSearch} className="student-search-form">
          <div className="student-search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Enter your Student ID (e.g., 2024-0001)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Look Up'}
          </button>
        </form>
      </div>

      {searched && !loading && (
        <div className="borrowings-content">
          {/* Tabs */}
          <div className="borrowings-tabs">
            <button
              className={`borrowings-tab ${activeTab === 'borrows' ? 'active' : ''}`}
              onClick={() => setActiveTab('borrows')}
            >
              <ClipboardList size={18} />
              Borrow Requests ({borrows.length})
            </button>
            <button
              className={`borrowings-tab ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <CalendarClock size={18} />
              Bookings ({bookings.length})
            </button>
          </div>

          {/* Borrow Requests */}
          {activeTab === 'borrows' && (
            borrows.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={48} />
                <h3>No borrow requests</h3>
                <p>You haven't submitted any borrow requests with this Student ID.</p>
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
                        <h4>{r.items?.name || 'Unknown Item'}</h4>
                        <p className="borrowing-dates">
                          {format(new Date(r.borrow_date), 'MMM d, yyyy')} → {format(new Date(r.expected_return_date), 'MMM d, yyyy')}
                        </p>
                        <p className="borrowing-purpose">{r.purpose}</p>
                        {r.admin_notes && (
                          <p className="admin-note">📝 Admin: {r.admin_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="borrowing-card-right">
                      <StatusBadge status={r.status} />
                      <span className="borrowing-qty">Qty: {r.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Bookings */}
          {activeTab === 'bookings' && (
            bookings.length === 0 ? (
              <div className="empty-state">
                <CalendarClock size={48} />
                <h3>No bookings</h3>
                <p>You haven't made any bookings with this Student ID.</p>
              </div>
            ) : (
              <div className="borrowings-list">
                {bookings.map((b) => (
                  <div key={b.id} className="borrowing-card">
                    <div className="borrowing-card-left">
                      <div className="borrowing-item-image">
                        {b.items?.images?.length > 0 ? (
                          <img src={b.items.images[0]} alt={b.items?.name} />
                        ) : (
                          <Package size={24} />
                        )}
                      </div>
                      <div className="borrowing-info">
                        <h4>{b.items?.name || 'Unknown Item'}</h4>
                        <p className="borrowing-dates">
                          {format(new Date(b.start_date), 'MMM d, yyyy')} → {format(new Date(b.end_date), 'MMM d, yyyy')}
                        </p>
                        <p className="borrowing-purpose">{b.purpose}</p>
                        {b.admin_notes && (
                          <p className="admin-note">📝 Admin: {b.admin_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="borrowing-card-right">
                      <StatusBadge status={b.status} />
                      <span className="borrowing-qty">Qty: {b.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
