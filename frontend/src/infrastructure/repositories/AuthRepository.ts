import type { User, IAuthRepository, AuthResponse, LoginRequest, RegisterRequest } from '../../core/types';
import { authDataSource } from '../datasources/DataSourceIndex';
import { indexedDBStorage } from '../storage/IndexedDBStorage';

export class AuthRepository implements IAuthRepository {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return await authDataSource.login(credentials);
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        return await authDataSource.register(userData);
    }

    async getCurrentUser(): Promise<User | null> {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;


        return await indexedDBStorage.getUser(1);
    }

    async changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
        void _currentPassword;
        void _newPassword;

        throw new Error('Change password not implemented yet');
    }

    logout(): void {
        authDataSource.logout();
    }

    async isOnline(): Promise<boolean> {
        return await authDataSource.checkHealth();
    }
}

export const authRepository = new AuthRepository();
