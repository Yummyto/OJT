import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Admin pages
import Login from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Inventory from './pages/admin/Inventory.jsx';
import Categories from './pages/admin/Categories.jsx';
import BorrowRequests from './pages/admin/BorrowRequests.jsx';
import TicketReplies from './pages/admin/TicketReplies.jsx';

// Student pages
import MyBorrowings from './pages/student/MyBorrowings.jsx';
import SubmitTicket from './pages/student/SubmitTicket.jsx';

// Layout
import AdminLayout from './components/AdminLayout.jsx';
import StudentLayout from './components/StudentLayout.jsx';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }
  return admin ? children : <Navigate to="/admin/login" />;
}

export default function App() {
  return (
    <Routes>
      {/* Student Routes */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<MyBorrowings />} />
        <Route path="/submit-ticket" element={<SubmitTicket />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="categories" element={<Categories />} />
        <Route path="borrow-requests" element={<BorrowRequests />} />
        <Route path="ticket-replies" element={<TicketReplies />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
