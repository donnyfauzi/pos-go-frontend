import { useState } from 'react';
import Input from '../UI/Input';
import Button from '../UI/Button';
import Select from '../UI/Select';
import Textarea from '../UI/Textarea';
import Alert from '../UI/Alert';
import type { CreatePromoRequest } from '../../services/promoService';

interface PromoFormProps {
  initialData?: CreatePromoRequest & { id?: string };
  onSubmit: (data: CreatePromoRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading: boolean;
}

export default function PromoForm({ initialData, onSubmit, onCancel, isLoading }: PromoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePromoRequest>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'percentage',
    value: initialData?.value || 0,
    min_purchase: initialData?.min_purchase ?? 0,
    max_discount: initialData?.max_discount ?? 0,
    usage_limit: initialData?.usage_limit ?? 0,
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    is_active: initialData?.is_active ?? true,
  });

  // Format currency: 25.000
  const formatCurrency = (value: number | string | undefined): string => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle currency input change
  const handleCurrencyChange = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setFormData(prev => ({ ...prev, [fieldName]: numValue }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      // Jika value kosong, set sebagai 0, jika tidak parse sebagai float
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }));
    } else if (name === 'type') {
      // Reset value ketika tipe berubah
      setFormData(prev => ({ ...prev, type: value as 'percentage' | 'fixed', value: 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.code.trim()) {
      setError('Kode promo harus diisi');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nama promo harus diisi');
      return;
    }

    if (formData.value <= 0) {
      setError('Nilai promo harus lebih dari 0');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError('Tanggal mulai dan berakhir harus diisi');
      return;
    }

    // Format tanggal dengan waktu default jika hanya tanggal yang dipilih
    let startDate = formData.start_date;
    let endDate = formData.end_date;

    // Jika format hanya YYYY-MM-DD (10 karakter), tambahkan waktu default dalam format RFC3339
    if (startDate.length === 10) {
      startDate = `${startDate}T00:00:00Z`;
    }
    if (endDate.length === 10) {
      endDate = `${endDate}T23:59:59Z`;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('Tanggal berakhir harus lebih besar dari tanggal mulai');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        start_date: startDate,
        end_date: endDate,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan promo');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          <Input
            label="Kode Promo*"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="HEMAT20"
            required
          />

          <Input
            label="Nama Promo*"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Diskon 20%"
            required
          />

          <Select
            label="Tipe Promo*"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={[
              { value: 'percentage', label: 'Persentase (%)' },
              { value: 'fixed', label: 'Nominal Tetap (Rp)' },
            ]}
            required
          />

          {formData.type === 'percentage' ? (
            <Input
              label="Nilai (%)*"
              name="value"
              type="number"
              value={formData.value || ''}
              onChange={handleChange}
              placeholder="20"
              required
            />
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nilai (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={formData.value ? formatCurrency(formData.value) : ''}
                  onChange={handleCurrencyChange('value')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <Textarea
            label="Deskripsi"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Deskripsi promo..."
            rows={4}
          />
        </div>

        {/* Right Column */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Pembelian (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="text"
                placeholder="0 = tidak ada minimum"
                value={formData.min_purchase ? formatCurrency(formData.min_purchase) : ''}
                onChange={handleCurrencyChange('min_purchase')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maksimum Diskon (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="text"
                placeholder="0 = unlimited"
                value={formData.max_discount ? formatCurrency(formData.max_discount) : ''}
                onChange={handleCurrencyChange('max_discount')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <Input
            label="Batas Penggunaan"
            name="usage_limit"
            type="number"
            value={formData.usage_limit || ''}
            onChange={handleChange}
            placeholder="0 = unlimited"
          />

          <div>
            <Input
              label="Tanggal Mulai*"
              name="start_date"
              type="date"
              value={formData.start_date ? formData.start_date.slice(0, 10) : ''}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 -mt-3 mb-4">Waktu mulai: 00:00:00</p>
          </div>

          <div>
            <Input
              label="Tanggal Berakhir*"
              name="end_date"
              type="date"
              value={formData.end_date ? formData.end_date.slice(0, 10) : ''}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 -mt-3 mb-4">Waktu berakhir: 23:59:59</p>
          </div>

          <div className="mb-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-gray-700">
                Promo Aktif
              </span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{
                  backgroundColor: formData.is_active ? '#2563eb' : '#d1d5db'
                }}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                    formData.is_active ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Batal
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          {initialData?.id ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}