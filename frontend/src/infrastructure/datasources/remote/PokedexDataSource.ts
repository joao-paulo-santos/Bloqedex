import type { CaughtPokemon, PokedexStats, OfflineAction } from '../../../core/types';
import { BaseDataSource } from './BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';
import { getCurrentUserId } from '../../../common/utils/userContext';
import { API_PATHS } from '../../../config/uriPaths';

// Data source for Pokedex operations (caught Pokemon management)
export class PokedexDataSource extends BaseDataSource {
    async getCaughtPokemon(pageIndex: number = 0, pageSize: number = 20): Promise<{ caughtPokemon: CaughtPokemon[], totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean }> {
        const currentUserId = getCurrentUserId();

        if (this.isOnline()) {
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

        const offlineCaughtPokemon = await indexedDBStorage.getCaughtPokemon(currentUserId || undefined);

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

    async catchPokemon(pokemonId: number, notes?: string): Promise<CaughtPokemon> {
        const payload = { pokemonId, notes };

        if (this.isOnline()) {
            try {
                const response = await this.client.post<CaughtPokemon>(API_PATHS.POKEDEX.CATCH, payload);

                const existingCaught = await indexedDBStorage.getCaughtPokemon(getCurrentUserId() || undefined);
                const tempEntries = existingCaught.filter(cp =>
                    cp.pokemon.pokeApiId === response.data.pokemon.pokeApiId &&
                    cp.id !== response.data.id &&
                    (cp.id > 1000000000)
                );

                for (const tempEntry of tempEntries) {
                    await indexedDBStorage.deleteCaughtPokemon(tempEntry.id);
                }

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
            const currentUserId = getCurrentUserId();
            if (!currentUserId) {
                throw new Error('No authenticated user found');
            }

            const caughtPokemon: CaughtPokemon = {
                id: Date.now(), // Temporary ID
                pokemon,
                userId: typeof currentUserId === 'string' ? parseInt(currentUserId, 10) : currentUserId,
                caughtDate: new Date().toISOString(),
                notes,
                isFavorite: false
            };

            await indexedDBStorage.saveCaughtPokemon(caughtPokemon);
            return caughtPokemon;
        }

        throw new Error('Pokemon not found');
    }

    async catchBulkPokemon(pokemonIds: number[], notes?: string): Promise<CaughtPokemon[]> {
        const payload = {
            pokemonToCatch: pokemonIds.map(pokeApiId => ({
                pokemonId: pokeApiId,
                notes: notes || ""
            }))
        };

        // If online, make API call
        if (this.isOnline()) {
            try {
                const response = await this.client.post<CaughtPokemon[]>(API_PATHS.POKEDEX.CATCH_BULK, payload);


                const caughtPokemonArray = Array.isArray(response.data) ? response.data :
                    Array.isArray(response) ? response : [];


                for (const caught of caughtPokemonArray) {
                    const existingCaught = await indexedDBStorage.getCaughtPokemon(getCurrentUserId() || undefined);
                    const tempEntries = existingCaught.filter(cp =>
                        cp.pokemon.pokeApiId === caught.pokemon.pokeApiId &&
                        cp.id !== caught.id &&
                        (cp.id > 1000000000)
                    );

                    for (const tempEntry of tempEntries) {
                        await indexedDBStorage.deleteCaughtPokemon(tempEntry.id);
                    }

                    await indexedDBStorage.saveCaughtPokemon(caught);
                }

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
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            throw new Error('No authenticated user found');
        }

        for (const pokemonId of pokemonIds) {
            const pokemon = await indexedDBStorage.getPokemonByPokeApiId(pokemonId);
            if (pokemon) {
                const caught: CaughtPokemon = {
                    id: Date.now() + pokemonId, // Temporary ID
                    pokemon,
                    userId: typeof currentUserId === 'string' ? parseInt(currentUserId, 10) : currentUserId,
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

    async releasePokemon(pokeApiId: number): Promise<void> {
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

        const currentUserId = getCurrentUserId();
        const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(currentUserId || undefined);
        const caughtPokemon = allCaughtPokemon.filter(cp => cp.pokemon.pokeApiId === pokeApiId);

        for (const caught of caughtPokemon) {
            await indexedDBStorage.deleteCaughtPokemon(caught.id);
        }
    }

    async releaseBulkPokemon(pokeApiIds: number[]): Promise<void> {

        if (!pokeApiIds || pokeApiIds.length === 0) {
            console.warn('releaseBulkPokemon: No Pokemon API IDs provided');
            return;
        }

        const payload = { pokeApiIds };

        // If online, make API call
        if (this.isOnline()) {
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

        const currentUserId = getCurrentUserId();
        const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(currentUserId || undefined);

        for (const pokeApiId of pokeApiIds) {
            const caughtPokemon = allCaughtPokemon.filter(cp => cp.pokemon.pokeApiId === pokeApiId);
            for (const caught of caughtPokemon) {
                await indexedDBStorage.deleteCaughtPokemon(caught.id);
            }
        }
    }

    async updateCaughtPokemon(
        pokemonApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null> {
        // If online, make API call
        if (this.isOnline()) {
            try {
                const response = await this.client.patch<CaughtPokemon>(API_PATHS.POKEDEX.UPDATE(pokemonApiId), updates);

                const currentUserId = getCurrentUserId();
                const allCaughtPokemon = await indexedDBStorage.getCaughtPokemon(currentUserId || undefined);
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
        const currentUserId = getCurrentUserId();
        const allCaught = await indexedDBStorage.getCaughtPokemon(currentUserId || undefined);
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

    async getPokedexStats(): Promise<PokedexStats> {
        if (this.isOnline()) {
            try {
                const response = await this.client.get<PokedexStats>(API_PATHS.POKEDEX.STATS);

                return response.data;
            } catch (error) {
                console.warn('Stats request failed, calculating from offline data:', error);
            }
        }

        const currentUserId = getCurrentUserId();
        const caughtPokemon = await indexedDBStorage.getCaughtPokemon(currentUserId || undefined);

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
