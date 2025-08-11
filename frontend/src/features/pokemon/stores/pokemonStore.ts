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
    getFilteredPokemon: (customFilters?: Partial<PokemonFilters>) => Pokemon[];
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

            if (filters.minBaseExperience !== undefined && (p.baseExperience || 0) < filters.minBaseExperience) return false;
            if (filters.maxBaseExperience !== undefined && (p.baseExperience || 0) > filters.maxBaseExperience) return false;

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
                case 'baseExperience':
                    aValue = a.baseExperience || 0;
                    bValue = b.baseExperience || 0;
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
                case 'caughtAt':
                    aValue = a.caughtAt || '';
                    bValue = b.caughtAt || '';
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