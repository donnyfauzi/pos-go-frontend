import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import DateTimeWidget from '../../components/UI/DateTimeWidget';
import Dropdown from '../../components/UI/Dropdown';
import { getReportCharts, type ChartResponse } from '../../services/reportService';
import { Lock, LogOut, User as UserIcon, UtensilsCrossed, Users, Menu, FileText, CreditCard, DollarSign, ArrowRight, TrendingUp } from 'lucide-react';
import { menuService } from '../../services/menuService';
import { authService } from '../../services/authService';
import { getAllPromos } from '../../services/promoService';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [totalMenu, setTotalMenu] = useState<number>(0);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [totalUser, setTotalUser] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [totalPromo, setTotalPromo] = useState<number>(0);
  const [isLoadingPromo, setIsLoadingPromo] = useState(true);
  const [charts, setCharts] = useState<ChartResponse | null>(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

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

  // Fetch total promo
  useEffect(() => {
    const fetchTotalPromo = async () => {
      try {
        const promos = await getAllPromos();
        setTotalPromo(promos.length);
      } catch (err) {
        // Silent fail - tetap tampilkan 0 jika error
        setTotalPromo(0);
      } finally {
        setIsLoadingPromo(false);
      }
    };

    fetchTotalPromo();
  }, []);

  // Fetch data grafik (7 hari, 6 bulan)
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const data = await getReportCharts(7, 6);
        setCharts(data);
      } catch {
        setCharts(null);
      } finally {
        setIsLoadingCharts(false);
      }
    };
    fetchCharts();
  }, []);

  const formatCurrency = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const maxDailySales = charts?.daily?.length ? Math.max(...charts.daily.map((d) => d.total_sales), 1) : 1;
  const maxMonthlySales = charts?.monthly?.length ? Math.max(...charts.monthly.map((m) => m.total_sales), 1) : 1;
  const totalTransaksi7Hari = charts?.daily?.reduce((s, d) => s + d.total_transactions, 0) ?? 0;
  const totalPendapatan7Hari = charts?.daily?.reduce((s, d) => s + d.total_sales, 0) ?? 0;

  const formatDateLabel = (dateStr: string) => {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formatMonthLabel = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
  };

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
              <DateTimeWidget />
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

        {/* Stats Cards - Total Transaksi & Pendapatan (7 hari terakhir) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-teal-600 rounded-lg shadow-lg border-0">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Transaksi (7 hari)</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {isLoadingCharts ? '-' : totalTransaksi7Hari}
                  </p>
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
                  <p className="text-sm font-medium text-white/90">Total Pendapatan (7 hari)</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {isLoadingCharts ? '-' : `Rp ${formatCurrency(totalPendapatan7Hari)}`}
                  </p>
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

        {/* Stats Cards Section - Promo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg shadow-lg border-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Total Promo Aktif</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {isLoadingPromo ? '-' : totalPromo}
                  </p>
                  <p className="text-xs text-white/70 mt-1">Promo yang tersedia</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={28} className="text-white" />
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/promo')}
                className="mt-4 text-white hover:text-white/80 text-sm font-medium flex items-center gap-2"
              >
                Kelola Promo
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg border-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Menu Terlaris</p>
                  <p className="text-3xl font-bold text-white mt-2">-</p>
                  <p className="text-xs text-white/70 mt-1">Coming soon</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed size={28} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pemantauan Transaksi - Grafik */}
        <Card className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pemantauan Transaksi</h3>
          <p className="text-sm text-gray-500 mb-4">7 hari terakhir dan 6 bulan terakhir</p>
          {isLoadingCharts ? (
            <p className="text-gray-500 py-8 text-center">Memuat grafik...</p>
          ) : charts ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pendapatan per Hari (7 hari terakhir)</h4>
                <div className="flex items-end gap-2 h-44">
                  {charts.daily.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <div className="flex-1 w-full flex flex-col justify-end min-h-0" style={{ minHeight: 0 }}>
                        <div
                          className="w-full bg-teal-500 rounded-t min-h-[4px] transition-all"
                          style={{ height: `${Math.max(4, (d.total_sales / maxDailySales) * 100)}%` }}
                          title={`${d.date}: Rp ${formatCurrency(d.total_sales)} (${d.total_transactions} transaksi)`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate w-full text-center flex-shrink-0">
                        {formatDateLabel(d.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pendapatan per Bulan (6 bulan terakhir)</h4>
                <div className="flex items-end gap-2 h-44">
                  {charts.monthly.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <div className="flex-1 w-full flex flex-col justify-end min-h-0" style={{ minHeight: 0 }}>
                        <div
                          className="w-full bg-teal-600 rounded-t min-h-[4px] transition-all"
                          style={{ height: `${Math.max(4, (m.total_sales / maxMonthlySales) * 100)}%` }}
                          title={`${formatMonthLabel(m.month)}: Rp ${formatCurrency(m.total_sales)} (${m.total_transactions} transaksi)`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate w-full text-center flex-shrink-0">
                        {formatMonthLabel(m.month)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-4">Data grafik tidak tersedia.</p>
          )}
          <div className="mt-4">
            <button
              onClick={() => navigate('/admin/laporan')}
              className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-2"
            >
              Laporan lengkap
              <ArrowRight size={16} />
            </button>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              onClick={() => navigate('/admin/promo')}
              className="p-4 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-left w-full flex items-center gap-3 shadow-md hover:shadow-lg"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Kelola Promo</p>
                <p className="text-sm text-white/80 mt-0.5">Kelola promo dan diskon</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/laporan')}
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
