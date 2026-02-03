import api from './api';

export interface ReceiptItem {
  menu_name: string;
  quantity: number;
  menu_price: number;
  subtotal: number;
}

export interface ReceiptResponse {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  table_number?: number;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  closed_by_user_name: string;
}

export const getReceipt = async (transactionId: string): Promise<ReceiptResponse> => {
  const response = await api.get(`/transaction/${transactionId}/receipt`);
  return response.data.data;
};
