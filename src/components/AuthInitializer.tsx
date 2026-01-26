import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export default function AuthInitializer({ children }: { children: ReactNode }) {
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        // Token tidak valid atau tidak ada - biarkan user null
        // Error 401 di network tab adalah normal untuk public pages
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [setUser]);

  // Show loading state or nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

