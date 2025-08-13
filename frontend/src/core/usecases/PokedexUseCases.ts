import type { CaughtPokemon, PokedexStats, IPokedexRepository, PaginatedResponse } from '../types';

export class PokedexUseCases {
    private pokedexRepo: IPokedexRepository;

    constructor(pokedexRepo: IPokedexRepository) {
        this.pokedexRepo = pokedexRepo;
    }

    async getCaughtPokemon(userId: number, pageIndex = 0, pageSize = 20): Promise<PaginatedResponse<CaughtPokemon>> {
        return this.pokedexRepo.getCaughtPokemon(userId, pageIndex, pageSize);
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        return this.pokedexRepo.getFavorites(userId);
    }

    async catchPokemon(userId: number, pokemonId: number, notes?: string): Promise<CaughtPokemon | null> {
        if (pokemonId <= 0) {
            throw new Error('Invalid Pokemon ID');
        }
        return this.pokedexRepo.catchPokemon(userId, pokemonId, notes);
    }

    async catchBulkPokemon(userId: number, pokemonIds: number[], notes?: string): Promise<CaughtPokemon[]> {
        if (pokemonIds.length === 0) {
            throw new Error('No Pokemon IDs provided');
        }
        if (pokemonIds.some(id => id <= 0)) {
            throw new Error('Invalid Pokemon ID provided');
        }
        return this.pokedexRepo.catchBulkPokemon(userId, pokemonIds, notes);
    }

    async releasePokemon(userId: number, caughtPokemonId: number): Promise<boolean> {
        if (caughtPokemonId === 0 || isNaN(caughtPokemonId)) {
            throw new Error('Invalid caught Pokemon ID');
        }
        return this.pokedexRepo.releasePokemon(userId, caughtPokemonId);
    }

    async releaseBulkPokemon(userId: number, caughtPokemonIds: number[]): Promise<number[]> {
        if (!caughtPokemonIds || caughtPokemonIds.length === 0) {
            throw new Error('No Pokemon IDs provided for bulk release');
        }

        // Accept both positive (server IDs) and negative (offline IDs) valid numbers
        const validIds = caughtPokemonIds.filter(id => id !== 0 && !isNaN(id));
        if (validIds.length === 0) {
            throw new Error('No valid Pokemon IDs provided for bulk release');
        }

        return this.pokedexRepo.releaseBulkPokemon(userId, validIds);
    }

    async updateCaughtPokemon(
        userId: number,
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null> {
        if (caughtPokemonId === 0 || isNaN(caughtPokemonId)) {
            throw new Error('Invalid caught Pokemon ID');
        }
        return this.pokedexRepo.updateCaughtPokemon(userId, caughtPokemonId, updates);
    }

    async getStats(userId: number): Promise<PokedexStats | null> {
        return this.pokedexRepo.getStats(userId);
    }

    async toggleFavorite(userId: number, caughtPokemonId: number, currentStatus: boolean): Promise<CaughtPokemon | null> {
        return this.updateCaughtPokemon(userId, caughtPokemonId, { isFavorite: !currentStatus });
    }

    async clearUserData(userId: number): Promise<boolean> {
        return this.pokedexRepo.clearUserData(userId);
    }
}
