import api from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, GetCurrentUserResponse } from '../types';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  changePassword: async (data: { old_password: string; new_password: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put<{ success: boolean; message: string }>('/auth/change-password', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<GetCurrentUserResponse> => {
    const response = await api.get<GetCurrentUserResponse>('/auth/me');
    return response.data;
  },
};