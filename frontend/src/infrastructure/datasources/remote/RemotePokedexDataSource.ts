import type { CaughtPokemon, PokedexStats } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { API_PATHS } from '../../../config/uriPaths';

// Data source for Pokedex operations (caught Pokemon management)
export class RemotePokedexDataSource extends BaseDataSource {
    async getCaughtPokemon(pageIndex: number = 0, pageSize: number = 20): Promise<{ caughtPokemon: CaughtPokemon[], totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean } | null> {
        try {
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

            return {
                caughtPokemon: response.data.caughtPokemon,
                totalCount: response.data.totalCount,
                hasNextPage: response.data.hasNextPage,
                hasPreviousPage: response.data.hasPreviousPage
            };
        } catch (error) {
            console.warn('API request failed, falling back to offline data:', error);
            return null;
        }
    }

    async catchPokemon(pokemonId: number, notes?: string): Promise<CaughtPokemon | null> {
        const payload = { pokemonId, notes };
        try {
            const response = await this.client.post<CaughtPokemon>(API_PATHS.POKEDEX.CATCH, payload);
            return response.data;
        } catch (error) {
            console.warn('Catch request failed while online:', error);

            if (!this.isNetworkError(error)) {
                throw error;
            }
        }
        return null;
    }

    async catchBulkPokemon(pokemonIds: number[], notes?: string): Promise<CaughtPokemon[] | null> {
        const payload = {
            pokemonToCatch: pokemonIds.map(pokeApiId => ({
                pokemonId: pokeApiId,
                notes: notes || ""
            }))
        };
        try {
            const response = await this.client.post<CaughtPokemon[]>(API_PATHS.POKEDEX.CATCH_BULK, payload);
            const caughtPokemonArray = Array.isArray(response.data) ? response.data :
                Array.isArray(response) ? response : [];
            return caughtPokemonArray;
        } catch (error) {
            console.warn('Bulk catch request failed while online:', error);

            if (!this.isNetworkError(error)) {
                throw error;
            }
        }
        return null;
    }

    async releasePokemon(pokeApiId: number): Promise<boolean> {
        try {
            await this.client.delete(API_PATHS.POKEDEX.RELEASE(pokeApiId));
            return true;
        } catch (error) {
            console.warn('Release request failed while online:', error);

            if (!this.isNetworkError(error)) {
                throw error;
            }
        }
        return false;
    }

    async releaseBulkPokemon(pokeApiIds: number[]): Promise<boolean> {
        const payload = { pokeApiIds };

        try {
            await this.client.delete(API_PATHS.POKEDEX.RELEASE_BULK, { data: payload });
            return true;
        } catch (error) {
            console.warn('Bulk release request failed while online:', error);

            if (!this.isNetworkError(error)) {
                throw error;
            }
        }
        return false;
    }

    async updateCaughtPokemon(
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null> {
        try {
            const response = await this.client.patch<CaughtPokemon>(API_PATHS.POKEDEX.UPDATE(pokeApiId), updates);
            return response.data;
        } catch (error) {
            console.warn('Update request failed while online:', error);

            if (!this.isNetworkError(error)) {
                throw error;
            }
        }
        return null;
    }

    async getPokedexStats(): Promise<PokedexStats | null> {
        try {
            const response = await this.client.get<PokedexStats>(API_PATHS.POKEDEX.STATS);

            return response.data;
        } catch (error) {
            console.warn('Stats request failed, calculating from offline data:', error);

            if (!this.isNetworkError(error)) {
                throw error;
            }
        }
        return null;
    }
}

// Export singleton instance
export const remotePokedexDataSource = new RemotePokedexDataSource();
