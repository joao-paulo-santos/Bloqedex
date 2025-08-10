import type { CaughtPokemon, PokedexStats } from '../entities';
import type { IPokedexRepository, PaginatedResponse } from '../interfaces';

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

    async releasePokemon(caughtPokemonId: number): Promise<boolean> {
        if (caughtPokemonId <= 0) {
            throw new Error('Invalid caught Pokemon ID');
        }
        return this.pokedexRepo.releasePokemon(caughtPokemonId);
    }

    async updateCaughtPokemon(
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean; nickname?: string }
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
