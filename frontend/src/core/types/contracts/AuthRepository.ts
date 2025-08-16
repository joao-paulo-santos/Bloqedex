import type { User } from '../entities/User';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../requests';

export interface IAuthRepository {
    login(credentials: LoginRequest): Promise<AuthResponse>;
    register(userData: RegisterRequest): Promise<AuthResponse>;
    getCurrentUser(isOnline: boolean): Promise<User | null>;
    changePassword(currentPassword: string, newPassword: string): Promise<void>;
    logout(): void;
}
