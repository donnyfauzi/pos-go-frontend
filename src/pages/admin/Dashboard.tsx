import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import Dropdown from '../../components/UI/Dropdown';
import { Lock, LogOut, User as UserIcon } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POS Go</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
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
                Kelola sistem POS restoran Anda dari dashboard ini
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Cards Section - Placeholder untuk fitur selanjutnya */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Menu</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total User</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions - Placeholder */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/admin/menu/create')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left w-full"
            >
              <p className="font-medium text-gray-900">Tambah Menu</p>
              <p className="text-sm text-gray-500 mt-1">Tambah menu baru ke sistem</p>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left w-full"
            >
              <p className="font-medium text-gray-900">Kelola User</p>
              <p className="text-sm text-gray-500 mt-1">Registrasi user kasir baru</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
              <p className="font-medium text-gray-900">Laporan</p>
              <p className="text-sm text-gray-500 mt-1">Lihat laporan penjualan</p>
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
