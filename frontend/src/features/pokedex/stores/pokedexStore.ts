import { create } from 'zustand';
import { useState, useCallback, useEffect } from 'react';
import type { CaughtPokemon, PokedexStats, CaughtPokemonFilters, User } from '../../../core/types';
import { PokedexService } from '../../../core/Services';
import { pokedexRepository } from '../../../infrastructure/repositories';
import { eventBus, toastEvents } from '../../../common/utils/eventBus';

interface PokedexState {
    isOnline: boolean;
    caughtPokemon: Map<number, CaughtPokemon>;
    favorites: Map<number, CaughtPokemon>;
    stats: PokedexStats | null;
    isLoading: boolean;
    error: string | null;
    currentUserId: number | null;

    fetchCaughtPokemon: () => Promise<void>;
    fetchFavorites: () => Promise<void>;
    fetchStats: () => Promise<void>;
    catchPokemon: (pokeApiId: number, notes?: string) => Promise<void>;
    catchBulkPokemon: (pokeApiIds: number[], notes?: string) => Promise<void>;
    releasePokemon: (pokeApiId: number) => Promise<void>;
    releaseBulkPokemon: (pokeApiIds: number[]) => Promise<void>;
    updateCaughtPokemon: (
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ) => Promise<void>;
    clearError: () => void;
    setUserId: (userId: number | null) => void;
    migrateUser: (oldUser: User, newUser: User) => void;
}

const pokedexService = new PokedexService(pokedexRepository);

export const usePokedexStore = create<PokedexState>((set, get) => ({
    isOnline: false,
    caughtPokemon: new Map<number, CaughtPokemon>(),
    favorites: new Map<number, CaughtPokemon>(),
    stats: null,
    isLoading: false,
    error: null,
    currentUserId: null,

    fetchCaughtPokemon: async () => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId, isOnline } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const result = await pokedexService.getCaughtPokemon(currentUserId, isOnline);
            set({
                caughtPokemon: new Map(result.pokemon.map(p => [p.pokemon.pokeApiId, p])),
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

            const favorites = await pokedexService.getFavorites(currentUserId);
            set({
                favorites: new Map(favorites.map(fav => [fav.pokemon.pokeApiId, fav])),
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
            const { currentUserId, isOnline } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }
            const stats = await pokedexService.getStats(currentUserId, isOnline);
            set({ stats });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    },

    catchPokemon: async (pokemonId: number, notes?: string) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId, isOnline } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const caughtPokemon = await pokedexService.catchPokemon(currentUserId, pokemonId, isOnline, notes);

            if (caughtPokemon) {
                const { caughtPokemon: currentCaught } = get();
                const updatedMap = new Map(currentCaught).set(caughtPokemon.pokemon.pokeApiId, caughtPokemon);
                set({
                    caughtPokemon: updatedMap,
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
            const { currentUserId, isOnline } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const caughtPokemon = await pokedexService.catchBulkPokemon(currentUserId, pokemonIds, isOnline, notes);

            if (caughtPokemon && caughtPokemon.length > 0) {
                const { caughtPokemon: currentCaught } = get();
                const updatedMap = new Map(currentCaught);
                caughtPokemon.forEach(p => updatedMap.set(p.pokemon.pokeApiId, p));
                set({
                    caughtPokemon: updatedMap,
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

    releasePokemon: async (pokeApiId: number) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId, isOnline } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const success = await pokedexService.releasePokemon(currentUserId, pokeApiId, isOnline);

            if (success) {
                const { caughtPokemon, favorites } = get();
                const releasedPokemon = caughtPokemon.get(pokeApiId);
                const updatedCaught = new Map(caughtPokemon);
                updatedCaught.delete(pokeApiId);
                const updatedFavorites = new Map(favorites);
                updatedFavorites.delete(pokeApiId);

                set({
                    caughtPokemon: updatedCaught,
                    favorites: updatedFavorites,
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

    releaseBulkPokemon: async (pokeApiIds: number[]) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId, isOnline } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            await pokedexService.releaseBulkPokemon(currentUserId, pokeApiIds, isOnline);

            if (pokeApiIds) {
                const { caughtPokemon, favorites } = get();
                const updatedCaught = new Map(caughtPokemon);
                const updatedFavorites = new Map(favorites);

                pokeApiIds.forEach(id => {
                    updatedCaught.delete(id);
                    updatedFavorites.delete(id);
                });

                set({
                    caughtPokemon: updatedCaught,
                    favorites: updatedFavorites,
                    isLoading: false
                });


                // Emit event to update Pokemon caught status for bulk released
                eventBus.emit('pokemon:bulk-released', {
                    pokeApiIds: pokeApiIds
                });


                get().fetchStats();
            }

            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to release Pokemon',
                isLoading: false
            });
        }
    },

    updateCaughtPokemon: async (
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ) => {
        set({ isLoading: true, error: null });

        try {
            const { currentUserId, isOnline } = get();
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const updatedPokemon = await pokedexService.updateCaughtPokemon(currentUserId, pokeApiId, updates, isOnline);

            if (updatedPokemon) {
                const { caughtPokemon, favorites } = get();

                const updatedCaught = new Map(caughtPokemon);
                const updatedFavorites = new Map(favorites);

                if (updates.isFavorite) {
                    updatedFavorites.set(pokeApiId, updatedPokemon);
                } else if (updates.isFavorite === false) {
                    updatedFavorites.delete(pokeApiId);
                }
                updatedCaught.set(pokeApiId, updatedPokemon);

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

    setUserId: (userId: number | null) => {
        set({ currentUserId: userId });

        // Automatically fetch caught Pokemon when userId is set
        if (userId) {
            get().fetchCaughtPokemon();
            get().fetchStats();
        }
    },

    migrateUser: async (oldUser: User, newUser: User) => {
        try {
            await pokedexService.migrateUserData(oldUser.id, newUser.id);
        } catch (error) {
            console.error('Failed to migrate Pokemon data:', error);
            toastEvents.showWarning('Account converted successfully, but some Pokemon data may not have been migrated.');
        }
    }
}));

// Set up event listeners for cross-feature communication
eventBus.on('auth:login', (data) => {
    usePokedexStore.getState().setUserId(data.userId);
});

eventBus.on('auth:offlineToOnlineConversion', (data) => {
    usePokedexStore.getState().migrateUser(data.oldUser, data.newUser);
});

eventBus.on('auth:logout', async (data) => {
    const state = usePokedexStore.getState();
    state.setUserId(null);

    if (data.isOfflineAccount) {
        // Clear user data for offline accounts
        try {
            if (data.userId) {
                await pokedexService.clearUserData(data.userId, state.isOnline);
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
    } = usePokedexStore();

    const [filteredPokemon, setFilteredPokemon] = useState<CaughtPokemon[]>([]);
    const [currentFilters, setCurrentFilters] = useState<CaughtPokemonFilters>({
        sortBy: 'pokeApiId',
        sortOrder: 'asc'
    });

    const applyFilters = useCallback((filters: CaughtPokemonFilters) => {
        setCurrentFilters(filters);

        let filtered = Array.from(caughtPokemon.values());

        if (filters.name) {
            const searchLower = filters.name.toLowerCase();
            filtered = filtered.filter(p =>
                p.pokemon.name.toLowerCase().includes(searchLower) ||
                p.pokemon.pokeApiId.toString().includes(searchLower)
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

    const toggleFavorite = useCallback(async (pokeApiId: number) => {
        const pokemon = caughtPokemon.get(pokeApiId);
        if (pokemon) {
            await updateCaughtPokemon(pokeApiId, {
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
    };
};
