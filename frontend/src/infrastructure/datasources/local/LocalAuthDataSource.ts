import type { User } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';

// Data source for authentication operations
export class LocalAuthDataSource extends BaseDataSource {

    async saveUser(token: string, user: User): Promise<void> {
        localStorage.setItem('auth_token', token);
        await indexedDBStorage.saveUser(user);
    }

    async logout(): Promise<void> {
        localStorage.removeItem('auth_token');
    }

    async getCurrentUser(userId: number): Promise<User | null> {
        let cachedUser: User | null = null;
        try {
            cachedUser = await indexedDBStorage.getUser(userId);
        } catch (error) {
            console.warn('Failed to get cached user:', error);
        }
        return cachedUser;
    }
}

// Export singleton instance
export const localAuthDataSource = new LocalAuthDataSource();
