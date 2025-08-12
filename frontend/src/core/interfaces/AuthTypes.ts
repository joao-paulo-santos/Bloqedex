import type { User } from '../entities';

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}
