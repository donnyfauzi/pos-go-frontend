import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';
import AdminDashboard from './pages/admin/Dashboard';
import KasirDashboard from './pages/kasir/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AuthInitializer from './components/AuthInitializer';
import CreateMenu from './pages/admin/CreateMenu';

function App() {
  return (
    <AuthInitializer>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/register"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Register />
            </ProtectedRoute>
          }
        />
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
          path="/admin/menu/create"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateMenu />
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
