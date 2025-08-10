import type { SharedPokemon } from '../../core/entities';
import type { ISharingRepository } from '../../core/interfaces';
import { sharingApiClient } from '../api/ApiIndex';

export class SharingRepository implements ISharingRepository {
    async createShare(data: {
        isCollection: boolean;
        pokemonId?: number;
        title: string;
        description?: string;
        maxViews?: number;
        expiresAt?: string;
    }): Promise<SharedPokemon | null> {
        try {
            return await sharingApiClient.sharePokedex(
                data.title,
                data.description,
                data.maxViews,
                data.expiresAt
            );
        } catch (error) {
            console.error('Failed to create share:', error);
            return null;
        }
    }

    async getSharedPokemon(shareToken: string): Promise<SharedPokemon | null> {
        try {
            return await sharingApiClient.getSharedPokedex(shareToken);
        } catch (error) {
            console.error('Failed to get shared Pokemon:', error);
            return null;
        }
    }

    async getMyShares(): Promise<SharedPokemon[]> {
        try {
            return await sharingApiClient.getMyShares();
        } catch (error) {
            console.error('Failed to get my shares:', error);
            return [];
        }
    }
}

export const sharingRepository = new SharingRepository();
