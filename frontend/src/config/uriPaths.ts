/**
 * Centralized API endpoint paths for all data sources
 * This file contains all the URI paths used across the application's data sources
 * for bigger projects each feature should have its own file and this one work only
 * as an aggregator.
 */

/**
 * Authentication-related endpoints
 */
export const AUTH_PATHS = {
    LOGIN: '/Auth/login',
    REGISTER: '/Auth/register',
    ME: '/Auth/me',
} as const;

/**
 * Pokemon-related endpoints
 */
export const POKEMON_PATHS = {
    LIST: '/pokemon',
    BY_ID: (id: number) => `/pokemon/${id}`,
    SEARCH: '/pokemon/search',
} as const;

/**
 * Pokedex-related endpoints (caught Pokemon management)
 */
export const POKEDEX_PATHS = {
    LIST: '/pokedex',
    CATCH: '/pokedex/catch',
    CATCH_BULK: '/pokedex/catch/bulk',
    RELEASE: (pokeApiId: number) => `/pokedex/${pokeApiId}`,
    RELEASE_BULK: '/pokedex/release/bulk',
    UPDATE: (pokeApiId: number) => `/pokedex/${pokeApiId}`,
    STATS: '/pokedex/stats',
} as const;

/**
 * Sharing-related endpoints
 */
export const SHARING_PATHS = {
    CREATE: '/sharing/create',
    GET_BY_TOKEN: (shareToken: string) => `/sharing/${shareToken}`,
    MY_SHARES: '/sharing/my-shares',
} as const;

/**
 * System-related endpoints
 */
export const SYSTEM_PATHS = {
    HEALTH: '/health',
} as const;

/**
 * All API paths grouped by domain
 */
export const API_PATHS = {
    AUTH: AUTH_PATHS,
    POKEMON: POKEMON_PATHS,
    POKEDEX: POKEDEX_PATHS,
    SHARING: SHARING_PATHS,
    SYSTEM: SYSTEM_PATHS,
} as const;

/**
 * Type definitions for better type safety
 */
export type AuthPaths = typeof AUTH_PATHS;
export type PokemonPaths = typeof POKEMON_PATHS;
export type PokedexPaths = typeof POKEDEX_PATHS;
export type SharingPaths = typeof SHARING_PATHS;
export type SystemPaths = typeof SYSTEM_PATHS;
export type ApiPaths = typeof API_PATHS;
