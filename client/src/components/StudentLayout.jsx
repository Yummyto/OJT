import { Outlet, Link, useLocation } from 'react-router-dom';
import { GraduationCap, Ticket, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function StudentLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="student-layout">
      <header className="student-header">
        <div className="student-header-inner">
          <Link to="/" className="student-logo">
            <div className="student-logo-icon">
              <GraduationCap size={22} />
            </div>
            <span className="student-logo-text">SchoolVault</span>
          </Link>

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`student-nav ${menuOpen ? 'open' : ''}`}>
            <Link to="/" className={`student-nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}><Ticket size={18} /> My Tickets</Link>
          </nav>
        </div>
      </header>

      <main className="student-main">
        <Outlet />
      </main>

      <footer className="student-footer">
        <p>&copy; {new Date().getFullYear()} SchoolVault — School Inventory Management System</p>
      </footer>
    </div>
  );
}
