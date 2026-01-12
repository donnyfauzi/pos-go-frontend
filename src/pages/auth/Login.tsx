import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Alert from '../../components/UI/Alert';
import type { LoginRequest } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(data);

      if (response.success && response.data.user) {
        setUser(response.data.user);
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.data.user.role === 'kasir') {
          navigate('/kasir/dashboard');
        } else {
          navigate('/login');
        }
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(typeof firstError === 'string' ? firstError : 'Validasi gagal');
      } else {
        setError('Email atau password salah, silahkan coba lagi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Main Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Image (Hidden di mobile, Show di desktop) */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-gray-50 items-center justify-center p-8">
            <div className="w-full max-w-md">
              <img
                src="/login-image.png"
                alt="Login Illustration"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white border-l-0 lg:border-l border-gray-200">
            <div className="w-full max-w-md">
              {/* Logo/Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Masuk</h1>
                <p className="text-gray-600">Sistem Point of Sale Restoran</p>
              </div>

              {/* Login Form */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h2>
                  <p className="text-gray-600 mt-1">Silahkan login untuk melanjutkan</p>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert
                    type="error"
                    message={error}
                    onClose={() => setError('')}
                  />
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="Masukkan password"
                    {...register('password', {
                      required: 'Password wajib diisi',
                    })}
                    error={errors.password?.message}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className="w-full mt-6 py-3 text-base"
                  >
                    Masuk
                  </Button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500">
                  © 2024 POS Go. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
