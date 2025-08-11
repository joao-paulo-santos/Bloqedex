import { create } from 'zustand';
import type { Pokemon } from '../../../core/entities';
import type { PokemonFilters } from '../../../core/interfaces';
import { PokemonUseCases } from '../../../core/usecases';
import { pokemonRepository } from '../../../infrastructure/repositories';

// Actual API response format
interface ApiPokemonResponse {
    pokemon: Pokemon[];
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
}

interface PokemonState {
    pokemon: Pokemon[];
    isLoading: boolean;
    error: string | null;
    filters: PokemonFilters;
    pagination: {
        currentPage: number;
        totalPages: number;
        pageSize: number;
        totalCount: number;
    };

    fetchPokemon: (fetchAll?: boolean) => Promise<void>;
    searchPokemon: (name: string) => Promise<void>;
    setFilters: (filters: PokemonFilters) => void;
    setPage: (page: number) => void;
    clearError: () => void;
}

const pokemonUseCases = new PokemonUseCases(pokemonRepository);

export const usePokemonStore = create<PokemonState>((set, get) => ({
    pokemon: [],
    isLoading: false,
    error: null,
    filters: {
        sortBy: 'pokeApiId',
        sortOrder: 'asc'
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        pageSize: 20,
        totalCount: 0
    },

    fetchPokemon: async () => {
        const state = get();


        const { filters, pagination } = state;
        set({ isLoading: true, error: null });

        try {
            const result = await pokemonUseCases.getAllPokemon(
                filters,
                pagination.currentPage,
                pagination.pageSize
            );

            console.log('Pokemon fetched:', result);

            // Handle the actual API response format - convert via unknown to avoid type error
            const apiResponse = result as unknown as ApiPokemonResponse;
            const pokemonArray = apiResponse.pokemon;
            const currentPage = apiResponse.pageIndex + 1; // Convert 0-based to 1-based
            const totalPages = Math.ceil(apiResponse.totalCount / apiResponse.pageSize);

            console.log('Pokemon array:', pokemonArray);
            console.log('Current page:', currentPage, 'Total pages:', totalPages);

            set({
                pokemon: pokemonArray,
                pagination: {
                    currentPage,
                    totalPages,
                    pageSize: apiResponse.pageSize,
                    totalCount: apiResponse.totalCount
                },
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching Pokemon:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch Pokemon',
                isLoading: false
            });
        }
    },

    searchPokemon: async (name: string) => {
        set({ isLoading: true, error: null });

        try {
            const result = await pokemonUseCases.searchPokemon(name);

            set({
                pokemon: result,
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
        set({
            filters,
            pagination: { ...get().pagination, currentPage: 1 } // Reset to first page
        });
    },

    setPage: (page: number) => {
        set({
            pagination: { ...get().pagination, currentPage: page }
        });
    },

    clearError: () => {
        set({ error: null });
    }
}));
