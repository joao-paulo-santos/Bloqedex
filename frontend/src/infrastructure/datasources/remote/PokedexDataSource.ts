import type { CaughtPokemon, PokedexStats, OfflineAction } from '../../../core/types';
import { BaseDataSource } from './BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';
import { API_PATHS } from '../../../config/uriPaths';
import { isOfflineAccount } from '../../../common/utils/userContext';

// Data source for Pokedex operations (caught Pokemon management)
export class PokedexDataSource extends BaseDataSource {
    async getCaughtPokemon(userId: number, pageIndex: number = 0, pageSize: number = 20): Promise<{ caughtPokemon: CaughtPokemon[], totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean }> {
        if (this.isOnline() && !isOfflineAccount()) {
            try {
                const pendingActions = await indexedDBStorage.getPendingActions();
                const hasPendingPokedexActions = pendingActions.some(action =>
                    ['catch', 'release', 'update', 'bulk_catch', 'bulk_release'].includes(action.type)
                );

                if (!hasPendingPokedexActions) {
                    const response = await this.client.get<{
                        caughtPokemon: CaughtPokemon[];
                        totalCount: number;
                        pageIndex: number;
                        pageSize: number;
                        hasNextPage: boolean;
                        hasPreviousPage: boolean;
                    }>(API_PATHS.POKEDEX.LIST, {
                        params: { pageIndex, pageSize }
                    });

                    for (const caught of response.data.caughtPokemon) {
                        await indexedDBStorage.saveCaughtPokemon(caught);
                    }

                    return {
                        caughtPokemon: response.data.caughtPokemon,
                        totalCount: response.data.totalCount,
                        hasNextPage: response.data.hasNextPage,
                        hasPreviousPage: response.data.hasPreviousPage
                    };
                }
            } catch (error) {
                console.warn('API request failed, falling back to offline data:', error);
            }
        }

        if (!userId) {
            return { caughtPokemon: [], totalCount: 0, hasNextPage: false, hasPreviousPage: false };
        }

        const offlineCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);

        const startIndex = pageIndex * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = offlineCaughtPokemon.slice(startIndex, endIndex);

