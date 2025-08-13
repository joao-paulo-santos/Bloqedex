import type { SharedPokemon } from '../../../core/types';
import { BaseDataSource } from './BaseDataSource';
import { API_PATHS } from '../../../config/uriPaths';

// Data source for sharing operations
export class SharingDataSource extends BaseDataSource {
    async sharePokedex(title: string, description?: string, maxViews?: number, expiresAt?: string): Promise<SharedPokemon> {
        const payload = { title, description, maxViews, expiresAt };

        const response = await this.client.post<SharedPokemon>(API_PATHS.SHARING.CREATE, payload);
        return response.data;
    }

    async getSharedPokedex(shareToken: string): Promise<SharedPokemon> {
        const response = await this.client.get<SharedPokemon>(API_PATHS.SHARING.GET_BY_TOKEN(shareToken));
        return response.data;
    }

    async getMyShares(): Promise<SharedPokemon[]> {
        const response = await this.client.get<SharedPokemon[]>(API_PATHS.SHARING.MY_SHARES);
        return response.data;
    }
}

export const sharingDataSource = new SharingDataSource();
