import type { CaughtPokemon, PokedexStats } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';

// Data source for Pokedex operations (caught Pokemon management)
export class LocalPokedexDataSource extends BaseDataSource {
    async getPaginatedCaughtPokemon(userId: number, pageIndex: number = 0, pageSize: number = 20): Promise<{ caughtPokemon: CaughtPokemon[], totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean }> {
        const { pokemon, total } = await indexedDBStorage.getCaughtPokemonPaginated(userId, pageIndex, pageSize);

        return {
            caughtPokemon: pokemon,
            totalCount: total,
            hasNextPage: (pageIndex + 1) * pageSize < total,
            hasPreviousPage: pageIndex > 0
        };
    }

    async getAllCaughtPokemon(userId: number): Promise<CaughtPokemon[]> {
        return indexedDBStorage.getCaughtPokemon(userId);
    }

    async getCaughtPokemonById(userId: number, pokeApiId: number): Promise<CaughtPokemon | null> {
        return indexedDBStorage.getCaughtPokemonById(userId, pokeApiId);
    }

    async catchPokemon(userId: number, pokemonId: number, notes?: string): Promise<CaughtPokemon> {
        const pokemon = await indexedDBStorage.getPokemon(pokemonId);
        if (pokemon) {
            const caughtPokemon: CaughtPokemon = {
                pokemon,
                userId,
                caughtDate: new Date().toISOString(),
                notes,
                isFavorite: false
            };

            await indexedDBStorage.saveCaughtPokemon(caughtPokemon);
            return caughtPokemon;
        }

        throw new Error('Pokemon not found');
    }

    async catchBulkPokemon(userId: number, pokemonIds: number[], notes?: string): Promise<CaughtPokemon[]> {
        const caughtPokemon: CaughtPokemon[] = [];

        for (const pokemonId of pokemonIds) {
            const pokemon = await indexedDBStorage.getPokemon(pokemonId);
            if (pokemon) {
                const caught: CaughtPokemon = {
                    pokemon,
                    userId,
                    caughtDate: new Date().toISOString(),
                    notes,
                    isFavorite: false
                };

                await indexedDBStorage.saveCaughtPokemon(caught);
                caughtPokemon.push(caught);
            }
        }

        return caughtPokemon;
    }

    async releasePokemon(userId: number, pokeApiId: number): Promise<void> {
        await indexedDBStorage.deleteCaughtPokemon(userId, pokeApiId);
    }

    async releaseBulkPokemon(userId: number, pokeApiIds: number[]): Promise<void> {
        for (const pokeApiId of pokeApiIds) {
            await indexedDBStorage.deleteCaughtPokemon(userId, pokeApiId);
        }
    }

    async updateCaughtPokemon(
        userId: number,
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null> {
        const pokemon = await indexedDBStorage.getCaughtPokemonById(userId, pokeApiId);
        if (!pokemon) return null;

        const updatedPokemon = { ...pokemon, ...updates };
        await indexedDBStorage.saveCaughtPokemon(updatedPokemon);

        return updatedPokemon;
    }

    async getPokedexStats(userId: number): Promise<PokedexStats> {
        const totalCaught = await indexedDBStorage.getCaughtPokemonCount(userId);
        const totalFavorites = await indexedDBStorage.getFavoriteCount(userId);

        return {
            totalCaught,
            totalFavorites,
            totalAvailable: 1025
        };
    }

    async clearUserData(userId: number): Promise<boolean> {
        await indexedDBStorage.clearCaughtPokemonForUser(userId);
        return true;
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        return await indexedDBStorage.getFavorites(userId);
    }

    async saveCaughtPokemon(caughtPokemon: CaughtPokemon): Promise<void> {
        await indexedDBStorage.saveCaughtPokemon(caughtPokemon);
    }

    async saveManyCaughtPokemon(caughtPokemon: CaughtPokemon[]): Promise<void> {
        await indexedDBStorage.saveManyCaughtPokemon(caughtPokemon);
    }
}

// Export singleton instance
export const localPokedexDataSource = new LocalPokedexDataSource();
