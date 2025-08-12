import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../../../core/types';
import { BaseDataSource } from './BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';

// Data source for authentication operations
export class AuthDataSource extends BaseDataSource {

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

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await this.client.post<AuthResponse>('/Auth/login', credentials);
        const { token, user } = response.data;

        localStorage.setItem('auth_token', token);
        await indexedDBStorage.saveUser(user);

        return response.data;
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        const response = await this.client.post<AuthResponse>('/Auth/register', userData);
        const { token, user } = response.data;

        localStorage.setItem('auth_token', token);
        await indexedDBStorage.saveUser(user);

        return response.data;
    }

    async logout(): Promise<void> {
        this.clearAuth();
    }

    async getCurrentUser(): Promise<User | null> {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        // Check if token is expired
        if (this.isTokenExpired(token)) {
            console.warn('JWT token is expired');
            this.clearAuth(); // Change so only needs to clear auth when online
            return null;
        }

        try {
            // Get user ID from JWT token
            const userId = this.getUserIdFromToken(token);
            if (!userId) {
                console.warn('Cannot extract user ID from JWT token');
                this.clearAuth();
                return null;
            }

            // Try to get cached user data first (offline-first approach)
            let cachedUser: User | null = null;
            try {
                cachedUser = await indexedDBStorage.getUser(userId);
            } catch (error) {
                console.warn('Failed to get cached user:', error);
            }

            // If we're online, try to refresh user data from API
            if (navigator.onLine) {
                try {
                    const response = await this.client.get<User>('/Auth/me');
                    const freshUser = response.data;

                    // Update cached user data with fresh data
                    await indexedDBStorage.saveUser(freshUser);
                    return freshUser;
                } catch (error) {
                    if (cachedUser) {
                        console.warn('Failed to refresh user data, using cached data:', error);
                        return cachedUser;
                    }

                    console.warn('Failed to get current user and no cached data:', error);
                    this.clearAuth();
                    return null;
                }
            }

            if (cachedUser) {
                return cachedUser;
            }

            console.warn('No cached user data available while offline');
            return null;
        } catch (error) {
            console.warn('Error in getCurrentUser:', error);
            return null;
        }
    }
}

// Export singleton instance
export const authDataSource = new AuthDataSource();
