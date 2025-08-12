import type { SharedPokemon } from '../../../core/types';
import { BaseDataSource } from './BaseDataSource';

// Data source for sharing operations
export class SharingDataSource extends BaseDataSource {
    async sharePokedex(title: string, description?: string, maxViews?: number, expiresAt?: string): Promise<SharedPokemon> {
        const payload = { title, description, maxViews, expiresAt };

        const response = await this.client.post<SharedPokemon>('/sharing/create', payload);
        return response.data;
    }

    async getSharedPokedex(shareToken: string): Promise<SharedPokemon> {
        const response = await this.client.get<SharedPokemon>(`/sharing/${shareToken}`);
        return response.data;
    }

    async getMyShares(): Promise<SharedPokemon[]> {
        const response = await this.client.get<SharedPokemon[]>('/sharing/my-shares');
        return response.data;
    }
}

export const sharingDataSource = new SharingDataSource();
