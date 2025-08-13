import { create } from 'zustand';
import { useState, useCallback, useEffect } from 'react';
import type { CaughtPokemon, PokedexStats, CaughtPokemonFilters } from '../../../core/types';
import { PokedexUseCases } from '../../../core/usecases';
import { pokedexRepository } from '../../../infrastructure/repositories';
import { eventBus } from '../../../common/utils/eventBus';

interface PokedexState {
    caughtPokemon: CaughtPokemon[];
    favorites: CaughtPokemon[];
    stats: PokedexStats | null;
    isLoading: boolean;
    error: string | null;
    currentUserId: number | null;

    fetchCaughtPokemon: () => Promise<void>;
    fetchFavorites: () => Promise<void>;
    fetchStats: () => Promise<void>;
    catchPokemon: (pokemonId: number, notes?: string) => Promise<void>;
    catchBulkPokemon: (pokemonIds: number[], notes?: string) => Promise<void>;
    releasePokemon: (caughtPokemonId: number) => Promise<void>;
    releaseBulkPokemon: (caughtPokemonIds: number[]) => Promise<void>;
    updateCaughtPokemon: (
        caughtPokemonId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ) => Promise<void>;
    clearError: () => void;
    cleanupDuplicates: () => Promise<void>;
    setUserId: (userId: number | null) => void;
}

const pokedexUseCases = new PokedexUseCases(pokedexRepository);

