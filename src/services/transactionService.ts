import api from './api';
import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  GetTransactionsResponse,
  GetTransactionResponse,
} from '../types';

export const transactionService = {
  createTransaction: async (data: CreateTransactionRequest): Promise<CreateTransactionResponse> => {
    const response = await api.post<CreateTransactionResponse>('/transaction', data);
    return response.data;
  },

  getAllTransactions: async (): Promise<GetTransactionsResponse> => {
    const response = await api.get<GetTransactionsResponse>('/transaction');
    return response.data;
  },

  getTransactionById: async (id: string): Promise<GetTransactionResponse> => {
    const response = await api.get<GetTransactionResponse>(`/transaction/${id}`);
    return response.data;
  },

  updateTransactionStatus: async (
    id: string,
    paymentStatus?: string,
    orderStatus?: string
  ): Promise<GetTransactionResponse> => {
    const response = await api.put<GetTransactionResponse>(`/transaction/${id}/status`, {
      payment_status: paymentStatus,
      order_status: orderStatus,
    });
    return response.data;
  },
};
