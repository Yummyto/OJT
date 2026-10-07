import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Admin pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Inventory from './pages/admin/Inventory';
import Categories from './pages/admin/Categories';
import BorrowRequests from './pages/admin/BorrowRequests';
import Bookings from './pages/admin/Bookings';

// Student pages
import BrowseItems from './pages/student/BrowseItems';
import ItemDetails from './pages/student/ItemDetails';
import MyBorrowings from './pages/student/MyBorrowings';

// Layout
import AdminLayout from './components/AdminLayout';
import StudentLayout from './components/StudentLayout';

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
        <Route path="/" element={<BrowseItems />} />
        <Route path="/items/:id" element={<ItemDetails />} />
        <Route path="/my-borrowings" element={<MyBorrowings />} />
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
        <Route path="bookings" element={<Bookings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
