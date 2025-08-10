import { create } from 'zustand';
import type { Pokemon } from '../../../core/entities';
import type { PokemonFilters } from '../../../core/interfaces';
import { PokemonUseCases } from '../../../core/usecases';
import { pokemonRepository } from '../../../infrastructure/repositories';

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

    fetchPokemon: () => Promise<void>;
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
        const { filters, pagination } = get();
        set({ isLoading: true, error: null });

        try {
            const result = await pokemonUseCases.getAllPokemon(
                filters,
                pagination.currentPage,
                pagination.pageSize
            );

            set({
                pokemon: result.items,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    pageSize: result.pageSize,
                    totalCount: result.totalCount
                },
                isLoading: false
            });
        } catch (error) {
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
