import api from './api';

export interface TransactionItem {
  id: string;
  menu_id: string;
  menu_name: string;
  menu_price: number;
  quantity: number;
  subtotal: number;
}

export interface CreateTransactionRequest {
  customer_name: string;
  customer_phone: string;
  order_type: 'dine_in' | 'take_away';
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
  order_type: 'dine_in' | 'take_away';
  table_number?: number;
  promo_code?: string;
  discount: number;
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
  items: TransactionItem[];
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

export const getAllTransactions = async (): Promise<TransactionResponse[]> => {
  const response = await api.get('/transaction');
  return response.data.data;
};

export const confirmCashPaid = async (id: string): Promise<TransactionResponse> => {
  const response = await api.patch(`/transaction/${id}/cash-paid`);
  return response.data.data;
};

export const updateOrderStatus = async (
  id: string,
  order_status: 'pending' | 'cooking' | 'ready' | 'completed' | 'cancelled'
): Promise<TransactionResponse> => {
  const response = await api.patch(`/transaction/${id}/order-status`, { order_status });
  return response.data.data;
};
