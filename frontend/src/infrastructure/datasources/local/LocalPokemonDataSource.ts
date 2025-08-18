import type { Pokemon, PaginatedResponse } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';

// Data source for Local Pokemon data operations
export class LocalPokemonDataSource extends BaseDataSource {
    async getPokemonList(page: number = 0, pageSize: number = 20): Promise<PaginatedResponse<Pokemon>> {
        const startId = (page * pageSize) + 1;
        const endId = (page + 1) * pageSize;

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

    async getPokemonsInRange(startId: number, endId: number): Promise<Pokemon[]> {
        return await indexedDBStorage.getPokemonByIdRange(startId, endId);
    }

    async getPokemon(id: number): Promise<Pokemon | null> {
        return await indexedDBStorage.getPokemon(id);
    }

    async getPokemonCount(): Promise<number> {
        return await indexedDBStorage.getPokemonCount();
    }

    async searchPokemon(query: string): Promise<Pokemon[]> {
        const cachedPokemon = await indexedDBStorage.getAllPokemon();
        return cachedPokemon.filter(pokemon =>
            pokemon.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    async hasAllPokemonsInRange(startId: number, endId: number): Promise<boolean> {
        return await indexedDBStorage.hasPokemonRange(startId, endId);
    }

    async saveManyPokemon(pokemon: Pokemon[]): Promise<void> {
        return await indexedDBStorage.saveManyPokemon(pokemon);
    }

    async savePokemon(pokemon: Pokemon): Promise<void> {
        return await indexedDBStorage.savePokemon(pokemon);
    }

    async getAllLocal(): Promise<Pokemon[]> {
        return await indexedDBStorage.getAllPokemon();
    }

    async clearAllCaughtStatus(): Promise<void> {
        return await indexedDBStorage.clearAllCaughtStatus();
    }
}

// Export singleton instance
export const localPokemonDataSource = new LocalPokemonDataSource();
