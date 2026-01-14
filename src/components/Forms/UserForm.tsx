import { useForm } from 'react-hook-form';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Alert from '../UI/Alert';

export interface UserFormData {
  name: string;
  email: string;
  password: string;
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> User yang dibuat akan memiliki role <strong>Kasir</strong>. 
          Hanya admin yang dapat melakukan registrasi user baru.
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

