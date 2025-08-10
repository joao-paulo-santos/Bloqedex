import type { Pokemon, CaughtPokemon, PokedexStats } from '../entities';
import type { PokemonFilters } from './PokemonFilters';

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface IPokemonRepository {
    getAll(filters?: PokemonFilters, pageIndex?: number, pageSize?: number): Promise<PaginatedResponse<Pokemon>>;
    getById(id: number): Promise<Pokemon | null>;
    search(name: string): Promise<Pokemon[]>;
    savePokemon(pokemon: Pokemon): Promise<void>;
    saveManyPokemon(pokemon: Pokemon[]): Promise<void>;
}

export interface IPokedexRepository {
    getCaughtPokemon(pageIndex?: number, pageSize?: number): Promise<PaginatedResponse<CaughtPokemon>>;
    getFavorites(): Promise<CaughtPokemon[]>;
    catchPokemon(pokemonId: number, notes?: string): Promise<CaughtPokemon | null>;
    releasePokemon(caughtPokemonId: number): Promise<boolean>;
    updateCaughtPokemon(
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean; nickname?: string }
    ): Promise<CaughtPokemon | null>;
    getStats(): Promise<PokedexStats | null>;
}
