import { create } from 'zustand';
import type { Pokemon, PokemonFilters } from '../../../core/types';
import { PokemonUseCases } from '../../../core/Services';
import { pokemonRepository } from '../../../infrastructure/repositories';
import { indexedDBStorage } from '../../../infrastructure/storage/IndexedDBStorage';
import { getCurrentUserId } from '../../../common/utils/userContext';
import { getLastConsecutiveId, getLastConsecutiveIdFromMap } from '../../../common/utils/pokemonHelpers';
import { apiConfig } from '../../../config/api';
import { eventBus } from '../../../common/utils/eventBus';

interface PokemonState {
    pokemonMap: Map<number, Pokemon>;
    lastConsecutiveId: number;
    totalPokemons: number | null;
    allPokemonFetchedAt: number | null;
    isLoading: boolean;
    error: string | null;
    filters: PokemonFilters;

    getPokemonArray: () => Pokemon[];
    getFilteredPokemon: (customFilters?: Partial<PokemonFilters>) => Pokemon[];
    getPokemonByPokeApiId: (pokeApiId: number) => Pokemon | undefined;
    hasAllPokemon: () => boolean;
    isCacheStale: () => boolean;

    initialize: () => Promise<void>;
    fillCache: () => Promise<void>;
    searchPokemon: (name: string) => Promise<void>;
    setFilters: (filters: PokemonFilters) => void;
    updatePokemonCaughtStatus: (pokeApiId: number, isCaught: boolean) => void;
    refreshCaughtStatus: () => Promise<void>;
    clearAllCaughtStatus: () => void;
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

    getFilteredPokemon: (customFilters?: Partial<PokemonFilters>) => {
        const state = get();
        const filters = { ...state.filters, ...customFilters };
        let pokemon = Array.from(state.pokemonMap.values());

        pokemon = pokemon.filter(p => {
            if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }
            if (filters.nameExact && p.name.toLowerCase() !== filters.nameExact.toLowerCase()) {
                return false;
            }

            if (filters.pokeApiId && p.pokeApiId !== filters.pokeApiId) {
                return false;
            }

            if (filters.types && filters.types.length > 0) {
                const hasAnyType = filters.types.some(type =>
                    p.types.some(pType => pType.toLowerCase() === type.toLowerCase())
                );
                if (!hasAnyType) return false;
            }
            if (filters.typesAll && filters.typesAll.length > 0) {
                const hasAllTypes = filters.typesAll.every(type =>
                    p.types.some(pType => pType.toLowerCase() === type.toLowerCase())
                );
                if (!hasAllTypes) return false;
            }
            if (filters.excludeTypes && filters.excludeTypes.length > 0) {
                const hasExcludedType = filters.excludeTypes.some(type =>
                    p.types.some(pType => pType.toLowerCase() === type.toLowerCase())
                );
                if (hasExcludedType) return false;
            }

            if (filters.minSpecialAttack !== undefined && (p.specialAttack || 0) < filters.minSpecialAttack) return false;
            if (filters.maxSpecialAttack !== undefined && (p.specialAttack || 0) > filters.maxSpecialAttack) return false;
            if (filters.minSpecialDefense !== undefined && (p.specialDefense || 0) < filters.minSpecialDefense) return false;
            if (filters.maxSpecialDefense !== undefined && (p.specialDefense || 0) > filters.maxSpecialDefense) return false;
            if (filters.minSpeed !== undefined && (p.speed || 0) < filters.minSpeed) return false;
            if (filters.maxSpeed !== undefined && (p.speed || 0) > filters.maxSpeed) return false;

            const totalStats = (p.hp || 0) + (p.attack || 0) + (p.defense || 0) +
                (p.specialAttack || 0) + (p.specialDefense || 0) + (p.speed || 0);
            if (filters.minTotalStats !== undefined && totalStats < filters.minTotalStats) return false;
            if (filters.maxTotalStats !== undefined && totalStats > filters.maxTotalStats) return false;

            // User interaction filters
            if (filters.caughtOnly && !p.isCaught) return false;
            if (filters.uncaughtOnly && p.isCaught) return false;

            return true;
        });

        // Apply sorting
        const sortBy = filters.sortBy || 'pokeApiId';
        const sortOrder = filters.sortOrder || 'asc';

