import type { Pokemon } from '../entities/Pokemon';
import type { CaughtPokemon } from '../entities/CaughtPokemon';
import type { PokedexStats } from '../entities/PokedexStats';

export interface PaginatedResponse<T> {
    pokemon: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface IPokemonRepository {
    getPaginated(pageIndex?: number, pageSize?: number): Promise<PaginatedResponse<Pokemon>>;
    getById(id: number): Promise<Pokemon | null>;
    search(name: string): Promise<Pokemon[]>;
    savePokemon(pokemon: Pokemon): Promise<void>;
    saveManyPokemon(pokemon: Pokemon[]): Promise<void>;
}

export interface IPokedexRepository {
    getCaughtPokemon(pageIndex?: number, pageSize?: number): Promise<PaginatedResponse<CaughtPokemon>>;
    getFavorites(): Promise<CaughtPokemon[]>;
    catchPokemon(pokemonId: number, notes?: string): Promise<CaughtPokemon | null>;
    catchBulkPokemon(pokemonIds: number[], notes?: string): Promise<CaughtPokemon[]>;
    releasePokemon(caughtPokemonId: number): Promise<boolean>;
    releaseBulkPokemon(caughtPokemonIds: number[]): Promise<number[]>;
    updateCaughtPokemon(
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null>;
    getStats(): Promise<PokedexStats | null>;
}
