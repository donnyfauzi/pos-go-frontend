import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Dropdown from '../../components/UI/Dropdown';
import { Lock, LogOut, User as UserIcon } from 'lucide-react';

export default function KasirDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-0">
            <div>
              <img
                src="/logo-dashboard.png"
                alt="POS Go"
                className="h-20 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Dropdown
                trigger={
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon size={18} className="text-gray-600" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                }
                items={[
                  {
                    label: 'Ubah Password',
                    icon: <Lock size={16} />,
                    onClick: () => navigate('/change-password'),
                  },
                  {
                    label: 'Logout',
                    icon: <LogOut size={16} />,
                    onClick: handleLogout,
                    variant: 'danger',
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <Card className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Selamat Datang, {user?.name}! 
              </h2>
              <p className="text-gray-600">
                Siap untuk melayani pelanggan hari ini?
              </p>
            </div>
            <div className="hidden md:block">
              <img
                src="/logo-card.png"
                alt="Welcome"
                className="h-24 w-auto"
              />
            </div>
          </div>
        </Card>

        {/* POS Section - Placeholder untuk fitur POS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu List - Left Side */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Daftar Menu</h3>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <p className="text-gray-500">Menu akan ditampilkan di sini</p>
                <p className="text-sm text-gray-400 mt-2">Fitur akan segera tersedia</p>
              </div>
            </Card>
          </div>

          {/* Order Summary - Right Side */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pesanan</h3>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛒</span>
                </div>
                <p className="text-gray-500">Keranjang kosong</p>
                <p className="text-sm text-gray-400 mt-2">Pilih menu untuk memulai</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold text-gray-900">Rp 0</span>
                </div>
                <Button variant="primary" className="w-full" disabled>
                  Bayar
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Stats - Optional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="bg-gradient-to-br from-teal-50 to-white border border-teal-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transaksi Hari Ini</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-white border border-teal-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendapatan Hari Ini</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💵</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-white border border-teal-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pesanan Aktif</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏱️</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
