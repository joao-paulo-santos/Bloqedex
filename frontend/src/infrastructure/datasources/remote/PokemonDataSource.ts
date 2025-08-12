import type { Pokemon, PaginatedResponse } from '../../../core/types';
import { BaseDataSource } from './BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';

// Data source for Pokemon data operations
export class PokemonDataSource extends BaseDataSource {
    async getPokemonList(page: number = 0, pageSize: number = 20): Promise<PaginatedResponse<Pokemon>> {
        // Calculate the Pokemon ID range that would be on this page
        // Assuming Pokemon IDs are sequential starting from 1
        const startId = (page * pageSize) + 1;
        const endId = (page + 1) * pageSize;

        const hasAllPokemonInRange = await indexedDBStorage.hasPokemonRange(startId, endId);

        if (hasAllPokemonInRange) {
            const pokemon = await indexedDBStorage.getPokemonByIdRange(startId, endId);
            const totalCount = await indexedDBStorage.getPokemonCount();
            return {
                pokemon,
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            };
        }

        // We don't have all Pokemon for this page, so fetch from API if online
        if (this.isOnline()) {
            try {
                const response = await this.client.get<PaginatedResponse<Pokemon>>('/pokemon', {
                    params: { pageIndex: page, pageSize }
                });

                await indexedDBStorage.saveManyPokemon(response.data.pokemon);
                return response.data;

            } catch (error) {
                console.warn('API request failed, falling back to cache:', error);
            }
        }

        // Offline fallback: return whatever we have in cache for this range
        const pokemon = await indexedDBStorage.getPokemonByIdRange(startId, endId);
        const totalCount = await indexedDBStorage.getPokemonCount();

        return {
            pokemon,
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }

    async getPokemon(id: number): Promise<Pokemon | null> {
        // Try offline storage first
        const offlineData = await indexedDBStorage.getPokemon(id);
        if (offlineData) {
            return offlineData;
        }

        // If online, fetch from API
        if (this.isOnline()) {
            try {
                const response = await this.client.get<Pokemon>(`/pokemon/${id}`);

                // Store the response for offline access
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
        // Cache-first: Try searching in cached Pokemon first
        const cachedPokemon = await indexedDBStorage.getAllPokemon();
        const cachedResults = cachedPokemon.filter(pokemon =>
            pokemon.name.toLowerCase().includes(query.toLowerCase())
        );

        // If we have cached results and we're offline, return them
        if (!this.isOnline()) {
            console.log(`Serving search results from cache (${cachedResults.length} Pokemon)`);
            return cachedResults;
        }

        // If online, fetch from API to get more comprehensive results
        try {
            const response = await this.client.get<Pokemon[]>('/pokemon/search', {
                params: { q: query }
            });

            // Save new Pokemon to cache
            await indexedDBStorage.saveManyPokemon(response.data);
            console.log(`Fetched search results from API and cached new Pokemon`);

            return response.data;
        } catch (error) {
            console.warn('Search API failed, returning cached results:', error);
            return cachedResults;
        }
    }
}

// Export singleton instance
export const pokemonDataSource = new PokemonDataSource();
