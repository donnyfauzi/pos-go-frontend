import api from './api';
import type { GetCategoriesResponse } from '../types';

export interface CreateCategoryRequest {
  name: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    CreatedAt?: string;
    UpdatedAt?: string;
  };
}

export const categoryService = {
  // Admin - get all categories (protected)
  getAllCategories: async (): Promise<GetCategoriesResponse> => {
    const response = await api.get<GetCategoriesResponse>('/category');
    return response.data;
  },

  // Public - get all categories (untuk customer)
  getPublicCategories: async (): Promise<GetCategoriesResponse> => {
    const response = await api.get<GetCategoriesResponse>('/category/public');
    return response.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<CreateCategoryResponse> => {
    const response = await api.post<CreateCategoryResponse>('/category', data);
    return response.data;
  },
};
