import type { CaughtPokemon, PokedexStats, IPokedexRepository, PaginatedResponse } from '../types';

export class PokedexService {
    private pokedexRepo: IPokedexRepository;

    constructor(pokedexRepo: IPokedexRepository) {
        this.pokedexRepo = pokedexRepo;
    }

    async getCaughtPokemon(userId: number, isOnline: boolean, pageIndex = 0, pageSize = 20): Promise<PaginatedResponse<CaughtPokemon>> {
        return this.pokedexRepo.getCaughtPokemon(userId, isOnline, pageIndex, pageSize);
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        return this.pokedexRepo.getFavorites(userId);
    }

    async catchPokemon(userId: number, pokeApiId: number, isOnline: boolean, notes?: string): Promise<CaughtPokemon | null> {
        if (pokeApiId <= 0) {
            throw new Error('Invalid Pokemon ID');
        }
        return this.pokedexRepo.catchPokemon(userId, pokeApiId, isOnline, notes);
    }

    async catchBulkPokemon(userId: number, pokeApiIds: number[], isOnline: boolean, notes?: string): Promise<CaughtPokemon[]> {
        return this.pokedexRepo.catchBulkPokemon(userId, pokeApiIds, isOnline, notes);
    }

    async releasePokemon(userId: number, pokeApiId: number, isOnline: boolean): Promise<boolean> {
        return this.pokedexRepo.releasePokemon(userId, pokeApiId, isOnline);
    }

    async releaseBulkPokemon(userId: number, pokeApiIds: number[], isOnline: boolean): Promise<boolean> {
        return this.pokedexRepo.releaseBulkPokemon(userId, pokeApiIds, isOnline);
    }

    async updateCaughtPokemon(
        userId: number,
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean },
        isOnline: boolean
    ): Promise<CaughtPokemon | null> {
        if (pokeApiId === 0 || isNaN(pokeApiId)) {
            throw new Error('Invalid caught Pokemon ID');
        }
        return this.pokedexRepo.updateCaughtPokemon(userId, pokeApiId, updates, isOnline);
    }

    async getStats(userId: number, isOnline: boolean): Promise<PokedexStats | null> {
        return this.pokedexRepo.getStats(userId, isOnline);
    }

    async toggleFavorite(userId: number, pokeApiId: number, currentStatus: boolean, isOnline: boolean): Promise<CaughtPokemon | null> {
        return this.updateCaughtPokemon(userId, pokeApiId, { isFavorite: !currentStatus }, isOnline);
    }

    async clearUserData(userId: number, isOnline: boolean): Promise<boolean> {
        return this.pokedexRepo.clearUserData(userId, isOnline);
    }
}