export const usePokedexStore = create<PokedexState>((set, get) => ({
    caughtPokemon: [],
    favorites: [],
    stats: null,
    isLoading: false,
    error: null,
    currentUserId: null,

    fetchCaughtPokemon: async () => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const result = await pokedexUseCases.getCaughtPokemon(currentUserId);
            set({
                caughtPokemon: result.pokemon,
                isLoading: false
            });

            // Emit event to update Pokemon caught status
            eventBus.emit('pokemon:refresh-caught-status', {
                caughtPokemon: result.pokemon
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
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const favorites = await pokedexUseCases.getFavorites(currentUserId);
            set({
                favorites,
                isLoading: false
            });

            // Emit event to update Pokemon caught status for favorites
            eventBus.emit('pokemon:bulk-caught', {
                pokeApiIds: favorites.map(fav => fav.pokemon.pokeApiId)
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
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const stats = await pokedexUseCases.getStats(currentUserId);
            set({ stats });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    },

    catchPokemon: async (pokemonId: number, notes?: string) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const caughtPokemon = await pokedexUseCases.catchPokemon(currentUserId, pokemonId, notes);

            if (caughtPokemon) {
                const { caughtPokemon: currentCaught } = get();
                set({
                    caughtPokemon: [...currentCaught, caughtPokemon],
                    isLoading: false
                });

                // Emit event to update Pokemon caught status
                eventBus.emit('pokemon:caught', {
                    pokeApiId: caughtPokemon.pokemon.pokeApiId
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

    catchBulkPokemon: async (pokemonIds: number[], notes?: string) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const caughtPokemon = await pokedexUseCases.catchBulkPokemon(currentUserId, pokemonIds, notes);

            if (caughtPokemon && caughtPokemon.length > 0) {
                const { caughtPokemon: currentCaught } = get();
                set({
                    caughtPokemon: [...currentCaught, ...caughtPokemon],
                    isLoading: false
                });

                // Emit event to update Pokemon caught status for bulk caught
                eventBus.emit('pokemon:bulk-caught', {
                    pokeApiIds: caughtPokemon.map(caught => caught.pokemon.pokeApiId)
                });

                get().fetchStats();
            } else {
                set({
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
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const success = await pokedexUseCases.releasePokemon(currentUserId, caughtPokemonId);

            if (success) {
                const { caughtPokemon, favorites } = get();
                const releasedPokemon = caughtPokemon.find(p => p.id === caughtPokemonId);

                set({
                    caughtPokemon: caughtPokemon.filter(p => p.id !== caughtPokemonId),
                    favorites: favorites.filter(p => p.id !== caughtPokemonId),
                    isLoading: false
                });

                if (releasedPokemon) {
                    // Emit event to update Pokemon caught status
                    eventBus.emit('pokemon:released', {
                        pokeApiId: releasedPokemon.pokemon.pokeApiId
                    });
                }

                get().fetchStats();
            } else {
                console.warn('Store: Pokemon release failed');
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

    releaseBulkPokemon: async (caughtPokemonIds: number[]) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const successfulIds = await pokedexUseCases.releaseBulkPokemon(currentUserId, caughtPokemonIds);

            if (successfulIds.length > 0) {
                const { caughtPokemon, favorites } = get();
                const releasedPokemon = caughtPokemon.filter(p => successfulIds.includes(p.id));

                set({
                    caughtPokemon: caughtPokemon.filter(p => !successfulIds.includes(p.id)),
                    favorites: favorites.filter(p => !successfulIds.includes(p.id)),
                    isLoading: false
                });

                if (releasedPokemon.length > 0) {
                    // Emit event to update Pokemon caught status for bulk released
                    eventBus.emit('pokemon:bulk-released', {
                        pokeApiIds: releasedPokemon.map(released => released.pokemon.pokeApiId)
                    });
                }

                get().fetchStats();
            }

            if (successfulIds.length < caughtPokemonIds.length) {
                const failedCount = caughtPokemonIds.length - successfulIds.length;
                set({
                    error: `Failed to release ${failedCount} Pokemon`,
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
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
        updates: { notes?: string; isFavorite?: boolean }
    ) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const updatedPokemon = await pokedexUseCases.updateCaughtPokemon(currentUserId, caughtPokemonId, updates);

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
    },

    cleanupDuplicates: async () => {
        try {
            const { indexedDBStorage } = await import('../../../infrastructure/storage/IndexedDBStorage');

            const { currentUserId } = get();
            if (!currentUserId) {
                console.warn('No user ID available for cleanup - user not logged in');
                return;
            }

            await indexedDBStorage.cleanupDuplicateCaughtPokemon(currentUserId);

            const { fetchCaughtPokemon } = get();
            await fetchCaughtPokemon();

        } catch (error) {
            console.error('Failed to cleanup duplicates:', error);
            set({ error: 'Failed to cleanup duplicates' });
        }
    },

    setUserId: (userId: number | null) => {
        set({ currentUserId: userId });

        // Automatically fetch caught Pokemon when userId is set
        if (userId) {
            get().fetchCaughtPokemon();
            get().fetchStats();
        }
    }
}));

// Set up event listeners for cross-feature communication
eventBus.on('auth:login', (data) => {
    usePokedexStore.getState().setUserId(data.userId);
});

eventBus.on('auth:logout', async (data) => {
    usePokedexStore.getState().setUserId(null);

    if (data.isOfflineAccount) {
        // Clear user data for offline accounts
        try {
            if (data.userId) {
                await pokedexUseCases.clearUserData(data.userId);
            } else {
                console.warn('No user ID provided for logout data clearing - skipping');
            }
        } catch (error) {
            console.error('Failed to clear pokedex data on logout:', error);
        }
    }
});

export const useCaughtPokemon = () => {
    const {
        caughtPokemon,
        stats,
        isLoading,
        error,
        fetchCaughtPokemon,
        fetchStats,
        updateCaughtPokemon,
        releasePokemon,
        releaseBulkPokemon,
        clearError,
        cleanupDuplicates
    } = usePokedexStore();

    const [filteredPokemon, setFilteredPokemon] = useState<CaughtPokemon[]>([]);
    const [currentFilters, setCurrentFilters] = useState<CaughtPokemonFilters>({
        sortBy: 'pokeApiId',
        sortOrder: 'asc'
    });

    const applyFilters = useCallback((filters: CaughtPokemonFilters) => {
        setCurrentFilters(filters);

        let filtered = [...caughtPokemon];

        if (filters.name) {
            const searchLower = filters.name.toLowerCase();
            filtered = filtered.filter(p =>
                p.pokemon.name.toLowerCase().includes(searchLower) ||
                p.pokemon.id.toString().includes(searchLower)
            );
        }

        if (filters.types && filters.types.length > 0) {
            filtered = filtered.filter(p =>
                filters.types!.some(type => p.pokemon.types.includes(type))
            );
        }

        if (filters.favoritesOnly) {
            filtered = filtered.filter(p => p.isFavorite);
        }

        if (filters.caughtDateFrom) {
            const fromDate = new Date(filters.caughtDateFrom);
            filtered = filtered.filter(p => new Date(p.caughtDate) >= fromDate);
        }

        if (filters.caughtDateTo) {
            const toDate = new Date(filters.caughtDateTo);
            toDate.setDate(toDate.getDate() + 1);
            filtered = filtered.filter(p => new Date(p.caughtDate) < toDate);
        }

        filtered.sort((a, b) => {
            let aVal: string | number | Date;
            let bVal: string | number | Date;

            switch (filters.sortBy) {
                case 'name':
                    aVal = a.pokemon.name;
                    bVal = b.pokemon.name;
                    break;
                case 'pokeApiId':
                    aVal = a.pokemon.pokeApiId;
                    bVal = b.pokemon.pokeApiId;
                    break;
                case 'height':
                    aVal = a.pokemon.height;
                    bVal = b.pokemon.height;
                    break;
                case 'weight':
                    aVal = a.pokemon.weight;
                    bVal = b.pokemon.weight;
                    break;
                case 'hp':
                    aVal = a.pokemon.hp;
                    bVal = b.pokemon.hp;
                    break;
                case 'attack':
                    aVal = a.pokemon.attack;
                    bVal = b.pokemon.attack;
                    break;
                case 'defense':
                    aVal = a.pokemon.defense;
                    bVal = b.pokemon.defense;
                    break;
                case 'specialAttack':
                    aVal = a.pokemon.specialAttack;
                    bVal = b.pokemon.specialAttack;
                    break;
                case 'specialDefense':
                    aVal = a.pokemon.specialDefense;
                    bVal = b.pokemon.specialDefense;
                    break;
                case 'speed':
                    aVal = a.pokemon.speed;
                    bVal = b.pokemon.speed;
                    break;
                case 'totalStats':
                    aVal = a.pokemon.hp + a.pokemon.attack + a.pokemon.defense +
                        a.pokemon.specialAttack + a.pokemon.specialDefense + a.pokemon.speed;
                    bVal = b.pokemon.hp + b.pokemon.attack + b.pokemon.defense +
                        b.pokemon.specialAttack + b.pokemon.specialDefense + b.pokemon.speed;
                    break;
                case 'caughtDate':
                default:
                    aVal = new Date(a.caughtDate);
                    bVal = new Date(b.caughtDate);
                    break;
            }

            if (typeof aVal === 'string') {
                const aStr = aVal.toLowerCase();
                const bStr = (bVal as string).toLowerCase();
                if (filters.sortOrder === 'asc') {
                    return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                } else {
                    return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
                }
            } else if (typeof aVal === 'number') {
                if (filters.sortOrder === 'asc') {
                    return aVal - (bVal as number);
                } else {
                    return (bVal as number) - aVal;
                }
            } else {
                const aTime = (aVal as Date).getTime();
                const bTime = (bVal as Date).getTime();
                if (filters.sortOrder === 'asc') {
                    return aTime - bTime;
                } else {
                    return bTime - aTime;
                }
            }
        });

        setFilteredPokemon(filtered);
    }, [caughtPokemon]);

    useEffect(() => {
        applyFilters(currentFilters);
    }, [caughtPokemon, applyFilters, currentFilters]);

    const toggleFavorite = useCallback(async (caughtPokemonId: number) => {
        const pokemon = caughtPokemon.find(p => p.id === caughtPokemonId);
        if (pokemon) {
            await updateCaughtPokemon(caughtPokemonId, {
                isFavorite: !pokemon.isFavorite
            });
        }
    }, [caughtPokemon, updateCaughtPokemon]);

    const loadCaughtPokemon = useCallback(async () => {
        await fetchCaughtPokemon();
        await fetchStats();
    }, [fetchCaughtPokemon, fetchStats]);

    return {
        caughtPokemon,
        filteredPokemon,
        stats,
        isLoading,
        error,
        loadCaughtPokemon,
        toggleFavorite,
        releasePokemon,
        releaseBulkPokemon,
        updateCaughtPokemon,
        applyFilters,
        clearError,
        cleanupDuplicates
    };
};
