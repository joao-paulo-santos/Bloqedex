import type { SharedPokemon } from '../entities';

export interface ISharingRepository {
    createShare(data: {
        isCollection: boolean;
        pokemonId?: number;
        title: string;
        description?: string;
        maxViews?: number;
        expiresAt?: string;
    }): Promise<SharedPokemon | null>;
    getSharedPokemon(shareToken: string): Promise<SharedPokemon | null>;
    getMyShares(): Promise<SharedPokemon[]>;
}
