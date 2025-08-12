import type { CaughtPokemon, PokedexStats, IPokedexRepository, PaginatedResponse } from '../types';

export class PokedexUseCases {
    private pokedexRepo: IPokedexRepository;

    constructor(pokedexRepo: IPokedexRepository) {
        this.pokedexRepo = pokedexRepo;
    }

    async getCaughtPokemon(pageIndex = 0, pageSize = 20): Promise<PaginatedResponse<CaughtPokemon>> {
        return this.pokedexRepo.getCaughtPokemon(pageIndex, pageSize);
    }

    async getFavorites(): Promise<CaughtPokemon[]> {
        return this.pokedexRepo.getFavorites();
    }

    async catchPokemon(pokemonId: number, notes?: string): Promise<CaughtPokemon | null> {
        if (pokemonId <= 0) {
            throw new Error('Invalid Pokemon ID');
        }
        return this.pokedexRepo.catchPokemon(pokemonId, notes);
    }

    async catchBulkPokemon(pokemonIds: number[], notes?: string): Promise<CaughtPokemon[]> {
        if (pokemonIds.length === 0) {
            throw new Error('No Pokemon IDs provided');
        }
        if (pokemonIds.some(id => id <= 0)) {
            throw new Error('Invalid Pokemon ID provided');
        }
        return this.pokedexRepo.catchBulkPokemon(pokemonIds, notes);
    }

    async releasePokemon(caughtPokemonId: number): Promise<boolean> {
        if (caughtPokemonId <= 0) {
            throw new Error('Invalid caught Pokemon ID');
        }
        return this.pokedexRepo.releasePokemon(caughtPokemonId);
    }

    async releaseBulkPokemon(caughtPokemonIds: number[]): Promise<number[]> {
        if (!caughtPokemonIds || caughtPokemonIds.length === 0) {
            throw new Error('No Pokemon IDs provided for bulk release');
        }

        const validIds = caughtPokemonIds.filter(id => id > 0);
        if (validIds.length === 0) {
            throw new Error('No valid Pokemon IDs provided for bulk release');
        }

        return this.pokedexRepo.releaseBulkPokemon(validIds);
    }

    async updateCaughtPokemon(
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null> {
        if (caughtPokemonId <= 0) {
            throw new Error('Invalid caught Pokemon ID');
        }
        return this.pokedexRepo.updateCaughtPokemon(caughtPokemonId, updates);
    }

    async getStats(): Promise<PokedexStats | null> {
        return this.pokedexRepo.getStats();
    }

    async toggleFavorite(caughtPokemonId: number, currentStatus: boolean): Promise<CaughtPokemon | null> {
        return this.updateCaughtPokemon(caughtPokemonId, { isFavorite: !currentStatus });
    }
}
