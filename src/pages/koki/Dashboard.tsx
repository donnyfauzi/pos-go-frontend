import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import DateTimeWidget from '../../components/UI/DateTimeWidget';
import Dropdown from '../../components/UI/Dropdown';
import Alert from '../../components/UI/Alert';
import { getAllTransactions, updateOrderStatus, type TransactionResponse } from '../../services/transactionService';
import { menuService } from '../../services/menuService';
import type { Menu } from '../../types';
import { Clock, Lock, LogOut, Phone, Store, ShoppingBag, User as UserIcon } from 'lucide-react';

export default function KokiDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuMap, setMenuMap] = useState<Record<string, Menu>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const getOrderShortId = (id: string) => id?.split('-')[0]?.toUpperCase() ?? id;

  const isDineIn = (t: TransactionResponse) => typeof t.table_number === 'number' && t.table_number > 0;

  const cookingStatusBadge = (t: TransactionResponse) => {
    if (t.order_status === 'completed') return { label: 'Selesai', cls: 'bg-green-100 text-green-800' };
    if (t.order_status === 'ready') return { label: 'Siap disajikan', cls: 'bg-emerald-100 text-emerald-800' };
    if (t.order_status === 'cooking') return { label: 'Sedang dimasak', cls: 'bg-amber-100 text-amber-800' };
    if (t.order_status === 'cancelled') return { label: 'Dibatalkan', cls: 'bg-red-100 text-red-800' };
    return { label: 'Baru', cls: 'bg-teal-100 text-teal-800' };
  };

  const filtered = useMemo(() => {
    // Koki hanya lihat pesanan yang sedang dimasak (status cooking)
    const list = [...transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return list.filter((t) => t.order_status === 'cooking');
  }, [transactions]);

  const selected = useMemo(() => {
    if (!selectedId) return filtered[0] ?? null;
    return filtered.find((t) => t.id === selectedId) || null;
  }, [filtered, selectedId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const data = await getAllTransactions();
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTransactions(sorted);
        setIsLoading(false);
        // pilih otomatis pesanan "cooking" terbaru kalau belum ada pilihan
        setSelectedId((prev) => {
          const cookingList = sorted.filter((t) => t.order_status === 'cooking');
          if (cookingList.length === 0) return null;
          if (!prev) return cookingList[0].id;
          if (prev && !cookingList.some((t) => t.id === prev)) return cookingList[0].id;
          return prev;
        });
      } catch (e: any) {
        setIsLoading(false);
        setError(e?.response?.data?.message || 'Gagal memuat antrian pesanan');
      }
    };

    const fetchMenus = async () => {
      try {
        const res = await menuService.getPublicMenus();
        if (res.success && res.data) {
          const map: Record<string, Menu> = {};
          res.data.forEach((m: Menu) => {
            map[m.id] = m;
          });
          setMenuMap(map);
        }
      } catch (e) {
        // jika gagal, koki tetap bisa pakai dashboard tanpa gambar
      }
    };

    fetchData();
    fetchMenus();
    pollRef.current = setInterval(fetchData, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {/* Welcome Card */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Selamat Datang, {user?.name}!
              </h2>
              <p className="text-gray-600">
                Pantau dan proses pesanan yang perlu dimasak dari sini.
              </p>
            </div>
            <div className="flex items-center">
              <img
                src="/logo-card2.png"
                alt="Kitchen"
                className="h-24 w-auto"
              />
            </div>
          </div>
        </Card>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}
        {success && (
          <div className="mb-4">
            <Alert type="success" message={success} onClose={() => setSuccess(null)} />
          </div>
        )}

        {/* Queue + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Queue */}
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Antrian Dapur</h3>
              <span className="text-xs text-gray-500">{filtered.length} pesanan</span>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-gray-500 text-sm">Memuat antrian...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">Belum ada pesanan untuk dimasak.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((t) => {
                  const Status = cookingStatusBadge(t);
                  const selectedCls =
                    selected?.id === t.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left border rounded-xl p-4 transition-colors ${selectedCls}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              #{getOrderShortId(t.id)}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${Status.cls}`}>
                              {Status.label}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            {formatTime(t.created_at)}
                            <span className="text-gray-300">•</span>
                            {isDineIn(t) ? `Meja ${t.table_number}` : 'Take away'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Right: Detail */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Detail Pesanan</h3>
              {selected && (
                <span className="text-xs text-gray-500">
                  #{getOrderShortId(selected.id)}
                </span>
              )}
            </div>

            {!selected ? (
              <div className="py-12 text-center text-gray-500">
                Pilih pesanan dari antrian untuk melihat detail.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Pelanggan</p>
                    <p className="text-base font-bold text-gray-900">{selected.customer_name}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={16} className="text-gray-400" />
                      {selected.customer_phone}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Tipe Pesanan</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      {isDineIn(selected) ? (
                        <Store size={18} className="text-teal-600" />
                      ) : (
                        <ShoppingBag size={18} className="text-teal-600" />
                      )}
                      {isDineIn(selected)
                        ? `Makan di tempat (Meja ${selected.table_number})`
                        : 'Take away'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Status Dapur</p>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          cookingStatusBadge(selected).cls
                        }`}
                      >
                        {cookingStatusBadge(selected).label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Status ini menentukan apakah pesanan masih menunggu, sedang dimasak, atau siap disajikan.
                    </p>
                    {selected.order_status === 'cooking' && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setError(null);
                              setSuccess(null);
                              await updateOrderStatus(selected.id, 'ready');
                              setSuccess('Pesanan ditandai siap disajikan');
                              const data = await getAllTransactions();
                              const sorted = [...data].sort(
                                (a, b) =>
                                  new Date(b.created_at).getTime() -
                                  new Date(a.created_at).getTime()
                              );
                              setTransactions(sorted);
                            } catch (e: any) {
                              setError(
                                e?.response?.data?.message ||
                                  'Gagal mengubah status pesanan menjadi ready'
                              );
                            }
                          }}
                          className="w-full px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          Tandai Siap Disajikan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items + Summary */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Item Pesanan</p>
                    {selected.items?.length ? (
                      <div className="space-y-3">
                        {selected.items.map((it) => {
                          const menu = menuMap[it.menu_id];
                          const imgSrc = menu?.image
                            ? `${import.meta.env.VITE_API_URL}/${menu.image}`
                            : null;

                          return (
                            <div
                              key={it.id}
                              className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-start gap-3">
                                {imgSrc && (
                                  <img
                                    src={imgSrc}
                                    alt={menu?.name || it.menu_name}
                                    className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                                  />
                                )}
                                <div>
                                  <p className="font-semibold text-gray-900">{it.menu_name}</p>
                                  <p className="text-xs text-gray-600">
                                    {it.quantity} x {isDineIn(selected) ? 'Porsi' : 'Item'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Tidak ada item.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