        pokemon.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'height':
                    aValue = a.height;
                    bValue = b.height;
                    break;
                case 'weight':
                    aValue = a.weight;
                    bValue = b.weight;
                    break;
                case 'hp':
                    aValue = a.hp || 0;
                    bValue = b.hp || 0;
                    break;
                case 'attack':
                    aValue = a.attack || 0;
                    bValue = b.attack || 0;
                    break;
                case 'defense':
                    aValue = a.defense || 0;
                    bValue = b.defense || 0;
                    break;
                case 'specialAttack':
                    aValue = a.specialAttack || 0;
                    bValue = b.specialAttack || 0;
                    break;
                case 'specialDefense':
                    aValue = a.specialDefense || 0;
                    bValue = b.specialDefense || 0;
                    break;
                case 'speed':
                    aValue = a.speed || 0;
                    bValue = b.speed || 0;
                    break;
                case 'totalStats':
                    aValue = (a.hp || 0) + (a.attack || 0) + (a.defense || 0) +
                        (a.specialAttack || 0) + (a.specialDefense || 0) + (a.speed || 0);
                    bValue = (b.hp || 0) + (b.attack || 0) + (b.defense || 0) +
                        (b.specialAttack || 0) + (b.specialDefense || 0) + (b.speed || 0);
                    break;
                case 'firstAddedToPokedex':
                    aValue = a.firstAddedToPokedex || '';
                    bValue = b.firstAddedToPokedex || '';
                    break;
                case 'pokeApiId':
                default:
                    aValue = a.pokeApiId;
                    bValue = b.pokeApiId;
                    break;
            }

            if (aValue < bValue) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return pokemon;
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
                isLoading: false,
                totalPokemons: cachedPokemon.length,
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
        paginatedResult.pokemon.forEach((pokemon: Pokemon) => {
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

    updatePokemonCaughtStatus: (pokeApiId: number, isCaught: boolean) => {
        const { pokemonMap } = get();
        const pokemon = pokemonMap.get(pokeApiId);

        if (pokemon) {
            const updatedPokemon = { ...pokemon, isCaught };
            const newMap = new Map(pokemonMap);
            newMap.set(pokeApiId, updatedPokemon);

            set({ pokemonMap: newMap });

            indexedDBStorage.savePokemon(updatedPokemon).catch(error => {
                console.error('Failed to update Pokemon caught status in IndexedDB:', error);
            });
        }
    },

    refreshCaughtStatus: async () => {
        try {
            const currentUserId = getCurrentUserId();
            if (!currentUserId) {
                return;
            }

            const caughtPokemon = await indexedDBStorage.getCaughtPokemon(currentUserId);

            const caughtPokemonIds = new Set(caughtPokemon.map(cp => cp.pokemon.pokeApiId));

            const { pokemonMap } = get();
            const updatedMap = new Map(pokemonMap);
            let hasChanges = false;

            for (const [pokeApiId, pokemon] of pokemonMap) {
                const shouldBeCaught = caughtPokemonIds.has(pokeApiId);
                if (pokemon.isCaught !== shouldBeCaught) {
                    const updatedPokemon = { ...pokemon, isCaught: shouldBeCaught };
                    updatedMap.set(pokeApiId, updatedPokemon);
                    hasChanges = true;

                    await indexedDBStorage.savePokemon(updatedPokemon);
                }
            }

            if (hasChanges) {
                set({ pokemonMap: updatedMap });
            }
        } catch (error) {
            console.error('Failed to refresh caught status:', error);
        }
    },

    clearAllCaughtStatus: () => {
        const { pokemonMap } = get();
        const newMap = new Map<number, Pokemon>();

        pokemonMap.forEach((pokemon, key) => {
            newMap.set(key, { ...pokemon, isCaught: false });
        });

        set({ pokemonMap: newMap });

        newMap.forEach(pokemon => {
            indexedDBStorage.savePokemon(pokemon).catch(error => {
                console.error('Failed to clear Pokemon caught status in IndexedDB:', error);
            });
        });
    },

    clearError: () => {
        set({ error: null });
    }
}));

// Listen for auth events
eventBus.on('auth:logout', () => {
    usePokemonStore.getState().clearAllCaughtStatus();
});

// Listen for pokedex events to update caught status
eventBus.on('pokemon:caught', (data: { pokeApiId: number }) => {
    usePokemonStore.getState().updatePokemonCaughtStatus(data.pokeApiId, true);
});

eventBus.on('pokemon:released', (data: { pokeApiId: number }) => {
    usePokemonStore.getState().updatePokemonCaughtStatus(data.pokeApiId, false);
});

eventBus.on('pokemon:bulk-caught', (data: { pokeApiIds: number[] }) => {
    const pokemonStore = usePokemonStore.getState();
    data.pokeApiIds.forEach(pokeApiId => {
        pokemonStore.updatePokemonCaughtStatus(pokeApiId, true);
    });
});

eventBus.on('pokemon:bulk-released', (data: { pokeApiIds: number[] }) => {
    const pokemonStore = usePokemonStore.getState();
    data.pokeApiIds.forEach(pokeApiId => {
        pokemonStore.updatePokemonCaughtStatus(pokeApiId, false);
    });
});

eventBus.on('pokemon:refresh-caught-status', (data: { caughtPokemon: Array<{ pokemon: { pokeApiId: number } }> }) => {
    const pokemonStore = usePokemonStore.getState();
    // First clear all caught status
    pokemonStore.clearAllCaughtStatus();
    // Then set caught status for all provided pokemon
    data.caughtPokemon.forEach(caught => {
        pokemonStore.updatePokemonCaughtStatus(caught.pokemon.pokeApiId, true);
    });
});