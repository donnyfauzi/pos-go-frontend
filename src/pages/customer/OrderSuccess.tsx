import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { CheckCircle2, Home } from 'lucide-react';
import { getTransactionById, type TransactionResponse } from '../../services/transactionService';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) {
        navigate('/menu');
        return;
      }

      try {
        const data = await getTransactionById(id);
        setTransaction(data);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Gagal memuat data transaksi');
        setTimeout(() => navigate('/menu'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Transaksi tidak ditemukan'}</p>
            <Button onClick={() => navigate('/menu')}>Kembali ke Menu</Button>
          </div>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tunai',
      credit_card: 'Kartu Kredit',
      debit_card: 'Kartu Debit',
      e_wallet: 'E-Wallet',
    };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      {/* Header */}
      <header className="bg-gray-100 shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <img src="/logo-dashboard.png" alt="POS Go" className="h-16 w-auto" />
            </div>
          </div>
        </div>
      </header>

      {/* Success Card */}
      <div className="max-w-2xl w-full mt-24">
        <Card>
          {/* Success Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Berhasil!</h1>
            <p className="text-gray-600 text-center">
              Terima kasih atas pesanan Anda. Pesanan sedang diproses.
            </p>
          </div>

          {/* Transaction Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Detail Pesanan</h2>

            {/* Transaction ID */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">ID Transaksi</p>
              <p className="font-mono text-sm font-medium text-gray-900 break-all">
                {transaction.id}
              </p>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nama</p>
                <p className="font-medium text-gray-900">{transaction.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Telepon</p>
                <p className="font-medium text-gray-900">{transaction.customer_phone}</p>
              </div>
              {transaction.customer_email && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{transaction.customer_email}</p>
                </div>
              )}
              {transaction.table_number && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nomor Meja</p>
                  <p className="font-medium text-gray-900">Meja {transaction.table_number}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Pesanan</p>
              <div className="space-y-2">
                {transaction.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.menu_name}</p>
                      <p className="text-gray-600">
                        {item.quantity} x Rp {formatCurrency(item.menu_price)}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      Rp {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600 mb-1">Metode Pembayaran</p>
                <p className="font-medium text-gray-900">
                  {getPaymentMethodLabel(transaction.payment_method)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status Pembayaran</p>
                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                  {transaction.payment_status === 'pending' ? 'Menunggu' : transaction.payment_status}
                </span>
              </div>
            </div>

            {/* Total Amount */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-gray-700">
                <p>Subtotal</p>
                <p className="font-medium">Rp {formatCurrency(transaction.subtotal)}</p>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <p>PPN 10%</p>
                <p className="font-medium">Rp {formatCurrency(transaction.tax)}</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                <p className="text-lg font-bold text-gray-900">Total Pembayaran</p>
                <p className="text-2xl font-bold text-teal-600">
                  Rp {formatCurrency(transaction.total_amount)}
                </p>
              </div>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Catatan</p>
                <p className="text-sm text-gray-900">{transaction.notes}</p>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={() => navigate('/menu')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Kembali ke Menu
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
