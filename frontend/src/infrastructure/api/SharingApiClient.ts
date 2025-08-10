import type { SharedPokemon } from '../../core/entities';
import { BaseApiClient } from './BaseApiClient';

// API client for sharing operations
export class SharingApiClient extends BaseApiClient {
    async sharePokedex(title: string, description?: string, maxViews?: number, expiresAt?: string): Promise<SharedPokemon> {
        const payload = { title, description, maxViews, expiresAt };

        const response = await this.client.post<SharedPokemon>('/sharing/create', payload);
        return response.data;
    }

    async getSharedPokedex(shareToken: string): Promise<SharedPokemon> {
        const cacheKey = `shared_${shareToken}`;

        // Try cache first (shorter TTL for shared content)
        const cachedData = await this.getCachedData<SharedPokemon>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const response = await this.client.get<SharedPokemon>(`/sharing/${shareToken}`);

        // Cache for 5 minutes
        await this.setCachedData(cacheKey, response.data, 300000);

        return response.data;
    }

    async getMyShares(): Promise<SharedPokemon[]> {
        const response = await this.client.get<SharedPokemon[]>('/sharing/my-shares');
        return response.data;
    }
}

export const sharingApiClient = new SharingApiClient();
