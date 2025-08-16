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
    getPaginated(isOnline: boolean, pageIndex?: number, pageSize?: number): Promise<PaginatedResponse<Pokemon>>;
    getById(pokeApiId: number, isOnline: boolean): Promise<Pokemon | null>;
    search(name: string, isOnline: boolean): Promise<Pokemon[]>;
    savePokemon(pokemon: Pokemon): Promise<void>;
    saveManyPokemon(pokemon: Pokemon[]): Promise<void>;
}

export interface IPokedexRepository {
    getCaughtPokemon(userId: number, isOnline: boolean, pageIndex?: number, pageSize?: number): Promise<PaginatedResponse<CaughtPokemon>>;
    getFavorites(userId: number): Promise<CaughtPokemon[]>;
    catchPokemon(userId: number, pokeApiId: number, isOnline: boolean, notes?: string): Promise<CaughtPokemon | null>;
    catchBulkPokemon(userId: number, pokeApiIds: number[], isOnline: boolean, notes?: string): Promise<CaughtPokemon[]>;
    releasePokemon(userId: number, pokeApiId: number, isOnline: boolean): Promise<boolean>;
    releaseBulkPokemon(userId: number, pokeApiIds: number[], isOnline: boolean): Promise<boolean>;
    updateCaughtPokemon(
        userId: number,
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean },
        isOnline: boolean
    ): Promise<CaughtPokemon | null>;
    getStats(userId: number, isOnline: boolean): Promise<PokedexStats | null>;
    clearUserData(userId: number, isOnline: boolean): Promise<boolean>;
}
