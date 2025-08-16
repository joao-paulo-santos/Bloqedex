import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { API_PATHS } from '../../../config/uriPaths';

// Data source for authentication operations
export class RemoteAuthDataSource extends BaseDataSource {

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await this.client.post<AuthResponse>(API_PATHS.AUTH.LOGIN, credentials);
        return response.data;
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        const response = await this.client.post<AuthResponse>(API_PATHS.AUTH.REGISTER, userData);
        return response.data;
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const response = await this.client.get<User>(API_PATHS.AUTH.ME);
            return response.data;
        } catch (error) {
            console.warn('Failed to get current user and no cached data:', error);
            return null;
        }
    }

    async refreshCurrentUser(): Promise<User | null> {
        try {
            const response = await this.client.get<User>(API_PATHS.AUTH.ME);
            return response.data;;
        } catch (error) {
            console.warn('Error in refreshCurrentUser:', error);
            return null;
        }
    }
}

// Export singleton instance
export const remoteAuthDataSource = new RemoteAuthDataSource();
