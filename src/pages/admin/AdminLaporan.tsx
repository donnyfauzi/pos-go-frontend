import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import DateTimeWidget from '../../components/UI/DateTimeWidget';
import Dropdown from '../../components/UI/Dropdown';
import Alert from '../../components/UI/Alert';
import {
  getReportByDate,
  getReportCharts,
  getSettlementStatusByDate,
  type ReportResponse,
  type ReportTransactionItem,
  type ChartResponse,
  type GetSettlementStatusByDateResponse,
} from '../../services/reportService';
import { ArrowLeft, FileText, Lock, LogOut, User as UserIcon, CreditCard, DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface KasirSummary {
  name: string;
  totalTransactions: number;
  totalSales: number;
}

export default function AdminLaporan() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayStr());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [charts, setCharts] = useState<ChartResponse | null>(null);
  const [settlementStatus, setSettlementStatus] = useState<GetSettlementStatusByDateResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (d: string) => {
    setIsLoadingReport(true);
    setError(null);
    try {
      const [res, statusRes] = await Promise.all([
        getReportByDate(d),
        getSettlementStatusByDate(d),
      ]);
      setReport(res);
      setSettlementStatus(statusRes);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Gagal memuat laporan');
      setReport(null);
      setSettlementStatus(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const fetchCharts = async () => {
    setIsLoadingCharts(true);
    try {
      const data = await getReportCharts(7, 6);
      setCharts(data);
    } catch {
      setCharts(null);
    } finally {
      setIsLoadingCharts(false);
    }
  };

  useEffect(() => {
    fetchReport(date);
  }, [date]);

  useEffect(() => {
    fetchCharts();
  }, []);

  const handleTampilkan = () => {
    fetchReport(date);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (n: number) =>
    n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  const formatDateLabel = (dateStr: string) => {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formatMonthLabel = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
  };

  const kasirSummary = useMemo((): KasirSummary[] => {
    if (!report?.transactions?.length) return [];
    const map = new Map<string, { count: number; sales: number }>();
    for (const t of report.transactions) {
      const name = t.closed_by_user_name || '-';
      const cur = map.get(name) ?? { count: 0, sales: 0 };
      cur.count += 1;
      cur.sales += t.total_amount;
      map.set(name, cur);
    }
    return Array.from(map.entries()).map(([name, { count, sales }]) => ({
      name,
      totalTransactions: count,
      totalSales: sales,
    }));
  }, [report?.transactions]);

  const maxDailySales = charts?.daily?.length
    ? Math.max(...charts.daily.map((d) => d.total_sales), 1)
    : 1;
  const maxMonthlySales = charts?.monthly?.length
    ? Math.max(...charts.monthly.map((m) => m.total_sales), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-200">
      <header className="bg-gray-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-0">
            <div>
              <img src="/logo-dashboard.png" alt="POS Go" className="h-20 w-auto" />
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
                  { label: 'Ubah Password', icon: <Lock size={16} />, onClick: () => navigate('/change-password') },
                  { label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, variant: 'danger' },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-teal-800 hover:text-teal-600 text-sm font-medium flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </button>

        <Card className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={28} className="text-teal-600" />
            Laporan Lengkap
          </h1>
          <p className="text-gray-600 mb-4">
            Filter tanggal untuk melihat ringkasan dan detail transaksi per hari. Grafik 7 hari dan 6 bulan di bawah.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleTampilkan}
              disabled={isLoadingReport}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              <Calendar size={18} />
              {isLoadingReport ? 'Memuat...' : 'Tampilkan'}
            </button>
          </div>
        </Card>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Summary untuk tanggal dipilih */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Transaksi</p>
                  <p className="text-lg font-bold text-gray-900">{report.summary.total_transactions}</p>
                </div>
                <CreditCard size={20} className="text-teal-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Penjualan</p>
                  <p className="text-lg font-bold text-gray-900">Rp {formatCurrency(report.summary.total_sales)}</p>
                </div>
                <DollarSign size={20} className="text-teal-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Tunai</p>
                  <p className="text-lg font-bold text-gray-900">Rp {formatCurrency(report.summary.total_cash)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Non-tunai</p>
                  <p className="text-lg font-bold text-gray-900">Rp {formatCurrency(report.summary.total_non_cash)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Diskon</p>
                  <p className="text-lg font-bold text-gray-900">Rp {formatCurrency(report.summary.total_discount)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pajak</p>
                  <p className="text-lg font-bold text-gray-900">Rp {formatCurrency(report.summary.total_tax)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Grafik 7 hari & 6 bulan */}
        <Card className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pemantauan Transaksi</h3>
          <p className="text-sm text-gray-500 mb-4">7 hari terakhir dan 6 bulan terakhir</p>
          {isLoadingCharts ? (
            <p className="text-gray-500 py-8 text-center">Memuat grafik...</p>
          ) : charts ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pendapatan per Hari</h4>
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
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pendapatan per Bulan</h4>
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
        </Card>

        {/* Status Settlement per Kasir */}
        {settlementStatus && settlementStatus.items.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Status Settlement per Kasir</h3>
            <p className="text-sm text-gray-500 mb-4">
              Daftar kasir yang punya transaksi pada tanggal ini dan status tutup kasir (settlement).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-2 pr-4">Kasir</th>
                    <th className="py-2 pr-4">Expected Tunai</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actual Tunai</th>
                    <th className="py-2 pr-4">Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  {settlementStatus.items.map((item) => (
                    <tr key={item.user_id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-900">{item.user_name}</td>
                      <td className="py-2 pr-4">Rp {formatCurrency(item.expected_cash)}</td>
                      <td className="py-2 pr-4">
                        {item.settlement ? (
                          <span className="inline-flex items-center gap-1 text-green-700">
                            <CheckCircle size={16} />
                            Sudah
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertCircle size={16} />
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {item.settlement != null
                          ? `Rp ${formatCurrency(item.settlement.actual_cash)}`
                          : '-'}
                      </td>
                      <td className="py-2 pr-4">
                        {item.settlement != null
                          ? (() => {
                              const d = item.settlement.discrepancy;
                              return (
                                <span className={d !== 0 ? 'text-amber-700 font-medium' : ''}>
                                  Rp {formatCurrency(d)}
                                </span>
                              );
                            })()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Ringkasan per Kasir */}
        {report && kasirSummary.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ringkasan per Kasir</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-2 pr-4">Kasir</th>
                    <th className="py-2 pr-4">Jumlah Transaksi</th>
                    <th className="py-2 pr-4">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {kasirSummary.map((k) => (
                    <tr key={k.name} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-900">{k.name}</td>
                      <td className="py-2 pr-4">{k.totalTransactions}</td>
                      <td className="py-2 pr-4">Rp {formatCurrency(k.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tabel transaksi */}
        {report && (
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detail Transaksi — {date}</h3>
            {report.transactions.length === 0 ? (
              <p className="text-gray-500 py-6 text-center">Tidak ada transaksi (completed & paid) pada tanggal ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-2 pr-2">No</th>
                      <th className="py-2 pr-2">Waktu</th>
                      <th className="py-2 pr-2">Customer</th>
                      <th className="py-2 pr-2">Tipe</th>
                      <th className="py-2 pr-2">Bayar</th>
                      <th className="py-2 pr-2">Total</th>
                      <th className="py-2 pr-2">Kasir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.map((t: ReportTransactionItem, i: number) => (
                      <tr key={t.id} className="border-b border-gray-100">
                        <td className="py-2 pr-2 text-gray-600">{i + 1}</td>
                        <td className="py-2 pr-2">{formatTime(t.created_at)}</td>
                        <td className="py-2 pr-2 font-medium text-gray-900">{t.customer_name || '-'}</td>
                        <td className="py-2 pr-2">{t.order_type}</td>
                        <td className="py-2 pr-2">{t.payment_method}</td>
                        <td className="py-2 pr-2">Rp {formatCurrency(t.total_amount)}</td>
                        <td className="py-2 pr-2">{t.closed_by_user_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
