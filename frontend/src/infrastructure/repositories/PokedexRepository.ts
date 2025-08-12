import type { CaughtPokemon, PokedexStats } from '../../core/entities';
import type { IPokedexRepository, PaginatedResponse } from '../../core/interfaces';
import { pokedexApiClient } from '../api/ApiIndex';
import { indexedDBStorage } from '../storage/IndexedDBStorage';
import { getCurrentUserId } from '../../common/utils/userContext';

export class PokedexRepository implements IPokedexRepository {
    async getCaughtPokemon(
        pageIndex: number = 1,
        pageSize: number = 20
    ): Promise<PaginatedResponse<CaughtPokemon>> {
        const allCaught = await pokedexApiClient.getCaughtPokemon();

        const startIndex = (pageIndex - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const items = allCaught.slice(startIndex, endIndex);

        return {
            pokemon: items,
            page: pageIndex,
            pageSize,
            totalCount: allCaught.length,
            totalPages: Math.ceil(allCaught.length / pageSize)
        };
    }

    async getFavorites(): Promise<CaughtPokemon[]> {
        const allCaught = await pokedexApiClient.getCaughtPokemon();
        return allCaught.filter((p: CaughtPokemon) => p.isFavorite);
    }

    async catchPokemon(pokemonId: number, notes?: string): Promise<CaughtPokemon | null> {
        try {
            return await pokedexApiClient.catchPokemon(pokemonId, notes);
        } catch (error) {
            console.error('Failed to catch Pokemon:', error);
            return null;
        }
    }

    async releasePokemon(caughtPokemonId: number): Promise<boolean> {
        try {
            await pokedexApiClient.releasePokemon(caughtPokemonId);
            return true;
        } catch (error) {
            console.error('Failed to release Pokemon:', error);
            return false;
        }
    }

    async updateCaughtPokemon(
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean; nickname?: string }
    ): Promise<CaughtPokemon | null> {
        const currentUserId = getCurrentUserId();
        const allCaught = await indexedDBStorage.getCaughtPokemon(currentUserId || undefined);
        const pokemon = allCaught.find(p => p.id === caughtPokemonId);

        if (!pokemon) return null;

        const updatedPokemon = { ...pokemon, ...updates };
        await indexedDBStorage.saveCaughtPokemon(updatedPokemon);

        return updatedPokemon;
    }

    async getStats(): Promise<PokedexStats | null> {
        try {
            return await pokedexApiClient.getPokedexStats();
        } catch (error) {
            console.error('Failed to get Pokedex stats:', error);
            return null;
        }
    }
}

export const pokedexRepository = new PokedexRepository();
