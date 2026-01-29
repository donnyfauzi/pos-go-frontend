import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createTransaction, type CreateTransactionRequest } from '../../services/transactionService';
import { getActivePromos, validatePromo, type Promo } from '../../services/promoService';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Alert from '../../components/UI/Alert';
import { Wallet, Banknote, ArrowLeft, Info, Tag, X } from 'lucide-react';
import type { Menu } from '../../types';

interface CartItem {
  menu: Menu;
  quantity: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart: CartItem[] = location.state?.cart || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Promo states
  const [activePromos, setActivePromos] = useState<Promo[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    table_number: '',
    payment_method: 'cash' as 'cash' | 'non_cash',
    notes: '',
  });

  // Fetch active promos on mount
  useEffect(() => {
    const fetchActivePromos = async () => {
      setIsLoadingPromos(true);
      try {
        const promos = await getActivePromos();
        setActivePromos(promos);
      } catch (err) {
        console.error('Failed to fetch promos:', err);
        // Silent fail - promos are optional
      } finally {
        setIsLoadingPromos(false);
      }
    };

    fetchActivePromos();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getSubtotal = (): number => {
    return cart.reduce((total, item) => total + item.menu.price * item.quantity, 0);
  };

  const getSubtotalAfterDiscount = (): number => {
    const subtotal = getSubtotal();
    return subtotal - promoDiscount;
  };

  const getTax = (): number => {
    // PPN 10% dihitung dari subtotal setelah discount
    return getSubtotalAfterDiscount() * 0.10;
  };

  const getTotalPrice = (): number => {
    return getSubtotalAfterDiscount() + getTax();
  };

  // Handle promo selection
  const handleSelectPromo = async (promo: Promo) => {
    setPromoError(null);
    const subtotal = getSubtotal();

    try {
      const result = await validatePromo({
        code: promo.code,
        subtotal: subtotal,
      });

      setSelectedPromo(promo);
      setPromoDiscount(result.discount);
      setPromoError(null);
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Promo tidak dapat digunakan');
      setSelectedPromo(null);
      setPromoDiscount(0);
    }
  };

  // Handle remove promo
  const handleRemovePromo = () => {
    setSelectedPromo(null);
    setPromoDiscount(0);
    setPromoError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePaymentMethodChange = (method: 'cash' | 'non_cash') => {
    setFormData((prev) => ({ ...prev, payment_method: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.customer_name.trim()) {
      setError('Nama harus diisi');
      return;
    }

    if (!formData.customer_phone.trim()) {
      setError('Nomor telepon harus diisi');
      return;
    }

    if (cart.length === 0) {
      setError('Keranjang kosong');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: CreateTransactionRequest = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        table_number: formData.table_number ? parseInt(formData.table_number) : undefined,
        // Kirim 'e_wallet' untuk non_cash payment ke backend (Midtrans akan handle detail payment method)
        payment_method: formData.payment_method === 'cash' ? 'cash' : 'e_wallet',
        notes: formData.notes || undefined,
        promo_code: selectedPromo?.code || undefined,
        items: cart.map((item) => ({
          menu_id: item.menu.id,
          quantity: item.quantity,
        })),
      };

      const response = await createTransaction(requestData);

      // FLOW BERBEDA: Cash vs Non-Cash
      if (formData.payment_method === 'cash') {
        // CASH: Show success message dan redirect ke menu setelah 5 detik
        setSuccess('Pesanan berhasil dibuat! Anda akan diarahkan ke menu dalam beberapa detik...');
        setIsSubmitting(false);
        
        // Scroll ke atas untuk melihat success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Redirect ke menu setelah 5 detik
        setTimeout(() => {
          navigate('/menu');
        }, 5000);
      } else {
        // NON-CASH: Buka Midtrans Snap
        if (response.snap_token) {
          // Check if window.snap is available
          if (typeof window.snap === 'undefined') {
            setError('Midtrans belum siap. Silakan refresh halaman.');
            setIsSubmitting(false);
            return;
          }

          window.snap.pay(response.snap_token, {
            onSuccess: (result) => {
              console.log('Payment success:', result);
              // Tutup modal Midtrans terlebih dahulu
              if (typeof window.snap !== 'undefined' && window.snap.hide) {
                window.snap.hide();
              }
              
              // Tampilkan success message
              setSuccess('Pembayaran berhasil! Pesanan Anda sedang diproses. Anda akan diarahkan ke menu...');
              setIsSubmitting(false);
              
              // Scroll ke atas agar user lihat success message
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 100);
              
              // Redirect ke menu setelah 5 detik
              setTimeout(() => {
                navigate('/menu');
              }, 5000);
            },
            onPending: (result) => {
              console.log('Payment pending:', result);
              navigate(`/payment-pending/${response.id}`);
            },
            onError: (result) => {
              console.error('Payment error:', result);
              setError('Pembayaran gagal. Silakan coba lagi.');
              setIsSubmitting(false);
            },
            onClose: () => {
              console.log('Popup closed by user');
              // Inform user mereka masih bisa bayar nanti
              const expiredInfo = response.expired_at 
                ? ` Anda dapat melanjutkan pembayaran hingga ${new Date(response.expired_at).toLocaleString('id-ID')}.`
                : ' Anda dapat melanjutkan pembayaran dalam 24 jam.';
              
              alert('Pembayaran belum selesai. Link pembayaran telah dikirim ke email/SMS Anda.' + expiredInfo);
              // User close popup, arahkan ke pending page
              navigate(`/payment-pending/${response.id}`);
            }
          });
        } else {
          setError('Gagal mendapatkan token pembayaran');
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan');
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return 'Memproses...';
    if (formData.payment_method === 'cash') return 'Buat Pesanan';
    return 'Lanjut ke Pembayaran';
  };

  const paymentMethods = [
    { 
      value: 'cash', 
      label: 'Tunai', 
      icon: Banknote,
      description: 'Bayar langsung di kasir',
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-500',
      iconColor: 'text-white'
    },
    { 
      value: 'non_cash', 
      label: 'Non-Tunai', 
      icon: Wallet,
      description: 'QRIS, Transfer, E-Wallet, Kartu Kredit',
      gradient: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      iconColor: 'text-white'
    },
  ];

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Keranjang Kosong</h2>
          <p className="text-gray-600 mb-6">Silakan pilih menu terlebih dahulu</p>
          <Button onClick={() => navigate('/menu')} className="w-full">
            Kembali ke Menu
          </Button>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/menu')}
            className="text-teal-800 hover:text-teal-600 text-sm font-medium flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Kembali ke Menu
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {success && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-400 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">Berhasil!</h3>
                  <p className="text-green-800 text-lg">{success}</p>
                  <div className="mt-3 bg-white/60 rounded-lg p-3 inline-block">
                    <p className="text-sm text-green-700 font-medium">
                      Mengalihkan ke halaman menu...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Customer Information */}
              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Pelanggan</h2>
                <div className="space-y-4">
                  <Input
                    label="Nama Lengkap"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                  <Input
                    label="Nomor Telepon"
                    name="customer_phone"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                  <Input
                    label="Email (Opsional)"
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                  <Input
                    label="Nomor Meja (Opsional)"
                    name="table_number"
                    type="number"
                    value={formData.table_number}
                    onChange={handleInputChange}
                    placeholder="Contoh: 5"
                  />
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Metode Pembayaran</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = formData.payment_method === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => handlePaymentMethodChange(method.value as any)}
                        className={`relative p-6 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? `border-2 ${method.borderColor} ${method.bgColor} shadow-lg transform scale-105`
                            : 'border-2 border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          {/* Icon with gradient background */}
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${method.gradient} flex items-center justify-center shadow-md`}>
                            <Icon size={32} className={method.iconColor} />
                          </div>
                          
                          {/* Label */}
                          <div className="text-center">
                            <span className="font-bold text-lg text-gray-900 block">{method.label}</span>
                            <span className="text-xs text-gray-600 mt-1 block">{method.description}</span>
                          </div>

                          {/* Selected indicator */}
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${method.gradient} flex items-center justify-center`}>
                                <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Promo Section */}
              {activePromos.length > 0 && (
                <Card className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="text-teal-600" size={20} />
                    <h2 className="text-xl font-bold text-gray-900">Promo Tersedia</h2>
                  </div>
                  
                  {promoError && (
                    <div className="mb-4">
                      <Alert type="error" message={promoError} />
                    </div>
                  )}

                  {selectedPromo ? (
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-400 rounded-lg p-4 mb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="text-teal-600" size={18} />
                            <span className="font-bold text-teal-900">{selectedPromo.code}</span>
                            <span className="text-sm text-teal-700">- {selectedPromo.name}</span>
                          </div>
                          {selectedPromo.description && (
                            <p className="text-sm text-teal-700 mb-2">{selectedPromo.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-teal-700">
                              Diskon: {selectedPromo.type === 'percentage' 
                                ? `${selectedPromo.value}%` 
                                : `Rp ${formatCurrency(selectedPromo.value)}`}
                            </span>
                            {selectedPromo.min_purchase > 0 && (
                              <span className="text-teal-600">
                                Min. belanja: Rp {formatCurrency(selectedPromo.min_purchase)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-lg font-bold text-teal-900">
                            Hemat: Rp {formatCurrency(promoDiscount)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="flex-shrink-0 text-teal-600 hover:text-teal-800 transition-colors"
                          title="Hapus promo"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activePromos.map((promo) => (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => handleSelectPromo(promo)}
                          className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className="text-teal-600" size={16} />
                              <span className="font-bold text-gray-900">{promo.code}</span>
                            </div>
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
                              {promo.type === 'percentage' ? `${promo.value}%` : `Rp ${formatCurrency(promo.value)}`}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{promo.name}</h3>
                          {promo.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{promo.description}</p>
                          )}
                          {promo.min_purchase > 0 && (
                            <p className="text-xs text-gray-500">
                              Min. belanja: Rp {formatCurrency(promo.min_purchase)}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Notes */}
              <Card className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Catatan (Opsional)</h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Tambahkan catatan untuk pesanan Anda..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </Card>

              {/* Info untuk non-cash */}
              {formData.payment_method === 'non_cash' && (
                <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 flex gap-3">
                  <Info className="text-blue-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Pembayaran Digital
                    </p>
                    <p className="text-xs text-blue-700">
                      Anda akan diarahkan ke halaman pembayaran . Pilih metode pembayaran yang anda inginkan: QRIS, Transfer Bank, GoPay, OVO, Dana, ShopeePay, Kartu Kredit/Debit, dan lainnya.
                    </p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {getButtonText()}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.menu.id} className="flex gap-3 pb-4 border-b border-gray-200">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${item.menu.image}`}
                      alt={item.menu.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.menu.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.quantity} x Rp {formatCurrency(item.menu.price)}
                      </p>
                      <p className="text-sm font-medium text-teal-600">
                        Rp {formatCurrency(item.menu.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rp {formatCurrency(getSubtotal())}</span>
                </div>
                {selectedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Tag size={14} className="text-teal-600" />
                      Diskon ({selectedPromo.code})
                    </span>
                    <span className="font-medium text-teal-600">- Rp {formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">PPN 10%</span>
                  <span className="font-medium">Rp {formatCurrency(getTax())}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-3">
                  <span>Total Pembayaran</span>
                  <span className="text-teal-600">Rp {formatCurrency(getTotalPrice())}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
