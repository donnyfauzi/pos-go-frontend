export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'kasir';
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
    role: 'kasir';
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