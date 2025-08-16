import type { User, IAuthRepository, AuthResponse, LoginRequest, RegisterRequest } from '../../core/types';
import { remoteAuthDataSource } from '../datasources/DataSourceIndex';
import { localAuthDataSource } from '../datasources/DataSourceIndex';

export class AuthRepository implements IAuthRepository {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const result = await remoteAuthDataSource.login(credentials);
        const { token, user } = result;
        await localAuthDataSource.saveUser(token, user);
        return result;
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        const result = await remoteAuthDataSource.register(userData);
        const { token, user } = result;
        await localAuthDataSource.saveUser(token, user);
        return result;
    }

    async getCurrentUser(isOnline: boolean): Promise<User | null> {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        if (this.isTokenExpired(token)) {
            console.warn('JWT token is expired');
            await localAuthDataSource.logout();
            return null;
        }

        const userId = this.getUserIdFromToken(token);
        if (!userId) {
            console.warn('Cannot extract user ID from JWT token');
            await localAuthDataSource.logout();
            return null;
        }

        const cachedUser: User | null = await localAuthDataSource.getCurrentUser(userId);

        if (isOnline) {
            try {
                const freshUser = await remoteAuthDataSource.refreshCurrentUser();
                if (freshUser) {
                    await localAuthDataSource.saveUser(token, freshUser);
                    return freshUser;
                }
            } catch (error) {
                if (cachedUser) {
                    console.warn('Failed to refresh user data, using cached data:', error);
                    return cachedUser;
                }

                console.warn('Failed to get current user and no cached data:', error);
                await localAuthDataSource.logout();
                return null;
            }
        }

        if (cachedUser) {
            return cachedUser;
        }

        console.warn('No cached user data available while offline');
        return null;
    }

    async changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
        void _currentPassword;
        void _newPassword;

        throw new Error('Change password not implemented yet');
    }

    async logout(): Promise<void> {
        await localAuthDataSource.logout();
    }

    private decodeJWT(token: string): { nameid?: string; unique_name?: string; role?: string; exp?: number;[key: string]: unknown } | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }

            const payload = parts[1];
            const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
            const decoded = atob(paddedPayload);

            return JSON.parse(decoded);
        } catch (error) {
            console.warn('Failed to decode JWT:', error);
            return null;
        }
    }

    private isTokenExpired(token: string): boolean {
        const payload = this.decodeJWT(token);
        if (!payload || !payload.exp) {
            return true;
        }

        return payload.exp * 1000 < Date.now();
    }

    private getUserIdFromToken(token: string): number | null {
        const payload = this.decodeJWT(token);
        if (!payload?.nameid) {
            return null;
        }

        const userId = parseInt(payload.nameid, 10);
        return isNaN(userId) ? null : userId;
    }

    async isOnline(): Promise<boolean> {
        return remoteAuthDataSource.checkHealth();
    }
}

export const authRepository = new AuthRepository();