        return {
            caughtPokemon: paginatedData,
            totalCount: offlineCaughtPokemon.length,
            hasNextPage: endIndex < offlineCaughtPokemon.length,
            hasPreviousPage: pageIndex > 0
        };
    }

    async catchPokemon(userId: number, pokemonId: number, notes?: string): Promise<CaughtPokemon> {
        const payload = { pokemonId, notes };

        if (this.isOnline() && !isOfflineAccount()) {
            try {
                const response = await this.client.post<CaughtPokemon>(API_PATHS.POKEDEX.CATCH, payload);

                await indexedDBStorage.saveCaughtPokemon(response.data);

                return response.data;
            } catch (error) {
                console.warn('Catch request failed while online:', error);

                // If it's a network error, treat as offline and create offline action
                if (!this.isNetworkError(error)) {
                    throw error;
                }
            }
        }

        const offlineAction: OfflineAction = {
            id: `catch_${pokemonId}_${Date.now()}`,
            type: 'catch',
            payload,
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);

        const pokemon = await indexedDBStorage.getPokemonByPokeApiId(pokemonId);
        if (pokemon) {
            const caughtPokemon: CaughtPokemon = {
                id: Date.now(), // Temporary ID
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
        const payload = {
            pokemonToCatch: pokemonIds.map(pokeApiId => ({
                pokemonId: pokeApiId,
                notes: notes || ""
            }))
        };

        // If online, make API call
        if (this.isOnline() && !isOfflineAccount()) {
            try {
                const response = await this.client.post<CaughtPokemon[]>(API_PATHS.POKEDEX.CATCH_BULK, payload);


                const caughtPokemonArray = Array.isArray(response.data) ? response.data :
                    Array.isArray(response) ? response : [];

                return caughtPokemonArray;
            } catch (error) {
                console.warn('Bulk catch request failed while online:', error);

                if (error instanceof TypeError && error.message.includes('not iterable')) {
                    console.error('API response format is unexpected - response.data is not iterable');
                    throw new Error('API returned unexpected response format');
                }

                if (!this.isNetworkError(error)) {
                    throw error;
                }
            }
        }

        // Save as pending offline action
        const offlineAction: OfflineAction = {
            id: `catch_bulk_${Date.now()}`,
            type: 'bulk_catch',
            payload,
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);

        // Create optimistic caught pokemon entries
        const caughtPokemon: CaughtPokemon[] = [];

        for (const pokemonId of pokemonIds) {
            const pokemon = await indexedDBStorage.getPokemonByPokeApiId(pokemonId);
            if (pokemon) {
                const caught: CaughtPokemon = {
                    id: Date.now() + pokemonId, // Temporary ID
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
        // If online, make API call
        if (await this.isOnline()) {
            try {
                await this.client.delete(API_PATHS.POKEDEX.RELEASE(pokeApiId));
                return;
            } catch (error) {
                console.warn('Release request failed while online:', error);

                // If it's a network error, treat as offline and create offline action
                if (!this.isNetworkError(error)) {
                    throw error;
                }
            }
        }

        // Create offline action (either because we're offline or due to network error)
        // Save as pending offline action
        const offlineAction: OfflineAction = {
            id: `release_${pokeApiId}_${Date.now()}`,
            type: 'release',
            payload: { pokeApiId },
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);

        const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);
        const caughtPokemon = allCaughtPokemon.filter(cp => cp.pokemon.pokeApiId === pokeApiId);

        for (const caught of caughtPokemon) {
            await indexedDBStorage.deleteCaughtPokemon(userId, caught.pokemon.pokeApiId);
        }
    }

    async releaseBulkPokemon(userId: number, pokeApiIds: number[]): Promise<void> {

        if (!pokeApiIds || pokeApiIds.length === 0) {
            console.warn('releaseBulkPokemon: No Pokemon API IDs provided');
            return;
        }

        const payload = { pokeApiIds };

        // If online, make API call
        if (this.isOnline() && !isOfflineAccount()) {
            try {
                await this.client.delete(API_PATHS.POKEDEX.RELEASE_BULK, { data: payload });
                return;
            } catch (error) {
                console.warn('Bulk release request failed while online:', error);

                // If it's a network error, treat as offline and create offline action
                if (!this.isNetworkError(error)) {
                    throw error;
                    // Fall through to offline action creation
                }
            }
        }

        // Create offline action (either because we're offline or due to network error)
        // Save as pending offline action
        const offlineAction: OfflineAction = {
            id: `release_bulk_${Date.now()}`,
            type: 'bulk_release',
            payload: { pokeApiIds },
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);

        const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);

        for (const pokeApiId of pokeApiIds) {
            const caughtPokemon = allCaughtPokemon.filter(cp => cp.pokemon.pokeApiId === pokeApiId);
            for (const caught of caughtPokemon) {
                await indexedDBStorage.deleteCaughtPokemon(userId, caught.pokemon.pokeApiId);
            }
        }
    }

    async updateCaughtPokemon(
        userId: number,
        pokemonApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null> {
        // If online, make API call
        if (this.isOnline()) {
            try {
                const response = await this.client.patch<CaughtPokemon>(API_PATHS.POKEDEX.UPDATE(pokemonApiId), updates);

                const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);
                const caughtPokemon = allCaughtPokemon.find(cp => cp.pokemon.pokeApiId === pokemonApiId);

                if (caughtPokemon) {
                    const updatedPokemon = { ...caughtPokemon, ...updates }; // Apply all updates locally
                    await indexedDBStorage.saveCaughtPokemon(updatedPokemon);
                    return updatedPokemon;
                }

                return response.data;
            } catch (error) {
                console.warn('Update request failed while online:', error);

                // If it's a network error, treat as offline and create offline action
                if (!this.isNetworkError(error)) {
                    throw error;
                }
            }
        }

        // Create offline action (either because we're offline or due to network error)
        // For offline mode, update directly in IndexedDB and create pending action
        const allCaught = await indexedDBStorage.getCaughtPokemon(userId);
        const pokemon = allCaught.find(p => p.pokemon.pokeApiId === pokemonApiId);

        if (!pokemon) return null;

        const updatedPokemon = { ...pokemon, ...updates };
        await indexedDBStorage.saveCaughtPokemon(updatedPokemon);

        // Create pending action for sync when online
        const offlineAction: OfflineAction = {
            id: `update_${pokemonApiId}_${Date.now()}`,
            type: 'update',
            payload: { pokemonApiId, ...updates },
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);

        return updatedPokemon;
    }

    async getPokedexStats(userId: number): Promise<PokedexStats> {
        if (this.isOnline()) {
            try {
                const response = await this.client.get<PokedexStats>(API_PATHS.POKEDEX.STATS);

                return response.data;
            } catch (error) {
                console.warn('Stats request failed, calculating from offline data:', error);
            }
        }

        const caughtPokemon = await indexedDBStorage.getCaughtPokemon(userId);

        const TOTAL_POKEMON_COUNT = 1025;

        const totalCaught = caughtPokemon.length;
        const totalFavorites = caughtPokemon.filter(p => p.isFavorite).length;
        const totalAvailable = TOTAL_POKEMON_COUNT;
        const completionPercentage = totalAvailable > 0 ? (totalCaught / totalAvailable) * 100 : 0;

        return {
            totalCaught,
            totalFavorites,
            completionPercentage,
            totalAvailable
        };
    }
}

// Export singleton instance
export const pokedexDataSource = new PokedexDataSource();
