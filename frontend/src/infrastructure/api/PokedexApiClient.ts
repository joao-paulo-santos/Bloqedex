import type { CaughtPokemon, PokedexStats } from '../../core/entities';
import type { OfflineAction } from '../../core/interfaces';
import { BaseApiClient } from './BaseApiClient';
import { indexedDBStorage } from '../storage/IndexedDBStorage';

// API client for Pokedex operations (caught Pokemon management)
export class PokedexApiClient extends BaseApiClient {
    async getCaughtPokemon(): Promise<CaughtPokemon[]> {
        // If online, fetch from API
        if (this.isOnline()) {
            try {
                const response = await this.client.get<CaughtPokemon[]>('/pokedex/caught');

                // Save to offline storage
                for (const caught of response.data) {
                    await indexedDBStorage.saveCaughtPokemon(caught);
                }

                return response.data;
            } catch (error) {
                console.warn('API request failed, falling back to offline data:', error);
            }
        }

        // Fallback to offline data
        return await indexedDBStorage.getCaughtPokemon();
    }

    async catchPokemon(pokemonId: number, notes?: string): Promise<CaughtPokemon> {
        const payload = { pokemonId, notes };

        // If online, make API call
        if (this.isOnline()) {
            try {
                const response = await this.client.post<CaughtPokemon>('/pokedex/catch', payload);

                // Save to offline storage
                await indexedDBStorage.saveCaughtPokemon(response.data);

                return response.data;
            } catch (error) {
                console.warn('Catch request failed, saving for offline sync:', error);
            }
        }

        // Save as pending offline action
        const offlineAction: OfflineAction = {
            id: `catch_${pokemonId}_${Date.now()}`,
            type: 'catch',
            payload,
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);

        // Create optimistic caught pokemon entry
        const pokemon = await indexedDBStorage.getPokemon(pokemonId);
        if (pokemon) {
            const caughtPokemon: CaughtPokemon = {
                id: Date.now(), // Temporary ID
                pokemonId,
                pokemon,
                caughtAt: new Date().toISOString(),
                notes,
                isFavorite: false
            };

            await indexedDBStorage.saveCaughtPokemon(caughtPokemon);
            return caughtPokemon;
        }

        throw new Error('Pokemon not found');
    }

    async releasePokemon(caughtPokemonId: number): Promise<void> {
        // If online, make API call
        if (await this.isOnline()) {
            try {
                await this.client.delete(`/pokedex/release/${caughtPokemonId}`);

                // Remove from offline storage
                await indexedDBStorage.deleteCaughtPokemon(caughtPokemonId);

                return;
            } catch (error) {
                console.warn('Release request failed, saving for offline sync:', error);
            }
        }

        // Save as pending offline action
        const offlineAction: OfflineAction = {
            id: `release_${caughtPokemonId}_${Date.now()}`,
            type: 'release',
            payload: { caughtPokemonId },
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);

        // Optimistically remove from offline storage
        await indexedDBStorage.deleteCaughtPokemon(caughtPokemonId);
    }

    async getPokedexStats(): Promise<PokedexStats> {
        // If online, fetch from API
        if (this.isOnline()) {
            try {
                const response = await this.client.get<PokedexStats>('/pokedex/stats');

                return response.data;
            } catch (error) {
                console.warn('Stats request failed, calculating from offline data:', error);
            }
        }

        // Calculate from offline data
        const caughtPokemon = await indexedDBStorage.getCaughtPokemon();
        const allPokemon = await indexedDBStorage.getAllPokemon();

        const totalCaught = caughtPokemon.length;
        const totalFavorites = caughtPokemon.filter(p => p.isFavorite).length;
        const totalAvailable = allPokemon.length;
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
