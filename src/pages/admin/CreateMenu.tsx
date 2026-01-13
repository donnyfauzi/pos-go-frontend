import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { categoryService } from '../../services/categoryService';
import { menuService } from '../../services/menuService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Textarea from '../../components/UI/Textarea';
import Select from '../../components/UI/Select';
import FileInput from '../../components/UI/FileInput';
import Alert from '../../components/UI/Alert';
import type { Category } from '../../types';

interface CreateMenuForm {
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_available: boolean;
}

export default function CreateMenu() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0); // Key untuk reset FileInput
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateMenuForm>({
    defaultValues: {
      is_available: false,
      price: 0,
    },
  });

  // Register price dengan validation
  register('price', {
    required: 'Harga wajib diisi',
    min: { value: 0, message: 'Harga minimal 0' },
    valueAsNumber: true,
  });

  const isAvailable = watch('is_available');
  const priceValue = watch('price');

  // Format currency: Rp 25.000
  const formatCurrency = (value: number | string | undefined): string => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle price input change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Hanya angka
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setValue('price', numValue, { shouldValidate: true });
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (err: any) {
        setError('Gagal memuat daftar kategori');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (data: CreateMenuForm) => {
    if (!selectedFile) {
      setError('Gambar menu wajib diisi');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await menuService.createMenu({
        ...data,
        image: selectedFile,
      });

      // Ambil success message dari backend
      if (response.success && response.message) {
        setSuccess(response.message);
      } else {
        setSuccess('Menu berhasil ditambahkan');
      }
      
      // Reset form setelah berhasil
      reset({
        name: '',
        description: '',
        price: 0,
        category_id: '',
        is_available: false,
      });
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1); // Force re-render FileInput
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(typeof firstError === 'string' ? firstError : 'Validasi gagal');
      } else {
        setError('Terjadi kesalahan, silahkan coba lagi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button - Fixed di pojok kiri atas */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
        >
          ← Kembali ke Dashboard
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tambah Menu Baru</h1>
          <p className="text-gray-600">Tambahkan menu baru ke sistem</p>
        </div>

        {/* Create Menu Card */}
        <Card className="shadow-xl">
          {/* Success Message */}
          {success && (
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess('')}
            />
          )}

          {/* Error Message */}
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
            />
          )}

          {/* Create Menu Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <Input
                  label="Nama Menu *"
                  placeholder="Masukan nama menu"
                  error={errors.name?.message}
                  {...register('name', { required: 'Nama menu wajib diisi' })}
                />

                <Select
                  label="Kategori *"
                  placeholder="Pilih kategori"
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  error={errors.category_id?.message}
                  disabled={isLoadingCategories}
                  defaultValue=""
                  {...register('category_id', {
                    required: 'Kategori wajib dipilih',
                  })}
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="0"
                      value={priceValue ? formatCurrency(priceValue) : ''}
                      onChange={handlePriceChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                <Textarea
                  label="Deskripsi"
                  placeholder="Deskripsi menu..."
                  rows={4}
                  error={errors.description?.message}
                  {...register('description')}
                />

                <div className="mb-4">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-medium text-gray-700">
                      Menu tersedia untuk dijual
                    </span>
                    <button
                      type="button"
                      onClick={() => setValue('is_available', !isAvailable)}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{
                        backgroundColor: isAvailable ? '#2563eb' : '#d1d5db'
                      }}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                          isAvailable ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <FileInput
                  key={fileInputKey}
                  label="Gambar Menu *"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  maxSize={5}
                  onFileChange={setSelectedFile}
                  error={!selectedFile && error ? 'Gambar menu wajib diisi' : undefined}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/dashboard')}
                disabled={isLoading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="flex-1"
              >
                Simpan
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}