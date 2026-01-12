import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import Alert from '../../components/UI/Alert';
import type { RegisterRequest } from '../../types';

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>();

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError('');

    try {
      // Role selalu 'kasir' karena hanya admin yang bisa register, dan hanya bisa register kasir
      const registerData: RegisterRequest = {
        ...data,
        role: 'kasir',
      };

      const response = await authService.register(registerData);

      if (response.success) {
        // Success - redirect ke dashboard admin
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      // Handle error dari API
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Validation errors
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

      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrasi User Kasir</h1>
          <p className="text-gray-600">Tambahkan user kasir baru ke sistem</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-xl">
          {/* Error Message */}
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
            />
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Masukkan nama lengkap"
              {...register('name', {
                required: 'Nama wajib diisi',
                minLength: {
                  value: 3,
                  message: 'Nama minimal 3 karakter',
                },
              })}
              error={errors.name?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              {...register('email', {
                required: 'Email wajib diisi',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Format email tidak valid',
                },
              })}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              {...register('password', {
                required: 'Password wajib diisi',
                minLength: {
                  value: 6,
                  message: 'Password minimal 6 karakter',
                },
              })}
              error={errors.password?.message}
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
                onClick={() => navigate('/admin/dashboard')}
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
        </Card>
      </div>
    </div>
  );
}
