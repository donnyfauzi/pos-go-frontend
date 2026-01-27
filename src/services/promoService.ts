import api from './api';

export interface Promo {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount: number;
  usage_limit: number;
  usage_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePromoRequest {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ValidatePromoRequest {
  code: string;
  subtotal: number;
}

export interface ValidatePromoResponse {
  promo: Promo;
  discount: number;
  final_amount: number;
}

// Get all promos (Admin only)
export const getAllPromos = async (): Promise<Promo[]> => {
  const response = await api.get('/promo');
  return response.data.data;
};

// Get promo by ID (Admin only)
export const getPromoById = async (id: string): Promise<Promo> => {
  const response = await api.get(`/promo/${id}`);
  return response.data.data;
};

// Create promo (Admin only)
export const createPromo = async (data: CreatePromoRequest): Promise<Promo> => {
  const response = await api.post('/promo', data);
  return response.data.data;
};

// Update promo (Admin only)
export const updatePromo = async (id: string, data: Partial<CreatePromoRequest>): Promise<Promo> => {
  const response = await api.put(`/promo/${id}`, data);
  return response.data.data;
};

// Delete promo (Admin only)
export const deletePromo = async (id: string): Promise<void> => {
  await api.delete(`/promo/${id}`);
};

// Validate promo (Public)
export const validatePromo = async (data: ValidatePromoRequest): Promise<ValidatePromoResponse> => {
  const response = await api.post('/promo/validate', data);
  return response.data.data;
};