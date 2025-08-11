import type { Pokemon } from '../../core/entities';
import type { IPokemonRepository, PaginatedResponse } from '../../core/interfaces';
import { pokemonApiClient } from '../api/ApiIndex';
import { indexedDBStorage } from '../storage/IndexedDBStorage';

export class PokemonRepository implements IPokemonRepository {
    async getPaginated(
        pageIndex: number = 1,
        pageSize: number = 20
    ): Promise<PaginatedResponse<Pokemon>> {
        return await pokemonApiClient.getPokemonList(pageIndex, pageSize);
    }

    async getById(id: number): Promise<Pokemon | null> {
        return await pokemonApiClient.getPokemon(id);
    }

    async search(name: string): Promise<Pokemon[]> {
        return await pokemonApiClient.searchPokemon(name);
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
