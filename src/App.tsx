import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import AdminDashboard from './pages/admin/Dashboard';
import KasirDashboard from './pages/kasir/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AuthInitializer from './components/AuthInitializer';
import ListMenu from './pages/admin/ListMenu';
import ListUser from './pages/admin/ListUser';
import CustomerMenu from './pages/customer/Menu';
import Checkout from './pages/customer/Checkout';
import OrderSuccess from './pages/customer/OrderSuccess';

function App() {
  return (
    <AuthInitializer>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/admin/user" replace />} />
        {/* Public Routes - Customer */}
        <Route path="/menu" element={<CustomerMenu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kasir/dashboard"
          element={
            <ProtectedRoute allowedRoles={['kasir']}>
              <KasirDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ListMenu />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ListUser />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthInitializer>
  );
}

export default App;
