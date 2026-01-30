export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'kasir' | 'koki';
    CreatedAt?: string;
    UpdatedAt?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
    };
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: 'kasir' | 'koki';
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    data: User;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any;
}

export interface GetCurrentUserResponse {
    success: boolean;
    message: string;
    data: User;
}

export interface Category {
    id: string;
    name: string;
    CreatedAt?: string;
    UpdatedAt?: string;
}
  
export interface Menu {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    is_available: boolean;
    category_id: string;
    category?: Category;
    CreatedAt?: string;
    UpdatedAt?: string;
}
  
export interface CreateMenuRequest {
    name: string;
    description: string;
    price: number;
    category_id: string;
    is_available: boolean;
    image: File; // File object untuk upload
}
  
export interface CreateMenuResponse {
    success: boolean;
    message: string;
    data: Menu;
}
  
export interface GetCategoriesResponse {
    success: boolean;
    message: string;
    data: Category[];
}

export interface GetMenusResponse {
    success: boolean;
    message: string;
    data: Menu[];
}

export interface GetUsersResponse {
    success: boolean;
    message: string;
    data: User[];
}

// Transaction Types
export interface TransactionItem {
    id: string;
    menu_id: string;
    menu_name: string;
    menu_price: number;
    quantity: number;
    subtotal: number;
}

export interface Transaction {
    id: string;
    customer_name: string;
    customer_phone: string;
    order_type: 'dine_in' | 'take_away';
    table_number?: number;
    promo_code?: string;
    discount?: number;
    total_amount: number;
    payment_method: 'cash' | 'credit_card' | 'debit_card' | 'e_wallet';
    payment_status: 'pending' | 'paid' | 'cancelled';
    order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
    notes?: string;
    items: TransactionItem[];
    created_at: string;
    updated_at: string;
}

export interface CreateTransactionItemRequest {
    menu_id: string;
    quantity: number;
}

export interface CreateTransactionRequest {
    customer_name: string;
    customer_phone: string;
    order_type: 'dine_in' | 'take_away';
    table_number?: number;
    payment_method: 'cash' | 'credit_card' | 'debit_card' | 'e_wallet';
    notes?: string;
    promo_code?: string;
    items: CreateTransactionItemRequest[];
}

export interface CreateTransactionResponse {
    success: boolean;
    message: string;
    data: Transaction;
}

export interface GetTransactionsResponse {
    success: boolean;
    message: string;
    data: Transaction[];
}

export interface GetTransactionResponse {
    success: boolean;
    message: string;
    data: Transaction;
}