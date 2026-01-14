import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import Dropdown from '../../components/UI/Dropdown';
import { Lock, LogOut, User as UserIcon, UtensilsCrossed, Users, Menu, FileText, CreditCard, DollarSign, ArrowRight } from 'lucide-react';
import { menuService } from '../../services/menuService';
import { authService } from '../../services/authService';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [totalMenu, setTotalMenu] = useState<number>(0);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [totalUser, setTotalUser] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch total menu
  useEffect(() => {
    const fetchTotalMenu = async () => {
      try {
        const response = await menuService.getAllMenus();
        if (response.success && response.data) {
          setTotalMenu(response.data.length);
        }
      } catch (err) {
        // Silent fail - tetap tampilkan 0 jika error
        setTotalMenu(0);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchTotalMenu();
  }, []);

  // Fetch total user
  useEffect(() => {
    const fetchTotalUser = async () => {
      try {
        const response = await authService.getAllUsers();
        if (response.success && response.data) {
          setTotalUser(response.data.length);
        }
      } catch (err) {
        // Silent fail - tetap tampilkan 0 jika error
        setTotalUser(0);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchTotalUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-gray-100 shadow-md">
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
                Kelola sistem POS restoran Anda dari dashboard ini
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

        {/* Stats Cards Section - Placeholder untuk fitur selanjutnya */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-teal-600 rounded-lg shadow-lg border-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Transaksi</p>
                  <p className="text-2xl font-bold text-white mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-600 rounded-lg shadow-lg border-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-white mt-1">-</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-600 rounded-lg shadow-lg border-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Menu</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {isLoadingMenu ? '-' : totalMenu}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed size={24} className="text-white" />
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/menu')}
                className="mt-5 text-white hover:text-white/80 text-sm font-medium flex items-center gap-2"
              >
                Lihat Detail
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="bg-teal-600 rounded-lg shadow-lg border-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total User</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {isLoadingUser ? '-' : totalUser}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/user')}
                className="mt-5 text-white hover:text-white/80 text-sm font-medium flex items-center gap-2"
              >
                Lihat Detail
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/admin/menu')}
              className="p-4 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-left w-full flex items-center gap-3 shadow-md hover:shadow-lg"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Menu size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Kelola Menu</p>
                <p className="text-sm text-white/80 mt-0.5">Lihat dan kelola semua menu</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/user')}
              className="p-4 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-left w-full flex items-center gap-3 shadow-md hover:shadow-lg"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Kelola User</p>
                <p className="text-sm text-white/80 mt-0.5">Lihat dan kelola semua user kasir</p>
              </div>
            </button>
            <button 
              className="p-4 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-left w-full flex items-center gap-3 shadow-md hover:shadow-lg"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Laporan</p>
                <p className="text-sm text-white/80 mt-0.5">Lihat laporan penjualan</p>
              </div>
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
