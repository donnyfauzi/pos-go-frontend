import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // untuk cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Saat 401/403: clear session. Redirect ke login HANYA jika user ada di route yang butuh auth (bukan halaman publik).
const isPublicPath = (path: string) => {
  if (path === '/login') return true;
  if (path === '/menu' || path.startsWith('/menu')) return true;
  if (path === '/checkout' || path.startsWith('/checkout')) return true;
  if (path.startsWith('/order-success') || path.startsWith('/payment-pending')) return true;
  return false;
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      useAuthStore.getState().logout();
      const path = window.location.pathname;
      // Redirect hanya jika di halaman yang seharusnya butuh login (admin/kasir/koki/change-password)
      if (!isPublicPath(path)) {
        const params = new URLSearchParams({ reason: 'session_changed' });
        window.location.href = `/login?${params.toString()}`;
      }
    }
    return Promise.reject(err);
  }
);

export default api;