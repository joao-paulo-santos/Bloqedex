import type { SharedPokemon } from '../../../core/types';
import { BaseDataSource } from './BaseDataSource';
import { API_PATHS } from '../../../config/uriPaths';

// Data source for sharing operations
export class SharingDataSource extends BaseDataSource {
    /**
     * Share an individual Pokemon
     */
    async sharePokemon(pokemonId: number, title: string, description?: string, maxViews?: number, expiresAt?: string): Promise<SharedPokemon> {
        const payload = {
            shareType: 1,
            pokemonId,
            title,
            description,
            maxViews,
            expiresAt
        };

        const response = await this.client.post<SharedPokemon>(API_PATHS.SHARING.CREATE, payload);
        return response.data;
    }

    /**
     * Share entire Pokedex collection
     */
    async sharePokedex(title: string, description?: string, maxViews?: number, expiresAt?: string): Promise<SharedPokemon> {
        const payload = {
            shareType: 1,
            pokemonId: null,
            title,
            description,
            maxViews,
            expiresAt
        };

        const response = await this.client.post<SharedPokemon>(API_PATHS.SHARING.CREATE, payload);
        return response.data;
    }

    /**
     * Get shared content by token (Pokemon or Pokedex)
     */
    async getSharedContent(shareToken: string): Promise<SharedPokemon> {
        const response = await this.client.get<SharedPokemon>(API_PATHS.SHARING.GET_BY_TOKEN(shareToken));
        return response.data;
    }

    /**
     * Get all shares created by the current user
     */
    async getMyShares(): Promise<SharedPokemon[]> {
        const response = await this.client.get<SharedPokemon[]>(API_PATHS.SHARING.MY_SHARES);
        return response.data;
    }

    /**
     * Update an existing share
     */
    async updateShare(shareId: string, updates: {
        title?: string;
        description?: string;
        maxViews?: number;
        expiresAt?: string;
        isActive?: boolean;
    }): Promise<SharedPokemon> {
        const response = await this.client.put<SharedPokemon>(API_PATHS.SHARING.UPDATE(shareId), updates);
        return response.data;
    }

    /**
     * Delete a share
     */
    async deleteShare(shareId: string): Promise<void> {
        await this.client.delete(API_PATHS.SHARING.DELETE(shareId));
    }
}

export const sharingDataSource = new SharingDataSource();
