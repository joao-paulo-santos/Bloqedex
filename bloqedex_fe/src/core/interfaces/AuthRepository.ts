import { User, LoginCredentials, RegisterData, AuthResponse } from '../entities/User';

export interface AuthRepository {
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    register(data: RegisterData): Promise<AuthResponse>;
    logout(): Promise<void>;
    refreshToken(refreshToken: string): Promise<string>;
    getCurrentUser(): Promise<User | null>;
}
