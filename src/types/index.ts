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