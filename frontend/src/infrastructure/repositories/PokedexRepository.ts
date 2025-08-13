import type { CaughtPokemon, PokedexStats, IPokedexRepository, PaginatedResponse } from '../../core/types';
import { pokedexDataSource } from '../datasources/DataSourceIndex';
import { indexedDBStorage } from '../storage/IndexedDBStorage';
import { isOfflineAccount } from '../../common/utils/userContext';

export class PokedexRepository implements IPokedexRepository {
    async getCaughtPokemon(
        userId: number,
        pageIndex: number = 0,
        pageSize: number = 20
    ): Promise<PaginatedResponse<CaughtPokemon>> {
        const response = await pokedexDataSource.getCaughtPokemon(userId, pageIndex, pageSize);

        return {
            pokemon: response.caughtPokemon,
            page: pageIndex + 1,
            pageSize,
            totalCount: response.totalCount,
            totalPages: Math.ceil(response.totalCount / pageSize)
        };
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        const response = await pokedexDataSource.getCaughtPokemon(userId, 0, 1000); // Get a large page for now
        return response.caughtPokemon.filter((p: CaughtPokemon) => p.isFavorite);
    }

    async catchPokemon(userId: number, pokemonId: number, notes?: string): Promise<CaughtPokemon | null> {
        try {
            const existingCaught = await this.getCaughtPokemon(userId, 0, 1000); // Get a large page to check all
            const alreadyCaught = existingCaught.pokemon.find(cp => cp.pokemon.pokeApiId === pokemonId);

            if (alreadyCaught) {
                throw new Error('Pokemon is already caught');
            }
            return await pokedexDataSource.catchPokemon(userId, pokemonId, notes);

        } catch (error) {
            console.error('Failed to catch Pokemon:', error);
            throw error;
        }
    }

    async catchBulkPokemon(userId: number, pokemonIds: number[], notes?: string): Promise<CaughtPokemon[]> {
        const caughtPokemon: CaughtPokemon[] = [];

        try {
            // Check for already caught Pokemon (pokemonIds here are pokeApiIds)
            const existingCaught = await this.getCaughtPokemon(userId, 0, 1000); // Get a large page to check all
            const alreadyCaughtIds = new Set(existingCaught.pokemon.map(cp => cp.pokemon.pokeApiId));

            // Filter out already caught Pokemon
            const pokemonToCatch = pokemonIds.filter(pokeApiId => !alreadyCaughtIds.has(pokeApiId));

            if (pokemonToCatch.length === 0) {
                // All Pokemon are already caught - return empty array instead of throwing error
                console.warn('All selected Pokemon are already caught');
                return [];
            }

            if (pokemonToCatch.length < pokemonIds.length) {
                console.warn(`${pokemonIds.length - pokemonToCatch.length} Pokemon were already caught and will be skipped`);
            }
            return await pokedexDataSource.catchBulkPokemon(userId, pokemonToCatch, notes);

        } catch (error) {
            console.error('Failed to bulk catch Pokemon:', error);
            throw error;
        }

        return caughtPokemon;
    }

