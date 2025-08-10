import type { User } from '../entities';
import type { AuthResponse, LoginRequest, RegisterRequest } from './AuthTypes';

export interface IAuthRepository {
    login(credentials: LoginRequest): Promise<AuthResponse>;
    register(userData: RegisterRequest): Promise<AuthResponse>;
    getCurrentUser(): Promise<User | null>;
    changePassword(currentPassword: string, newPassword: string): Promise<void>;
    logout(): void;
}
