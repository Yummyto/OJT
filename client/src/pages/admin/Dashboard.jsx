import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api.js';
import {
  Package, FolderOpen, ClipboardList, CalendarClock,
  AlertTriangle, TrendingUp, Clock, CheckCircle
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await dashboardAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Items',
      value: stats?.stats?.totalItems || 0,
      icon: Package,
      color: 'blue',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    },
    {
      label: 'Categories',
      value: stats?.stats?.totalCategories || 0,
      icon: FolderOpen,
      color: 'purple',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    {
      label: 'Pending Requests',
      value: stats?.stats?.pendingBorrows || 0,
      icon: ClipboardList,
      color: 'amber',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      label: 'Active Borrows',
      value: stats?.stats?.activeBorrows || 0,
      icon: TrendingUp,
      color: 'teal',
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)'
    },
    {
      label: 'Pending Bookings',
      value: stats?.stats?.pendingBookings || 0,
      icon: CalendarClock,
      color: 'indigo',
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)'
    },
    {
      label: 'Overdue',
      value: stats?.stats?.overdueBorrows || 0,
      icon: AlertTriangle,
      color: 'red',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your school inventory system</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card stat-${card.color}`}>
            <div className="stat-icon" style={{ background: card.gradient }}>
              <card.icon size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-value">{card.value}</p>
              <p className="stat-label">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Borrow Requests */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><Clock size={18} /> Recent Borrow Requests</h3>
          </div>
          <div className="card-body">
            {stats?.recentBorrows?.length > 0 ? (
              <div className="activity-list">
                {stats.recentBorrows.map((r) => (
                  <div key={r.id} className="activity-item">
                    <div className="activity-info">
                      <p className="activity-title">{r.student_name}</p>
                      <p className="activity-sub">
                        {r.items?.name} — {format(new Date(r.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No recent requests</p>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><CalendarClock size={18} /> Recent Bookings</h3>
          </div>
          <div className="card-body">
            {stats?.recentBookings?.length > 0 ? (
              <div className="activity-list">
                {stats.recentBookings.map((b) => (
                  <div key={b.id} className="activity-item">
                    <div className="activity-info">
                      <p className="activity-title">{b.student_name}</p>
                      <p className="activity-sub">
                        {b.items?.name} — {format(new Date(b.start_date), 'MMM d')} to {format(new Date(b.end_date), 'MMM d')}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3><AlertTriangle size={18} /> Low Stock Items</h3>
          </div>
          <div className="card-body">
            {stats?.lowStockItems?.length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Total</th>
                      <th>Available</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-500">{item.name}</td>
                        <td>{item.categories?.name || '—'}</td>
                        <td>{item.quantity}</td>
                        <td>{item.available_quantity}</td>
                        <td>
                          <span className={`status-badge ${item.available_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                            {item.available_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-small">
                <CheckCircle size={24} />
                <p>All items have sufficient stock</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