    //TODO: pass offline account logic to datasource
    async releasePokemon(userId: number, caughtPokemonId: number): Promise<boolean> {
        try {
            if (isOfflineAccount()) {
                const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);
                const pokemon = allCaughtPokemon.find(cp => cp.id === caughtPokemonId);

                if (!pokemon) {
                    console.error('Pokemon not found for release');
                    return false;
                }

                const offlineAction = {
                    id: `release_${Date.now()}_${caughtPokemonId}`,
                    type: 'release' as const,
                    payload: { pokeApiId: pokemon.pokemon.pokeApiId },
                    timestamp: Date.now(),
                    status: 'pending' as const
                };

                await indexedDBStorage.savePendingAction(offlineAction);

                await indexedDBStorage.deleteCaughtPokemon(userId, pokemon.pokemon.pokeApiId);
                return true;
            } else {
                const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);
                const pokemon = allCaughtPokemon.find(cp => cp.id === caughtPokemonId);

                if (!pokemon) {
                    console.error('Pokemon not found for release');
                    return false;
                }

                await pokedexDataSource.releasePokemon(userId, pokemon.pokemon.pokeApiId);

                await indexedDBStorage.deleteCaughtPokemon(userId, pokemon.pokemon.pokeApiId);

                // Verify the deletion worked
                const remainingPokemon = await indexedDBStorage.getCaughtPokemon(userId);
                const stillExists = remainingPokemon.find(cp => cp.id === caughtPokemonId);
                if (stillExists) {
                    console.error('ERROR: Single Pokemon', caughtPokemonId, 'still exists in IndexedDB after deletion!');
                    return false;
                }

                return true;
            }
        } catch (error) {
            console.error('Failed to release Pokemon:', error);
            return false;
        }
    }

    async releaseBulkPokemon(userId: number, caughtPokemonIds: number[]): Promise<number[]> {
        try {
            const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);
            const pokeApiIds: number[] = [];
            const pokemonToDelete: { caughtId: number; pokeApiId: number }[] = []; // Store both IDs for deletion

            for (const caughtId of caughtPokemonIds) {
                const pokemon = allCaughtPokemon.find(cp => cp.id === caughtId);
                if (pokemon) {
                    pokeApiIds.push(pokemon.pokemon.pokeApiId);
                    pokemonToDelete.push({ caughtId, pokeApiId: pokemon.pokemon.pokeApiId });
                } else {
                    console.warn('Could not find caught Pokemon with ID (online):', caughtId);
                }
            }


            // Make API call first
            await pokedexDataSource.releaseBulkPokemon(userId, pokeApiIds);

            const successfulIds: number[] = [];
            for (const pokemon of pokemonToDelete) {
                try {
                    await indexedDBStorage.deleteCaughtPokemon(userId, pokemon.pokeApiId);
                    successfulIds.push(pokemon.caughtId);

                    // Verify the deletion worked by checking if it's still there
                    const remainingPokemon = await indexedDBStorage.getCaughtPokemon(userId);
                    const stillExists = remainingPokemon.find(cp => cp.pokemon.pokeApiId === pokemon.pokeApiId);
                    if (stillExists) {
                        console.error('ERROR: Pokemon', pokemon.pokeApiId, 'still exists in IndexedDB after deletion!');
                    }
                } catch (error) {
                    console.error(`Failed to delete Pokemon ${pokemon.caughtId} from IndexedDB:`, error);
                }
            }

            return successfulIds;
        } catch (error) {
            console.error('Failed to bulk release Pokemon:', error);
            return [];
        }
    }

    //TODO: pass offline account logic to datasource
    async updateCaughtPokemon(
        userId: number,
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null> {
        try {
            if (isOfflineAccount()) {
                const caughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);
                const pokemon = caughtPokemon.find(cp => cp.id === caughtPokemonId);

                if (!pokemon) {
                    throw new Error('Caught Pokemon not found');
                }

                const offlineAction = {
                    id: `update_${Date.now()}_${caughtPokemonId}`,
                    type: 'update' as const,
                    payload: { pokemonApiId: pokemon.pokemon.pokeApiId, ...updates },
                    timestamp: Date.now(),
                    status: 'pending' as const
                };

                await indexedDBStorage.savePendingAction(offlineAction);

                const updatedPokemon = {
                    ...pokemon,
                    ...updates
                };

                await indexedDBStorage.saveCaughtPokemon(updatedPokemon);
                return updatedPokemon;
            } else {
                const caughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);
                const pokemon = caughtPokemon.find(cp => cp.id === caughtPokemonId);

                if (!pokemon) {
                    throw new Error('Caught Pokemon not found');
                }

                return await pokedexDataSource.updateCaughtPokemon(userId, pokemon.pokemon.pokeApiId, updates);
            }
        } catch (error) {
            console.error('Failed to update caught Pokemon:', error);
            throw error;
        }
    }

    //TODO: pass offline account logic to datasource
    async getStats(userId: number): Promise<PokedexStats | null> {
        try {
            if (isOfflineAccount()) {
                // Use IndexedDB for offline accounts
                return await indexedDBStorage.getPokedexStats(userId);
            } else {
                // Use API for online accounts
                return await pokedexDataSource.getPokedexStats(userId);
            }
        } catch (error) {
            console.error('Failed to get Pokedex stats:', error);
            return null;
        }
    }

    //TODO: pass offline account logic to datasource
    async clearUserData(userId: number): Promise<boolean> {
        try {
            // Only clear data for offline accounts
            if (isOfflineAccount()) {
                if (!userId) {
                    console.error('clearUserData: userId is required');
                    return false;
                }

                await indexedDBStorage.clearCaughtPokemonForUser(userId);
                return true;
            } else {
                console.warn('clearUserData called for online account - no action taken');
                return false;
            }
        } catch (error) {
            console.error('Failed to clear user data:', error);
            return false;
        }
    }
}

export const pokedexRepository = new PokedexRepository();
