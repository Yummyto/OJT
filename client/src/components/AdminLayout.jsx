import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, FolderOpen, ClipboardList,
  CalendarClock, LogOut, GraduationCap, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/inventory', icon: Package, label: 'Inventory' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/borrow-requests', icon: ClipboardList, label: 'Borrow Requests' },
  { to: '/admin/bookings', icon: CalendarClock, label: 'Bookings' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="logo-text">SchoolVault</h1>
              <p className="logo-sub">Admin Panel</p>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="admin-details">
              <p className="admin-name">{admin?.name || 'Admin'}</p>
              <p className="admin-email">{admin?.email || ''}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="header-right">
            <a href="/" className="view-student-link" target="_blank" rel="noopener noreferrer">
              <GraduationCap size={16} />
              Student Portal
            </a>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
