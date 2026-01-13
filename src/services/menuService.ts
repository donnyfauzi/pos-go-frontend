import api from './api';
import type { CreateMenuRequest, CreateMenuResponse, GetMenusResponse } from '../types';

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
  updateMenu: async (
    menuId: string,
    data: {
      name: string;
      description: string;
      price: number;
      category_id: string;
      is_available: boolean;
    },
    imageFile: File | null
  ): Promise<CreateMenuResponse> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('category_id', data.category_id);
    formData.append('is_available', data.is_available.toString());
    
    // Image optional untuk update (jika ada file baru, append)
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const response = await api.put<CreateMenuResponse>(`/menu/${menuId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteMenu: async (menuId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/menu/${menuId}`);
    return response.data;
  },
  getAllMenus: async (): Promise<GetMenusResponse> => {
    const response = await api.get<GetMenusResponse>('/menu');
    return response.data;
  },
};