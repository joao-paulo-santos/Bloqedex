import type { Pokemon } from '../../core/entities';
import type { PaginatedResponse } from '../../core/interfaces';
import { BaseApiClient } from './BaseApiClient';
import { indexedDBStorage } from '../storage/IndexedDBStorage';

// API client for Pokemon data operations
export class PokemonApiClient extends BaseApiClient {
    async getPokemonList(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Pokemon>> {
        const cacheKey = `pokemon_list_${page}_${pageSize}`;

        // Try cache first
        const cachedData = await this.getCachedData<PaginatedResponse<Pokemon>>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        // If online, fetch from API
        if (await this.isOnline()) {
            try {
                const response = await this.client.get<PaginatedResponse<Pokemon>>('/pokemon', {
                    params: { page, pageSize }
                });

                // Cache the response
                await this.setCachedData(cacheKey, response.data);

                // Save individual Pokemon to storage
                for (const pokemon of response.data.items) {
                    await indexedDBStorage.savePokemon(pokemon);
                }

                return response.data;
            } catch (error) {
                console.warn('API request failed, falling back to offline data:', error);
            }
        }

        // Fallback to offline data
        const allPokemon = await indexedDBStorage.getAllPokemon();
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const items = allPokemon.slice(startIndex, endIndex);

        return {
            items,
            page: page,
            pageSize,
            totalCount: allPokemon.length,
            totalPages: Math.ceil(allPokemon.length / pageSize)
        };
    }

    async getPokemon(id: number): Promise<Pokemon | null> {
        const cacheKey = `pokemon_${id}`;

        // Try cache first
        const cachedData = await this.getCachedData<Pokemon>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        // Try offline storage
        const offlineData = await indexedDBStorage.getPokemon(id);
        if (offlineData) {
            return offlineData;
        }

        // If online, fetch from API
        if (await this.isOnline()) {
            try {
                const response = await this.client.get<Pokemon>(`/pokemon/${id}`);

                // Cache and store the response
                await this.setCachedData(cacheKey, response.data);
                await indexedDBStorage.savePokemon(response.data);

                return response.data;
            } catch (error) {
                console.warn('Pokemon fetch failed:', error);
                return null;
            }
        }

        return null;
    }

    async searchPokemon(query: string): Promise<Pokemon[]> {
        const cacheKey = `pokemon_search_${query}`;

        // Try cache first
        const cachedData = await this.getCachedData<Pokemon[]>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        // If online, fetch from API
        if (await this.isOnline()) {
            try {
                const response = await this.client.get<Pokemon[]>('/pokemon/search', {
                    params: { q: query }
                });

                // Cache the response (shorter TTL for search results)
                await this.setCachedData(cacheKey, response.data, 60000); // 1 minute

                return response.data;
            } catch (error) {
                console.warn('Search failed, falling back to offline search:', error);
            }
        }

        // Fallback to offline search
        const allPokemon = await indexedDBStorage.getAllPokemon();
        return allPokemon.filter(pokemon =>
            pokemon.name.toLowerCase().includes(query.toLowerCase())
        );
    }
}

// Export singleton instance
export const pokemonApiClient = new PokemonApiClient();
