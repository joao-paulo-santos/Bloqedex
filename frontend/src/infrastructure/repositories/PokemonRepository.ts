import type { Pokemon, IPokemonRepository, PaginatedResponse } from '../../core/types';
import { pokemonDataSource } from '../datasources/DataSourceIndex';
import { indexedDBStorage } from '../storage/IndexedDBStorage';

export class PokemonRepository implements IPokemonRepository {
    async getPaginated(
        pageIndex: number = 1,
        pageSize: number = 20
    ): Promise<PaginatedResponse<Pokemon>> {
        return await pokemonDataSource.getPokemonList(pageIndex, pageSize);
    }

    async getById(id: number): Promise<Pokemon | null> {
        return await pokemonDataSource.getPokemon(id);
    }

    async search(name: string): Promise<Pokemon[]> {
        return await pokemonDataSource.searchPokemon(name);
    }

    async savePokemon(pokemon: Pokemon): Promise<void> {
        await indexedDBStorage.savePokemon(pokemon);
    }

    async saveManyPokemon(pokemon: Pokemon[]): Promise<void> {
        for (const p of pokemon) {
            await this.savePokemon(p);
        }
    }
}

export const pokemonRepository = new PokemonRepository();
