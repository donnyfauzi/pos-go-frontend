import api from './api';

export interface ReportSummary {
  date: string;
  total_transactions: number;
  total_sales: number;
  total_cash: number;
  total_non_cash: number;
  total_discount: number;
  total_tax: number;
}

export interface ReportTransactionItem {
  id: string;
  customer_name: string;
  order_type: string;
  payment_method: string;
  total_amount: number;
  closed_by_user_id?: string;
  closed_by_user_name: string;
  created_at: string;
}

export interface ReportResponse {
  summary: ReportSummary;
  transactions: ReportTransactionItem[];
}

export interface SettlementResponse {
  id: string;
  date: string;
  user_id: string;
  expected_cash: number;
  actual_cash: number;
  discrepancy: number;
  created_at: string;
}

export interface GetSettlementResponse {
  expected_cash: number;
  settlement: SettlementResponse | null;
}

export const getReportByDate = async (date: string): Promise<ReportResponse> => {
  const response = await api.get('/report', { params: { date } });
  return response.data.data;
};

export const getSettlement = async (date: string): Promise<GetSettlementResponse> => {
  const response = await api.get('/settlement', { params: { date } });
  return response.data.data;
};

export const createSettlement = async (
  date: string,
  actual_cash: number
): Promise<SettlementResponse> => {
  const response = await api.post('/settlement', { date, actual_cash });
  return response.data.data;
};

// Grafik dashboard admin
export interface ChartDailyItem {
  date: string;
  total_transactions: number;
  total_sales: number;
}

export interface ChartMonthlyItem {
  month: string;
  total_transactions: number;
  total_sales: number;
}

export interface ChartResponse {
  daily: ChartDailyItem[];
  monthly: ChartMonthlyItem[];
}

export const getReportCharts = async (
  days: number = 7,
  months: number = 6
): Promise<ChartResponse> => {
  const response = await api.get('/report/charts', { params: { days, months } });
  return response.data.data;
};
