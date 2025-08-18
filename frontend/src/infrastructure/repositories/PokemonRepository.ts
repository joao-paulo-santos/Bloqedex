import type { Pokemon, IPokemonRepository, PaginatedResponse } from '../../core/types';
import { localPokemonDataSource, remotePokemonDataSource } from '../datasources/DataSourceIndex';

export class PokemonRepository implements IPokemonRepository {
    async getPaginated(
        isOnline: boolean,
        pageIndex: number = 1,
        pageSize: number = 20
    ): Promise<PaginatedResponse<Pokemon>> {
        const startId = (pageIndex * pageSize) + 1;
        const endId = (pageIndex + 1) * pageSize;

        const hasAllPokemonInRange = await localPokemonDataSource.hasAllPokemonsInRange(startId, endId);
        const pokemon = await localPokemonDataSource.getPokemonsInRange(startId, endId);
        const totalCount = await localPokemonDataSource.getPokemonCount();
        if (hasAllPokemonInRange) {
            return {
                pokemon,
                page: pageIndex,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            };
        }
        if (isOnline) {
            const response = await remotePokemonDataSource.getPokemonList(pageIndex, pageSize);
            if (response) {
                await localPokemonDataSource.saveManyPokemon(response.pokemon);
                return response;
            }
        }
        return {
            pokemon,
            page: pageIndex,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }

    async getById(pokeApiId: number, isOnline: boolean): Promise<Pokemon | null> {
        let pokemon = await localPokemonDataSource.getPokemon(pokeApiId);
        if (!pokemon && isOnline) {
            pokemon = await remotePokemonDataSource.getPokemon(pokeApiId);
        }
        return pokemon;
    }

    async search(name: string, isOnline: boolean): Promise<Pokemon[]> {
        if (isOnline) {
            const onlinePokemon = await remotePokemonDataSource.searchPokemon(name);
            if (onlinePokemon) {
                await localPokemonDataSource.saveManyPokemon(onlinePokemon);
                return onlinePokemon;
            }
        }
        return await localPokemonDataSource.searchPokemon(name);
    }

    async savePokemon(pokemon: Pokemon): Promise<void> {
        await localPokemonDataSource.savePokemon(pokemon);
    }

    async saveManyPokemon(pokemon: Pokemon[]): Promise<void> {
        await localPokemonDataSource.saveManyPokemon(pokemon);
    }

    async getAllLocal(): Promise<Pokemon[]> {
        return localPokemonDataSource.getAllLocal();
    }

    async clearAllCaughtStatus(): Promise<void> {
        await localPokemonDataSource.clearAllCaughtStatus();
    }
}
export const pokemonRepository = new PokemonRepository();
