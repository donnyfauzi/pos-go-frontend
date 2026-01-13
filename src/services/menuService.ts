import api from './api';
import type { CreateMenuRequest, CreateMenuResponse } from '../types';

export const menuService = {
  createMenu: async (data: CreateMenuRequest): Promise<CreateMenuResponse> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('category_id', data.category_id);
    formData.append('is_available', data.is_available.toString());
    formData.append('image', data.image);

    const response = await api.post<CreateMenuResponse>('/menu', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};