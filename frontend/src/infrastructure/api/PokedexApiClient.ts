import type { CaughtPokemon, PokedexStats } from '../../core/entities';
import type { OfflineAction } from '../../core/interfaces';
import { BaseApiClient } from './BaseApiClient';
import { indexedDBStorage } from '../storage/IndexedDBStorage';
import { getCurrentUserId } from '../../common/utils/userContext';

// API client for Pokedex operations (caught Pokemon management)
export class PokedexApiClient extends BaseApiClient {
    private isNetworkError(error: unknown): boolean {
        if (!error || typeof error !== 'object') return false;

        const err = error as {
            message?: string;
            code?: string;
            status?: number;
            response?: { status?: number };
        };
        const errorMessage = err.message?.toLowerCase() || '';
        const errorCode = err.code?.toLowerCase() || '';

        const networkErrorPatterns = [
            'network error',
            'connection refused',
            'err_connection_refused',
            'err_network',
            'err_internet_disconnected',
            'failed to fetch',
            'net::err_',
            'timeout',
            'enotfound',
            'econnrefused',
            'enetdown',
            'enetunreach',
            'ehostunreach',
            'econnreset'
        ];

        const networkStatusCodes = [0, 502, 503, 504];

        return networkErrorPatterns.some(pattern =>
            errorMessage.includes(pattern) || errorCode.includes(pattern)
        ) || networkStatusCodes.includes(err.status || 0) || networkStatusCodes.includes(err.response?.status || 0);
    }
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
                    }>('/pokedex', {
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
                const response = await this.client.post<CaughtPokemon>('/pokedex/catch', payload);

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
                const response = await this.client.post<CaughtPokemon[]>('/pokedex/catch/bulk', payload);


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
                await this.client.delete(`/pokedex/release/${pokeApiId}`);
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
                await this.client.delete('/pokedex/release/bulk/pokeapi', { data: payload });
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
                const response = await this.client.patch<CaughtPokemon>(`/pokedex/update/${pokemonApiId}`, updates);

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
                const response = await this.client.get<PokedexStats>('/pokedex/stats');

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
export const pokedexApiClient = new PokedexApiClient();
