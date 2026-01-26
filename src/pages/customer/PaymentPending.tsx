import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransactionById, type TransactionResponse } from '../../services/transactionService';
import { Loader2, Clock, ArrowLeft } from 'lucide-react';
import Card from '../../components/UI/Card';

export default function PaymentPending() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const calculateTimeRemaining = (expiredAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiredAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      return 'Kadaluarsa';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours} jam ${minutes} menit ${seconds} detik`;
  };

  useEffect(() => {
    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval>;

    const checkPaymentStatus = async () => {
      if (!id) return;

      try {
        const data = await getTransactionById(id);
        
        if (!isMounted) return;

        setTransaction(data);
        setIsLoading(false);

        // Jika sudah paid, redirect ke success
        if (data.payment_status === 'paid') {
          clearInterval(pollInterval);
          navigate(`/order-success/${id}`);
        }

        // Jika cancelled atau expired
        if (data.payment_status === 'cancelled' || data.payment_status === 'expired') {
          clearInterval(pollInterval);
          const message = data.payment_status === 'expired' 
            ? 'Pembayaran kadaluarsa. Batas waktu pembayaran telah habis.'
            : 'Pembayaran dibatalkan';
          setError(message);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error('Error checking payment:', error);
        setError('Gagal mengecek status pembayaran');
        setIsLoading(false);
      }
    };

    // Initial check
    checkPaymentStatus();

    // Polling setiap 3 detik
    pollInterval = setInterval(checkPaymentStatus, 3000);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [id, navigate]);

  // Update countdown timer setiap detik
  useEffect(() => {
    if (!transaction || !transaction.expired_at) return;

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(transaction.expired_at!));
    };

    // Update immediately
    updateTimer();

    // Update every second
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [transaction]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-teal-600" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Memuat...</h2>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/menu')}
            className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            Kembali ke Menu
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-gray-100 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <img src="/logo-dashboard.png" alt="POS Go" className="h-16 w-auto" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/menu')}
            className="text-teal-800 hover:text-teal-600 text-sm font-medium flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Kembali ke Menu
          </button>
        </div>

        <Card className="text-center">
          {/* Animation */}
          <div className="bg-yellow-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Clock className="text-yellow-600 animate-pulse" size={48} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Menunggu Pembayaran
          </h1>
          
          <p className="text-gray-600 mb-8">
            Silakan selesaikan pembayaran Anda. Halaman ini akan otomatis update saat pembayaran berhasil.
          </p>

          {transaction && (
            <>
              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">Detail Transaksi</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm text-gray-900">{transaction.id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama:</span>
                    <span className="font-medium text-gray-900">{transaction.customer_name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode Pembayaran:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {transaction.payment_method.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Menunggu Pembayaran
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Pembayaran:</span>
                      <span className="text-2xl font-bold text-teal-600">
                        Rp {formatCurrency(transaction.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiration Time */}
              {transaction.expired_at && timeRemaining !== 'Kadaluarsa' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-yellow-900 mb-1">Batas Waktu Pembayaran</p>
                      <p className="text-2xl font-bold text-yellow-700 mb-2">{timeRemaining}</p>
                      <p className="text-sm text-yellow-800">
                        Berakhir pada: {new Date(transaction.expired_at).toLocaleString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {timeRemaining === 'Kadaluarsa' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <p className="font-bold text-red-900 mb-1">Pembayaran Kadaluarsa</p>
                      <p className="text-sm text-red-800">
                        Batas waktu pembayaran telah habis. Silakan buat pesanan baru.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h2 className="font-bold text-gray-900 mb-4 text-lg">Item Pesanan</h2>
                <div className="space-y-3">
                  {transaction.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{item.menu_name}</p>
                        <p className="text-sm text-gray-600">
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

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tips:</strong> Jika Anda menutup halaman pembayaran, silakan selesaikan pembayaran melalui email atau SMS yang dikirimkan.
                </p>
              </div>
            </>
          )}

          {/* Loading indicator for polling */}
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Loader2 className="animate-spin" size={16} />
            <span>Mengecek status pembayaran...</span>
          </div>
        </Card>
      </main>
    </div>
  );
}
