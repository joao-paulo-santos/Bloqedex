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
        if (isOfflineAccount()) {
            // Use IndexedDB for offline accounts
            const allCaught = await indexedDBStorage.getCaughtPokemon(userId);

            const startIndex = pageIndex * pageSize;
            const endIndex = startIndex + pageSize;
            const items = allCaught.slice(startIndex, endIndex);

            return {
                pokemon: items,
                page: pageIndex + 1,
                pageSize,
                totalCount: allCaught.length,
                totalPages: Math.ceil(allCaught.length / pageSize)
            };
        } else {
            const response = await pokedexDataSource.getCaughtPokemon(userId, pageIndex, pageSize);

            return {
                pokemon: response.caughtPokemon,
                page: pageIndex + 1,
                pageSize,
                totalCount: response.totalCount,
                totalPages: Math.ceil(response.totalCount / pageSize)
            };
        }
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        if (isOfflineAccount()) {
            // Use IndexedDB for offline accounts
            return await indexedDBStorage.getFavorites(userId);
        } else {
            // Use API for online accounts - get all caught Pokemon and filter favorites
            const response = await pokedexDataSource.getCaughtPokemon(userId, 0, 1000); // Get a large page for now
            return response.caughtPokemon.filter((p: CaughtPokemon) => p.isFavorite);
        }
    }

    async catchPokemon(userId: number, pokemonId: number, notes?: string): Promise<CaughtPokemon | null> {
        try {
            // Check if Pokemon is already caught (pokemonId here is pokeApiId)
            const existingCaught = await this.getCaughtPokemon(userId, 0, 1000); // Get a large page to check all
            const alreadyCaught = existingCaught.pokemon.find(cp => cp.pokemon.pokeApiId === pokemonId);

            if (alreadyCaught) {
                throw new Error('Pokemon is already caught');
            }

            if (isOfflineAccount()) {
                const offlineAction = {
                    id: `catch_${Date.now()}_${pokemonId}`,
                    type: 'catch' as const,
                    payload: { pokemonId, notes },
                    timestamp: Date.now(),
                    status: 'pending' as const
                };

                await indexedDBStorage.savePendingAction(offlineAction);

                // Also execute the action locally for immediate UI feedback
                if (!userId) return null;

                // First, get the actual Pokemon data from storage using pokeApiId
                const pokemon = await indexedDBStorage.getPokemonByPokeApiId(pokemonId);
                if (!pokemon) {
                    console.error(`Pokemon with pokeApiId ${pokemonId} not found in storage`);
                    return null;
                }

                // Create a caught Pokemon record with reference to the actual Pokemon
                const caughtPokemon: CaughtPokemon = {
                    id: -(Date.now() + pokemonId),
                    pokemon,
                    caughtDate: new Date().toISOString(),
                    notes: notes || '',
                    isFavorite: false,
                    userId: userId || 0
                };

                await indexedDBStorage.saveCaughtPokemon(caughtPokemon);
                return caughtPokemon;
            } else {
                // Use API for online accounts
                return await pokedexDataSource.catchPokemon(userId, pokemonId, notes);
            }
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

            if (isOfflineAccount()) {
                const offlineAction = {
                    id: `bulk_catch_${Date.now()}`,
                    type: 'bulk_catch' as const,
                    payload: {
                        pokemonToCatch: pokemonToCatch.map(pokeApiId => ({
                            pokemonId: pokeApiId,
                            notes: notes || ""
                        }))
                    },
                    timestamp: Date.now(),
                    status: 'pending' as const
                };

                await indexedDBStorage.savePendingAction(offlineAction);

                // Also execute the action locally for immediate UI feedback
                if (!userId) return [];

                for (const pokeApiId of pokemonToCatch) {
                    const pokemon = await indexedDBStorage.getPokemonByPokeApiId(pokeApiId);
                    if (pokemon) {
                        const caught: CaughtPokemon = {
                            id: -(Date.now() + pokeApiId),
                            pokemon,
                            caughtDate: new Date().toISOString(),
                            notes: notes || '',
                            isFavorite: false,
                            userId: userId || 0
                        };

                        await indexedDBStorage.saveCaughtPokemon(caught);
                        caughtPokemon.push(caught);
                    }
                }
            } else {
                // Use API for online accounts
                return await pokedexDataSource.catchBulkPokemon(userId, pokemonToCatch, notes);
            }
        } catch (error) {
            console.error('Failed to bulk catch Pokemon:', error);
            throw error;
        }

        return caughtPokemon;
    }

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
            if (isOfflineAccount()) {
                // For offline accounts, convert caught Pokemon IDs to Pokemon API IDs
                const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);

                const pokeApiIds: number[] = [];
                const successfulIds: number[] = [];

                for (const caughtId of caughtPokemonIds) {
                    const pokemon = allCaughtPokemon.find(cp => cp.id === caughtId);
                    if (pokemon) {
                        // Store the Pokemon API ID for the server call
                        pokeApiIds.push(pokemon.pokemon.pokeApiId);

                        // Delete from local storage using pokeApiId
                        try {
                            await indexedDBStorage.deleteCaughtPokemon(userId, pokemon.pokemon.pokeApiId);
                            successfulIds.push(caughtId);
                        } catch (error) {
                            console.error(`Failed to release Pokemon ${caughtId} from IndexedDB:`, error);
                        }
                    } else {
                        console.warn('Could not find caught Pokemon with ID:', caughtId);
                    }
                }

                // Create offline action with Pokemon API IDs
                if (pokeApiIds.length > 0) {
                    const offlineAction = {
                        id: `bulk_release_${Date.now()}`,
                        type: 'bulk_release' as const,
                        payload: { pokeApiIds },
                        timestamp: Date.now(),
                        status: 'pending' as const
                    };

                    await indexedDBStorage.savePendingAction(offlineAction);
                }

                return successfulIds;
            } else {
                // For online accounts, convert caught Pokemon IDs to Pokemon API IDs
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
            }
        } catch (error) {
            console.error('Failed to bulk release Pokemon:', error);
            return [];
        }
    }

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
