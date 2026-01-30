import { useForm } from 'react-hook-form';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Alert from '../UI/Alert';

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'kasir' | 'koki';
}

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'kasir',
    },
  });

  const onSubmitForm = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      reset(); // Reset form setelah berhasil
    } catch (err) {
      // Error handling di parent component
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <Input
        label="Nama Lengkap *"
        type="text"
        placeholder="Masukkan nama lengkap"
        error={errors.name?.message}
        {...register('name', {
          required: 'Nama wajib diisi',
          minLength: {
            value: 3,
            message: 'Nama minimal 3 karakter',
          },
        })}
      />

      <Input
        label="Email *"
        type="email"
        placeholder="nama@email.com"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email wajib diisi',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Format email tidak valid',
          },
        })}
      />

      <Input
        label="Password *"
        type="password"
        placeholder="Minimal 6 karakter"
        error={errors.password?.message}
        {...register('password', {
          required: 'Password wajib diisi',
          minLength: {
            value: 6,
            message: 'Password minimal 6 karakter',
          },
        })}
      />

      {/* Role selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700">Role User *</p>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              value="kasir"
              {...register('role', { required: true })}
              className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
            />
            <span>Kasir</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              value="koki"
              {...register('role', { required: true })}
              className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
            />
            <span>Koki</span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Hanya admin yang dapat membuat user baru. 
          Pilih role <strong>Kasir</strong> untuk pengguna kasir, atau <strong>Koki</strong> untuk pengguna dapur.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
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
          Daftarkan User
        </Button>
      </div>
    </form>
  );
}

