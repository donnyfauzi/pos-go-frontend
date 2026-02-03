import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Dropdown from '../../components/UI/Dropdown';
import Alert from '../../components/UI/Alert';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import DateTimeWidget from '../../components/UI/DateTimeWidget';
import { cancelOrder, confirmCashPaid, getAllTransactions, updateOrderStatus, type TransactionResponse } from '../../services/transactionService';
import { menuService } from '../../services/menuService';
import type { Menu } from '../../types';
import { Clock, CreditCard, FileText, HandCoins, Lock, LogOut, Phone, Store, ShoppingBag, User as UserIcon } from 'lucide-react';

export default function KasirDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'cancelled'>('new');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCashConfirmOpen, setShowCashConfirmOpen] = useState(false);
  const [isConfirmingCash, setIsConfirmingCash] = useState(false);
  const [showCancelConfirmOpen, setShowCancelConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [menuMap, setMenuMap] = useState<Record<string, Menu>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (amount: number) => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const getOrderShortId = (id: string) => id?.split('-')[0]?.toUpperCase() ?? id;

  const isDineIn = (t: TransactionResponse) => typeof t.table_number === 'number' && t.table_number > 0;

  const paymentLabel = (t: TransactionResponse) => {
    if (t.payment_method === 'cash') return 'Tunai';
    return 'Non-Tunai';
  };

  const paymentIcon = (t: TransactionResponse) => (t.payment_method === 'cash' ? HandCoins : CreditCard);

  const paymentBadgeClass = (t: TransactionResponse) => {
    if (t.payment_method === 'cash') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (t.payment_status === 'paid') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (t.payment_status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const statusBadge = (t: TransactionResponse) => {
    if (t.order_status === 'completed') return { label: 'Selesai', cls: 'bg-green-100 text-green-800' };
    if (t.order_status === 'ready') return { label: 'Siap disajikan', cls: 'bg-emerald-100 text-emerald-800' };
    if (t.order_status === 'cooking') return { label: 'Sedang dimasak', cls: 'bg-amber-100 text-amber-800' };
    if (t.order_status === 'cancelled') return { label: 'Dibatalkan', cls: 'bg-red-100 text-red-800' };
    return { label: 'Baru', cls: 'bg-teal-100 text-teal-800' };
  };

  const filtered = useMemo(() => {
    const list = [...transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (activeTab === 'cancelled') return list.filter((t) => t.order_status === 'cancelled');
    // Tab "Baru" menampilkan pesanan yang masih aktif: pending & ready
    return list.filter((t) => t.order_status === 'pending' || t.order_status === 'ready');
  }, [transactions, activeTab]);

  const selected = useMemo(() => {
    if (!selectedId) return filtered[0] ?? null;
    return filtered.find((t) => t.id === selectedId) || null;
  }, [filtered, selectedId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const data = await getAllTransactions();
        // Urutkan terbaru di atas (newest first)
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTransactions(sorted);
        setIsLoading(false);
        // Hanya set selectedId saat pertama kali (null) atau ketika transaksi yang dipilih tidak ada di data baru
        setSelectedId((prev) => {
          if (!prev && sorted.length > 0) return sorted[0].id;
          if (prev && !sorted.some((t) => t.id === prev) && sorted.length > 0) return sorted[0].id;
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
        // jika gagal, kasir tetap bisa pakai dashboard tanpa gambar
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

  const handleOpenCashConfirm = () => setShowCashConfirmOpen(true);
  const handleCloseCashConfirm = () => {
    if (!isConfirmingCash) setShowCashConfirmOpen(false);
  };

  const handleConfirmCashPaid = async () => {
    if (!selected) return;
    setIsConfirmingCash(true);
    setError(null);
    setSuccess(null);
    try {
      await confirmCashPaid(selected.id);
      setShowCashConfirmOpen(false);
      setSuccess('Pembayaran tunai berhasil dikonfirmasi');
      const data = await getAllTransactions();
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTransactions(sorted);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 403 ? 'Akses ditolak. Hanya role kasir yang dapat konfirmasi tunai.' : 'Gagal konfirmasi pembayaran tunai');
      setError(msg);
    } finally {
      setIsConfirmingCash(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (!selected) return;
    try {
      setError(null);
      setSuccess(null);
      await updateOrderStatus(selected.id, 'cooking');
      setSuccess('Pesanan dikirim ke dapur (status: sedang dimasak)');
      const data = await getAllTransactions();
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTransactions(sorted);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal mengirim pesanan ke dapur');
    }
  };

  const handleMarkCompleted = async () => {
    if (!selected) return;
    try {
      setError(null);
      setSuccess(null);
      await updateOrderStatus(selected.id, 'completed');
      setSuccess('Pesanan ditandai selesai');
      const data = await getAllTransactions();
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTransactions(sorted);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal mengubah status pesanan');
    }
  };

  const handleOpenCancelConfirm = () => setShowCancelConfirmOpen(true);
  const handleCloseCancelConfirm = () => {
    if (!isCancelling) setShowCancelConfirmOpen(false);
  };
  const handleCancelOrder = async () => {
    if (!selected) return;
    setIsCancelling(true);
    setError(null);
    setSuccess(null);
    try {
      await cancelOrder(selected.id);
      setShowCancelConfirmOpen(false);
      setSuccess('Pesanan berhasil dibatalkan');
      const data = await getAllTransactions();
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTransactions(sorted);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal membatalkan pesanan');
    } finally {
      setIsCancelling(false);
    }
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
                    label: 'Laporan & Settlement',
                    icon: <FileText size={16} />,
                    onClick: () => navigate('/kasir/laporan'),
                  },
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
        {/* Welcome Card (samakan dengan Dashboard Admin) */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Selamat Datang, {user?.name}!
              </h2>
              <p className="text-gray-600">
                Pantau antrian pesanan dan proses pesanan pelanggan dari sini
              </p>
            </div>
            <div className="hidden md:block">
              <img
                src="/logo-card2.png"
                alt="Welcome"
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
              <h3 className="text-lg font-bold text-gray-900">Antrian Pesanan</h3>
              <span className="text-xs text-gray-500">{transactions.length} pesanan</span>
            </div>

            {/* Tabs - styled like top tabs */}
            <div className="mb-4">
              <div className="flex bg-teal-50 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-2xl transition-all ${
                    activeTab === 'new'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-transparent text-gray-700 hover:bg-white'
                  }`}
                >
                  Baru
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cancelled')}
                  className={`flex-1 py-2 px-3 text-sm font-semibold rounded-2xl transition-all ${
                    activeTab === 'cancelled'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-transparent text-gray-700 hover:bg-white'
                  }`}
                >
                  Batal
                </button>
              </div>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="py-10 text-center text-gray-500 text-sm">Memuat antrian...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">Belum ada pesanan.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((t) => {
                  const Status = statusBadge(t);
                  const PayIcon = paymentIcon(t);
                  const selectedCls = (selected?.id === t.id)
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
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">
                            Rp {formatCurrency(t.total_amount)}
                          </div>
                          <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${paymentBadgeClass(t)}`}>
                            <PayIcon size={14} />
                            {paymentLabel(t)}
                            {t.payment_method !== 'cash' && t.payment_status === 'pending' ? ' (Pending)' : ''}
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
                      {isDineIn(selected) ? <Store size={18} className="text-teal-600" /> : <ShoppingBag size={18} className="text-teal-600" />}
                      {isDineIn(selected) ? `Makan di tempat (Meja ${selected.table_number})` : 'Take away'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Pembayaran</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const PayIcon = paymentIcon(selected);
                        return <PayIcon size={18} className="text-teal-600" />;
                      })()}
                      <div className="text-sm">
                        <div className="font-bold text-gray-900">{paymentLabel(selected)}</div>
                        <div className="text-xs text-gray-600">
                          Status: <span className="font-semibold">{selected.payment_status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      Masuk: {formatTime(selected.created_at)}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Status Pesanan</p>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          statusBadge(selected).cls
                        }`}
                      >
                        {statusBadge(selected).label}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {selected.order_status === 'pending' && selected.payment_status === 'paid' && (
                        <Button
                          className="w-full"
                          variant="primary"
                          onClick={handleSendToKitchen}
                        >
                          Kirim ke Dapur 
                        </Button>
                      )}
                      {selected.order_status === 'ready' && selected.payment_status === 'paid' && (
                        <Button
                          className="w-full"
                          variant="primary"
                          onClick={handleMarkCompleted}
                        >
                          Tandai Selesai
                        </Button>
                      )}
                      {(selected.order_status === 'pending' || selected.order_status === 'cooking' || selected.order_status === 'ready') && (
                        <Button
                          className="w-full mt-2"
                          variant="danger"
                          onClick={handleOpenCancelConfirm}
                        >
                          Batalkan Pesanan
                        </Button>
                      )}
                      {!(selected.order_status === 'pending' && selected.payment_status === 'paid') &&
                        !(selected.order_status === 'ready' && selected.payment_status === 'paid') &&
                        selected.order_status !== 'pending' &&
                        selected.order_status !== 'ready' && (
                          <p className="text-xs text-gray-500">
                            Tidak ada aksi status yang tersedia untuk pesanan ini.
                          </p>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Kasir mengubah status dari <strong>Baru</strong> ke <strong>Sedang dimasak</strong>, lalu ke <strong>Selesai</strong> setelah pesanan disajikan.
                    </p>
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
                                    {it.quantity} x Rp {formatCurrency(it.menu_price)}
                                  </p>
                                </div>
                              </div>
                              <div className="font-bold text-gray-900">
                                Rp {formatCurrency(it.subtotal)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Tidak ada item.</div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Ringkasan</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-900">Rp {formatCurrency(selected.subtotal)}</span>
                      </div>
                      {selected.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {selected.promo_code ? `Diskon (${selected.promo_code})` : 'Diskon'}
                          </span>
                          <span className="font-semibold text-teal-700">- Rp {formatCurrency(selected.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">PPN 10%</span>
                        <span className="font-semibold text-gray-900">Rp {formatCurrency(selected.tax)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-teal-700">Rp {formatCurrency(selected.total_amount)}</span>
                      </div>
                    </div>
                    {selected.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Catatan</p>
                        <p className="text-sm text-gray-700">{selected.notes}</p>
                      </div>
                    )}

                    {/* Aksi pembayaran tunai - tombol di tengah dalam kartu ringkasan */}
                    {selected.payment_method === 'cash' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        {selected.payment_status === 'pending' ? (
                          <>
                            <Button
                              className="min-w-[220px]"
                              variant="primary"
                              onClick={handleOpenCashConfirm}
                            >
                              Konfirmasi Pembayaran Tunai
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              Pastikan pelanggan sudah benar-benar membayar tunai sebelum konfirmasi.
                            </p>
                          </>
                        ) : (
                          <>
                            <Button className="min-w-[220px]" variant="secondary" disabled>
                              Pembayaran tunai sudah dikonfirmasi
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              Transaksi ini sudah berstatus lunas (tunai).
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Konfirmasi tunai: pastikan pelanggan sudah benar-benar bayar tunai sebelum commit */}
      <ConfirmDialog
        isOpen={showCashConfirmOpen}
        onClose={handleCloseCashConfirm}
        onConfirm={handleConfirmCashPaid}
        title="Konfirmasi Pembayaran Tunai"
        message="Pastikan pelanggan sudah benar-benar membayar tunai di kasir. Setelah dikonfirmasi, status pembayaran akan berubah menjadi Lunas dan tidak dapat dibatalkan."
        confirmText="Ya, Sudah Dibayar Tunai"
        cancelText="Batal"
        variant="info"
        isLoading={isConfirmingCash}
      />
      <ConfirmDialog
        isOpen={showCancelConfirmOpen}
        onClose={handleCloseCancelConfirm}
        onConfirm={handleCancelOrder}
        title="Batalkan Pesanan"
        message="Yakin ingin membatalkan pesanan ini? Pesanan akan pindah ke tab Batal dan tidak dapat diaktifkan kembali."
        confirmText="Ya, Batalkan"
        cancelText="Tidak"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}
