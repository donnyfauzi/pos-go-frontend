import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { transactionService } from '../../services/transactionService';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Alert from '../../components/UI/Alert';
import { CreditCard, Wallet, Banknote, ArrowLeft } from 'lucide-react';
import type { Menu, CreateTransactionRequest } from '../../types';

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

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    table_number: '',
    payment_method: 'cash' as 'cash' | 'credit_card' | 'debit_card' | 'e_wallet',
    notes: '',
  });

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getTotalPrice = (): number => {
    return cart.reduce((total, item) => total + item.menu.price * item.quantity, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePaymentMethodChange = (method: 'cash' | 'credit_card' | 'debit_card' | 'e_wallet') => {
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
        payment_method: formData.payment_method,
        notes: formData.notes || undefined,
        items: cart.map((item) => ({
          menu_id: item.menu.id,
          quantity: item.quantity,
        })),
      };

      const response = await transactionService.createTransaction(requestData);
      setSuccess(response.message || 'Pesanan berhasil dibuat!');

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        navigate('/order-success', { state: { transaction: response.data } });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Tunai', icon: Banknote },
    { value: 'credit_card', label: 'Kartu Kredit', icon: CreditCard },
    { value: 'debit_card', label: 'Kartu Debit', icon: CreditCard },
    { value: 'e_wallet', label: 'E-Wallet', icon: Wallet },
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
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert type="success">{success}</Alert>
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
                <div className="grid grid-cols-2 gap-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => handlePaymentMethodChange(method.value as any)}
                        className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
                          formData.payment_method === method.value
                            ? 'border-teal-600 bg-teal-50 text-teal-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={32} />
                        <span className="font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
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
                  <span className="font-medium">Rp {formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Pajak & Biaya</span>
                  <span className="font-medium">Rp 0</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
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
