import type { Pokemon, PaginatedResponse } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { API_PATHS } from '../../../config/uriPaths';

// Data source for Pokemon data operations
export class RemotePokemonDataSource extends BaseDataSource {
    async getPokemonList(page: number = 0, pageSize: number = 20): Promise<PaginatedResponse<Pokemon> | null> {

        try {
            const response = await this.client.get<PaginatedResponse<Pokemon>>(API_PATHS.POKEMON.LIST, {
                params: { pageIndex: page, pageSize }
            });

            return response.data;

        } catch (error) {
            console.warn('API request failed, falling back to cache:', error);
            return null;
        }
    }

    async getPokemon(id: number): Promise<Pokemon | null> {
        try {
            const response = await this.client.get<Pokemon>(API_PATHS.POKEMON.BY_ID(id));
            return response.data;
        } catch (error) {
            console.warn('Pokemon fetch failed:', error);
            return null;
        }
    }

    async searchPokemon(query: string): Promise<Pokemon[] | null> {
        try {
            const response = await this.client.get<Pokemon[]>(API_PATHS.POKEMON.SEARCH, {
                params: { q: query }
            });
            return response.data;
        } catch (error) {
            console.warn('Search API failed, returning cached results:', error);
            return null;
        }
    }
}

// Export singleton instance
export const remotePokemonDataSource = new RemotePokemonDataSource();
