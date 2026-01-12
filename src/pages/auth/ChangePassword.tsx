import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';
import Alert from '../../components/UI/Alert';

interface ChangePasswordForm {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>();

  const newPassword = watch('new_password');

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      });

      // Ambil success message dari backend
      if (response.success && response.message) {
        setSuccess(response.message);
      } else {
        setSuccess('Password berhasil diubah');
      }
      
      // Redirect setelah 2 detik
      setTimeout(() => {
        if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/kasir/dashboard');
        }
      }, 2000);
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

  // Determine dashboard path based on user role
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/kasir/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button - Fixed di pojok kiri atas */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate(dashboardPath)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
        >
          ← Kembali ke Dashboard
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ubah Password</h1>
          <p className="text-gray-600">Ubah password akun Anda</p>
        </div>

        {/* Change Password Card */}
        <Card className="shadow-xl">
          {/* Success Message */}
          {success && (
            <Alert
              type="success"
              message={success}
              subtitle="Mengalihkan ke dashboard..."
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

          {/* Change Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Password Lama"
              type="password"
              placeholder="Masukkan password lama"
              {...register('old_password', {
                required: 'Password lama wajib diisi',
              })}
              error={errors.old_password?.message}
            />

            <Input
              label="Password Baru"
              type="password"
              placeholder="Minimal 6 karakter"
              {...register('new_password', {
                required: 'Password baru wajib diisi',
                minLength: {
                  value: 6,
                  message: 'Password baru minimal 6 karakter',
                },
              })}
              error={errors.new_password?.message}
            />

            <Input
              label="Konfirmasi Password Baru"
              type="password"
              placeholder="Ulangi password baru"
              {...register('confirm_password', {
                required: 'Konfirmasi password wajib diisi',
                validate: (value) =>
                  value === newPassword || 'Konfirmasi password tidak sesuai',
              })}
              error={errors.confirm_password?.message}
            />

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tips:</strong> Gunakan password yang kuat dengan kombinasi huruf, angka, dan karakter khusus.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(dashboardPath)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="flex-1"
                disabled={!!success}
              >
                Ubah Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

