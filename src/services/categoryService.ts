import api from './api';
import type { GetCategoriesResponse } from '../types';

export const categoryService = {
  getAllCategories: async (): Promise<GetCategoriesResponse> => {
    const response = await api.get<GetCategoriesResponse>('/category');
    return response.data;
  },
};