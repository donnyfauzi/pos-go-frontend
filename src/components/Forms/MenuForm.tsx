import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { categoryService } from '../../services/categoryService';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Textarea from '../UI/Textarea';
import Select from '../UI/Select';
import FileInput from '../UI/FileInput';
import Alert from '../UI/Alert';
import type { Category, Menu } from '../../types';

export interface MenuFormData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_available: boolean;
}

interface MenuFormProps {
  onSubmit: (data: MenuFormData, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Menu; // Untuk edit mode
  initialImageFile?: File | null;
}

export default function MenuForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  initialImageFile = null,
}: MenuFormProps) {
  const [error, setError] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(initialImageFile);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MenuFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      category_id: initialData?.category_id || '',
      is_available: initialData?.is_available ?? false,
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
    const value = e.target.value.replace(/[^0-9]/g, '');
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

  // Reset form when modal closes (when initialData changes)
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        category_id: initialData.category_id,
        is_available: initialData.is_available,
      });
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        category_id: '',
        is_available: false,
      });
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
    }
    setError('');
  }, [initialData, reset]);

  const onSubmitForm = async (data: MenuFormData) => {
    // Jika edit mode dan tidak ada file baru, tidak perlu validasi file
    if (!initialData && !selectedFile) {
      setError('Gambar menu wajib diisi');
      return;
    }

    setError('');
    try {
      await onSubmit(data, selectedFile);
      // Reset form setelah berhasil (jika create mode)
      if (!initialData) {
        reset({
          name: '',
          description: '',
          price: 0,
          category_id: '',
          is_available: false,
        });
        setSelectedFile(null);
        setFileInputKey((prev) => prev + 1);
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(typeof firstError === 'string' ? firstError : 'Validasi gagal');
      } else {
        setError('Terjadi kesalahan, silahkan coba lagi');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {/* Error Message */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

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
            label={initialData ? 'Gambar Menu' : 'Gambar Menu *'}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            maxSize={5}
            onFileChange={setSelectedFile}
            preview={initialData?.image ? `${import.meta.env.VITE_API_URL}/${initialData.image}` : null}
            error={!initialData && !selectedFile && error ? 'Gambar menu wajib diisi' : undefined}
          />
          {initialData && (
            <p className="text-sm text-gray-500 mt-2">
              Kosongkan jika tidak ingin mengubah gambar
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
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
          {initialData ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

