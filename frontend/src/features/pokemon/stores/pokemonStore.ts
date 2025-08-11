import { create } from 'zustand';
import type { Pokemon } from '../../../core/entities';
import type { PokemonFilters } from '../../../core/interfaces';
import { PokemonUseCases } from '../../../core/usecases';
import { pokemonRepository } from '../../../infrastructure/repositories';
import { indexedDBStorage } from '../../../infrastructure/storage/IndexedDBStorage';
import { getLastConsecutiveId, getLastConsecutiveIdFromMap } from '../../../common/utils/pokemonHelpers';
import { apiConfig } from '../../../config/api';

interface PokemonState {
    pokemonMap: Map<number, Pokemon>;
    lastConsecutiveId: number;
    totalPokemons: number | null;
    allPokemonFetchedAt: number | null; // Timestamp when all Pokemon were fetched
    isLoading: boolean;
    error: string | null;
    filters: PokemonFilters;

    getPokemonArray: () => Pokemon[];
    getPokemonByPokeApiId: (pokeApiId: number) => Pokemon | undefined;
    hasAllPokemon: () => boolean;
    isCacheStale: () => boolean;

    initialize: () => Promise<void>;
    fillCache: () => Promise<void>;
    searchPokemon: (name: string) => Promise<void>;
    setFilters: (filters: PokemonFilters) => void;
    clearError: () => void;
}

const pokemonUseCases = new PokemonUseCases(pokemonRepository);

export const usePokemonStore = create<PokemonState>((set, get) => ({
    pokemonMap: new Map<number, Pokemon>(),
    lastConsecutiveId: 0,
    totalPokemons: null,
    allPokemonFetchedAt: null,
    isLoading: false,
    error: null,
    filters: {
        sortBy: 'pokeApiId',
        sortOrder: 'asc'
    },

    getPokemonArray: () => {
        const state = get();
        return Array.from(state.pokemonMap.values()).sort((a, b) => a.pokeApiId - b.pokeApiId);
    },

    getPokemonByPokeApiId: (pokeApiId: number) => {
        const state = get();
        return state.pokemonMap.get(pokeApiId);
    },

    hasAllPokemon: () => {
        const state = get();
        return state.totalPokemons !== null && state.pokemonMap.size >= state.totalPokemons;
    },

    isCacheStale: () => {
        const state = get();
        if (!state.allPokemonFetchedAt) return true;

        const now = Date.now();
        const cacheAge = now - state.allPokemonFetchedAt;
        return cacheAge > apiConfig.cacheStaleThreshold;
    },

    initialize: async () => {
        set({ isLoading: true, error: null });

        try {
            const cachedPokemon = await indexedDBStorage.getAllPokemon();
            const lastConsecutiveId = getLastConsecutiveId(cachedPokemon);

            const pokemonMap = new Map<number, Pokemon>();
            cachedPokemon.forEach(pokemon => {
                pokemonMap.set(pokemon.pokeApiId, pokemon);
            });

            set({
                pokemonMap,
                lastConsecutiveId,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to initialize Pokemon store:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to initialize store',
                isLoading: false
            });
        }
    },

    fillCache: async () => {
        set({ isLoading: true });
        const state = get();
        const lastConsecutiveIdStored = state.lastConsecutiveId;

        const pageSize = apiConfig.defaultPageSize;
        const pageToFetch = Math.floor(lastConsecutiveIdStored / pageSize);

        const paginatedResult = await pokemonUseCases.getPaginated(pageToFetch, pageSize);

        const newPokemonMap = new Map(state.pokemonMap);
        paginatedResult.pokemon.forEach(pokemon => {
            newPokemonMap.set(pokemon.pokeApiId, pokemon);
        });

        const newLastConsecutiveId = getLastConsecutiveIdFromMap(newPokemonMap);

        const hasAllPokemonNow = state.totalPokemons !== null && newPokemonMap.size >= state.totalPokemons;

        const allPokemonFetchedAt = hasAllPokemonNow
            ? Date.now()
            : state.allPokemonFetchedAt;

        set({
            pokemonMap: newPokemonMap,
            lastConsecutiveId: newLastConsecutiveId,
            totalPokemons: paginatedResult.totalCount >= (state.totalPokemons ?? 0) ? paginatedResult.totalCount : state.totalPokemons,
            allPokemonFetchedAt,
            isLoading: false
        });

    },

    searchPokemon: async (name: string) => {
        set({ isLoading: true, error: null });

        try {
            const result = await pokemonUseCases.searchPokemon(name);

            const searchResultMap = new Map<number, Pokemon>();
            result.forEach(pokemon => {
                searchResultMap.set(pokemon.pokeApiId, pokemon);
            });

            set({
                pokemonMap: searchResultMap,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Search failed',
                isLoading: false
            });
        }
    },

    setFilters: (filters: PokemonFilters) => {
        set({ filters });
        // Note: Filtering logic can be implemented on the UI side
        // or here if needed for more complex filtering
    },

    clearError: () => {
        set({ error: null });
    }
}));