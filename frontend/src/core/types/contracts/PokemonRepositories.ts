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
    getCaughtPokemon(userId: number, pageIndex?: number, pageSize?: number): Promise<PaginatedResponse<CaughtPokemon>>;
    getFavorites(userId: number): Promise<CaughtPokemon[]>;
    catchPokemon(userId: number, pokemonId: number, notes?: string): Promise<CaughtPokemon | null>;
    catchBulkPokemon(userId: number, pokemonIds: number[], notes?: string): Promise<CaughtPokemon[]>;
    releasePokemon(userId: number, caughtPokemonId: number): Promise<boolean>;
    releaseBulkPokemon(userId: number, caughtPokemonIds: number[]): Promise<number[]>;
    updateCaughtPokemon(
        userId: number,
        pokemonApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<CaughtPokemon | null>;
    getStats(userId: number): Promise<PokedexStats | null>;
    clearUserData(userId: number): Promise<boolean>;
}
