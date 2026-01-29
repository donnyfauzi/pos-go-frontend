import api from './api';

export interface CreateTransactionRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  table_number?: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'e_wallet';
  notes?: string;
  promo_code?: string;
  items: {
    menu_id: string;
    quantity: number;
  }[];
}

export interface TransactionResponse {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  table_number?: number;
  subtotal: number;      // Total sebelum pajak
  tax: number;           // Pajak PPN 10%
  total_amount: number;  // Total setelah pajak
  payment_method: string;
  payment_status: string;
  order_status: string;
  notes: string;
  expired_at?: string;  // Waktu kadaluarsa
  snap_token?: string;  // Untuk non-cash
  snap_url?: string;    // Untuk non-cash
  items: any[];
  created_at: string;
  updated_at: string;
}

export const createTransaction = async (
  data: CreateTransactionRequest
): Promise<TransactionResponse> => {
  const response = await api.post('/transaction', data);
  return response.data.data;
};

export const getTransactionById = async (id: string): Promise<TransactionResponse> => {
  const response = await api.get(`/transaction/${id}`);
  return response.data.data;
};
