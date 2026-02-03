import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Dropdown from '../../components/UI/Dropdown';
import Alert from '../../components/UI/Alert';
import DateTimeWidget from '../../components/UI/DateTimeWidget';
import {
  getReportByDate,
  getSettlement,
  createSettlement,
  type ReportResponse,
  type GetSettlementResponse,
} from '../../services/reportService';
import { ArrowLeft, FileText, Lock, LogOut, User as UserIcon, Wallet } from 'lucide-react';

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function LaporanSettlement() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayStr());
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [settlementData, setSettlementData] = useState<GetSettlementResponse | null>(null);
  const [actualCash, setActualCash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async (d: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [reportRes, settlementRes] = await Promise.all([
        getReportByDate(d),
        getSettlement(d),
      ]);
      setReport(reportRes);
      setSettlementData(settlementRes);
      if (settlementRes.settlement) {
        setActualCash(settlementRes.settlement.actual_cash.toString());
      } else {
        setActualCash('');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal memuat laporan');
      setReport(null);
      setSettlementData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date);
  }, []);

  const handleTampilkan = () => {
    fetchData(date);
  };

  const handleSimpanSettlement = async () => {
    const actual = parseFloat(actualCash.replace(/\./g, '').replace(',', '.'));
    if (Number.isNaN(actual) || actual < 0) {
      setError('Masukkan jumlah uang tunai yang valid');
      return;
    }
    if (settlementData?.settlement) {
      setError('Settlement untuk tanggal ini sudah tersimpan');
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createSettlement(date, actual);
      setSuccess('Settlement berhasil disimpan');
      fetchData(date);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal menyimpan settlement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (amount: number) =>
    amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const expectedCash = settlementData?.expected_cash ?? 0;
  const actualNum = actualCash ? parseFloat(actualCash.replace(/\./g, '').replace(',', '.')) : 0;
  const discrepancy = Number.isNaN(actualNum) ? 0 : actualNum - expectedCash;
  const hasSettlement = !!settlementData?.settlement;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header - konsisten dengan Dashboard Kasir */}
      <header className="bg-white shadow-md">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/kasir/dashboard')}
          className="text-teal-800 hover:text-teal-600 text-sm font-medium flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Settlement</h1>
          <p className="text-gray-600 text-sm mt-1">Laporan harian dan tutup kasir</p>
        </div>

        {/* Pilih periode */}
        <Card className="mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Button onClick={handleTampilkan} disabled={isLoading}>
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </Card>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} className="mb-4" />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} className="mb-4" />
        )}

        {report && (
          <>
            {/* Laporan Harian - kartu ringkasan */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={20} />
                Laporan Harian
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
                  <p className="text-xl font-bold text-gray-900">{report.summary.total_transactions}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Penjualan</p>
                  <p className="text-lg font-bold text-teal-700">
                    Rp {formatCurrency(report.summary.total_sales)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-1">Tunai</p>
                  <p className="text-lg font-bold text-gray-800">
                    Rp {formatCurrency(report.summary.total_cash)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-1">Non-Tunai</p>
                  <p className="text-lg font-bold text-gray-800">
                    Rp {formatCurrency(report.summary.total_non_cash)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-1">Diskon</p>
                  <p className="text-lg font-bold text-gray-800">
                    Rp {formatCurrency(report.summary.total_discount)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-1">PPN 10%</p>
                  <p className="text-lg font-bold text-gray-800">
                    Rp {formatCurrency(report.summary.total_tax)}
                  </p>
                </Card>
              </div>
            </div>

            {/* Tabel detail transaksi */}
            <Card className="mb-6 overflow-hidden">
              <p className="text-sm font-semibold text-gray-700 mb-3">Detail Transaksi</p>
              {report.transactions.length === 0 ? (
                <p className="text-gray-500 text-sm">Tidak ada transaksi untuk tanggal ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-2 px-3">No</th>
                        <th className="text-left py-2 px-3">Waktu</th>
                        <th className="text-left py-2 px-3">Pelanggan</th>
                        <th className="text-left py-2 px-3">Pembayaran</th>
                        <th className="text-left py-2 px-3">Kasir</th>
                        <th className="text-right py-2 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.transactions.map((t, i) => (
                        <tr key={t.id} className="border-b border-gray-100">
                          <td className="py-2 px-3">{i + 1}</td>
                          <td className="py-2 px-3">{formatTime(t.created_at)}</td>
                          <td className="py-2 px-3">{t.customer_name}</td>
                          <td className="py-2 px-3">
                            {t.payment_method === 'cash' ? 'Tunai' : 'Non-Tunai'}
                          </td>
                          <td className="py-2 px-3">{t.closed_by_user_name}</td>
                          <td className="py-2 px-3 text-right font-medium">
                            Rp {formatCurrency(t.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Settlement */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wallet size={20} />
                Settlement (Tutup Kasir)
              </h2>
              <Card className="max-w-md">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Uang tunai yang seharusnya (dari sistem)
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-semibold text-gray-900">
                      Rp {formatCurrency(expectedCash)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Uang tunai yang diserahkan kasir
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      disabled={hasSettlement}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selisih</label>
                    <div
                      className={`px-3 py-2 rounded-lg font-semibold ${
                        discrepancy === 0
                          ? 'bg-gray-100 text-gray-800'
                          : discrepancy < 0
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {discrepancy >= 0 ? '+' : ''}Rp {formatCurrency(discrepancy)}
                    </div>
                  </div>
                  {hasSettlement ? (
                    <p className="text-sm text-teal-600 font-medium">Settlement untuk tanggal ini sudah tersimpan.</p>
                  ) : (
                    <Button
                      onClick={handleSimpanSettlement}
                      disabled={isSaving}
                      className="w-full"
                    >
                      {isSaving ? 'Menyimpan...' : 'Simpan Settlement / Tutup Kasir'}
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}

        {!report && !isLoading && (
          <Card className="py-8 text-center text-gray-500">
            Pilih tanggal dan klik Tampilkan untuk melihat laporan.
          </Card>
        )}
      </main>
    </div>
  );
}
