import { create } from 'zustand';
import type { CaughtPokemon, PokedexStats } from '../../../core/entities';
import { PokedexUseCases } from '../../../core/usecases';
import { pokedexRepository } from '../../../infrastructure/repositories';

interface PokedexState {
    caughtPokemon: CaughtPokemon[];
    favorites: CaughtPokemon[];
    stats: PokedexStats | null;
    isLoading: boolean;
    error: string | null;

    fetchCaughtPokemon: () => Promise<void>;
    fetchFavorites: () => Promise<void>;
    fetchStats: () => Promise<void>;
    catchPokemon: (pokemonId: number, notes?: string) => Promise<void>;
    releasePokemon: (caughtPokemonId: number) => Promise<void>;
    updateCaughtPokemon: (
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean; nickname?: string }
    ) => Promise<void>;
    clearError: () => void;
}

const pokedexUseCases = new PokedexUseCases(pokedexRepository);

export const usePokedexStore = create<PokedexState>((set, get) => ({
    caughtPokemon: [],
    favorites: [],
    stats: null,
    isLoading: false,
    error: null,

    fetchCaughtPokemon: async () => {
        set({ isLoading: true, error: null });

        try {
            const result = await pokedexUseCases.getCaughtPokemon();
            set({
                caughtPokemon: result.items,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch caught Pokemon',
                isLoading: false
            });
        }
    },

    fetchFavorites: async () => {
        set({ isLoading: true, error: null });

        try {
            const favorites = await pokedexUseCases.getFavorites();
            set({
                favorites,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch favorites',
                isLoading: false
            });
        }
    },

    fetchStats: async () => {
        try {
            const stats = await pokedexUseCases.getStats();
            set({ stats });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    },

    catchPokemon: async (pokemonId: number, notes?: string) => {
        set({ isLoading: true, error: null });

        try {
            const caughtPokemon = await pokedexUseCases.catchPokemon(pokemonId, notes);

            if (caughtPokemon) {
                const { caughtPokemon: currentCaught } = get();
                set({
                    caughtPokemon: [...currentCaught, caughtPokemon],
                    isLoading: false
                });

                get().fetchStats();
            } else {
                set({
                    error: 'Failed to catch Pokemon',
                    isLoading: false
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to catch Pokemon',
                isLoading: false
            });
        }
    },

    releasePokemon: async (caughtPokemonId: number) => {
        set({ isLoading: true, error: null });

        try {
            const success = await pokedexUseCases.releasePokemon(caughtPokemonId);

            if (success) {
                const { caughtPokemon, favorites } = get();
                set({
                    caughtPokemon: caughtPokemon.filter(p => p.id !== caughtPokemonId),
                    favorites: favorites.filter(p => p.id !== caughtPokemonId),
                    isLoading: false
                });

                get().fetchStats();
            } else {
                set({
                    error: 'Failed to release Pokemon',
                    isLoading: false
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to release Pokemon',
                isLoading: false
            });
        }
    },

    updateCaughtPokemon: async (
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean; nickname?: string }
    ) => {
        set({ isLoading: true, error: null });

        try {
            const updatedPokemon = await pokedexUseCases.updateCaughtPokemon(caughtPokemonId, updates);

            if (updatedPokemon) {
                const { caughtPokemon, favorites } = get();

                const updatedCaught = caughtPokemon.map(p =>
                    p.id === caughtPokemonId ? updatedPokemon : p
                );

                let updatedFavorites = favorites;
                if (updates.isFavorite === true && !favorites.find(p => p.id === caughtPokemonId)) {
                    updatedFavorites = [...favorites, updatedPokemon];
                } else if (updates.isFavorite === false) {
                    updatedFavorites = favorites.filter(p => p.id !== caughtPokemonId);
                } else if (updates.isFavorite === true) {
                    updatedFavorites = favorites.map(p =>
                        p.id === caughtPokemonId ? updatedPokemon : p
                    );
                }

                set({
                    caughtPokemon: updatedCaught,
                    favorites: updatedFavorites,
                    isLoading: false
                });
            } else {
                set({
                    error: 'Failed to update Pokemon',
                    isLoading: false
                });
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update Pokemon',
                isLoading: false
            });
        }
    },

    clearError: () => {
        set({ error: null });
    }
}));
