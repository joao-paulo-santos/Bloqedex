import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalCaughtPokemonStore } from './LocalCaughtPokemonStore';
import type { CaughtPokemon } from '../../../core/types';

// Helper to create proper mock for IndexedDB
const createMockIndexedDB = () => {
    const mockIndex = {
        getAll: vi.fn()
    };

    const mockStore = {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(),
        createIndex: vi.fn(),
        index: vi.fn(() => mockIndex),
        indexNames: {
            contains: vi.fn(() => true)
        }
    };

    const mockTransaction = {
        objectStore: vi.fn(() => mockStore)
    };

    const mockDB = {
        transaction: vi.fn(() => mockTransaction),
        createObjectStore: vi.fn(() => mockStore),
        objectStoreNames: {
            contains: vi.fn(() => false)
        }
    };

    const mockOpenRequest = {
        result: mockDB,
        onsuccess: vi.fn(),
        onerror: vi.fn(),
        onupgradeneeded: vi.fn()
    };

    const mockIndexedDB = {
        open: vi.fn(() => mockOpenRequest)
    };

    Object.defineProperty(globalThis, 'indexedDB', {
        value: mockIndexedDB,
        writable: true,
        configurable: true
    });

    return { mockDB, mockTransaction, mockStore, mockIndex, mockOpenRequest, mockIndexedDB };
};

const createMockCaughtPokemon = (id: number, pokemonId: number, userId: number = 1): CaughtPokemon => ({
    id,
    pokemon: {
        id: pokemonId,
        pokeApiId: pokemonId,
        name: `Pokemon ${pokemonId}`,
        height: 10,
        weight: 100,
        hp: 50,
        attack: 60,
        defense: 70,
        specialAttack: 80,
        specialDefense: 90,
        speed: 100,
        spriteUrl: `https://example.com/pokemon/${pokemonId}.png`,
        officialArtworkUrl: `https://example.com/artwork/${pokemonId}.png`,
        types: ['normal'],
        isCaught: true,
        firstAddedToPokedex: new Date().toISOString()
    },
    userId,
    caughtDate: new Date().toISOString(),
    isFavorite: false
});

describe('LocalCaughtPokemonStore', () => {
    let caughtPokemonStore: LocalCaughtPokemonStore;
    let mocks: ReturnType<typeof createMockIndexedDB>;

    beforeEach(() => {
        mocks = createMockIndexedDB();
        caughtPokemonStore = new LocalCaughtPokemonStore();

        // Setup automatic success for initialization
        setTimeout(() => {
            if (mocks.mockOpenRequest.onsuccess) {
                mocks.mockOpenRequest.onsuccess();
            }
        }, 0);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize the database correctly', async () => {
            const initPromise = caughtPokemonStore.init();

            // Don't trigger onsuccess here since it's already set up in beforeEach

            await expect(initPromise).resolves.not.toThrow();
            expect(mocks.mockIndexedDB.open).toHaveBeenCalledWith('BloqedexDB', 4);
        });

        it('should create caughtPokemon object store on database upgrade', async () => {
            // Create a fresh mock for this test
            const upgradeRequest = {
                result: mocks.mockDB,
                onsuccess: vi.fn(),
                onerror: vi.fn(),
                onupgradeneeded: vi.fn()
            };

            mocks.mockIndexedDB.open.mockReturnValue(upgradeRequest);

            const storeInitPromise = caughtPokemonStore.init();

            // Trigger upgrade event
            const upgradeEvent = { target: { result: mocks.mockDB } };
            if (upgradeRequest.onupgradeneeded) {
                upgradeRequest.onupgradeneeded(upgradeEvent);
            }

            // Then trigger success
            setTimeout(() => {
                if (upgradeRequest.onsuccess) {
                    upgradeRequest.onsuccess();
                }
            }, 0);

            await storeInitPromise;

            expect(mocks.mockDB.createObjectStore).toHaveBeenCalledWith('caughtPokemon', { keyPath: 'id' });
        });
    });

    describe('saveCaughtPokemon', () => {
        it('should save caught pokemon successfully', async () => {
            const caughtPokemon = createMockCaughtPokemon(1, 25, 1);

            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = caughtPokemonStore.saveCaughtPokemon(caughtPokemon);

            // Simulate async success
            setTimeout(() => putRequest.onsuccess(), 0);

            await expect(savePromise).resolves.not.toThrow();
            expect(mocks.mockStore.put).toHaveBeenCalledWith(caughtPokemon);
        });

        it('should handle save errors', async () => {
            const caughtPokemon = createMockCaughtPokemon(1, 25, 1);
            const error = new Error('Save failed');

            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = caughtPokemonStore.saveCaughtPokemon(caughtPokemon);

            // Simulate async error
            setTimeout(() => putRequest.onerror(error), 0);

            await expect(savePromise).rejects.toThrow('Save failed');
        });
    });

    describe('getCaughtPokemon', () => {
        beforeEach(async () => {
            const initPromise = caughtPokemonStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should retrieve caught pokemon for a specific user', async () => {
            const caughtPokemon = [
                createMockCaughtPokemon(1, 25, 1),
                createMockCaughtPokemon(2, 26, 1)
            ];

            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: caughtPokemon };
            mocks.mockIndex.getAll.mockReturnValue(getAllRequest);

            const getPromise = caughtPokemonStore.getCaughtPokemon(1);
            setTimeout(() => getAllRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(caughtPokemon);
            expect(mocks.mockIndex.getAll).toHaveBeenCalledWith(1);
        });

        it('should retrieve all caught pokemon when no userId provided', async () => {
            const caughtPokemon = [
                createMockCaughtPokemon(1, 25, 1),
                createMockCaughtPokemon(2, 26, 2)
            ];

            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: caughtPokemon };
            mocks.mockStore.getAll.mockReturnValue(getAllRequest);

            const getPromise = caughtPokemonStore.getCaughtPokemon();
            setTimeout(() => getAllRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(caughtPokemon);
            expect(mocks.mockStore.getAll).toHaveBeenCalled();
        });

        it('should handle missing userId index gracefully', async () => {
            const caughtPokemon = [createMockCaughtPokemon(1, 25, 1)];

            // Mock index not existing
            mocks.mockStore.indexNames.contains.mockReturnValue(false);

            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: caughtPokemon };
            mocks.mockStore.getAll.mockReturnValue(getAllRequest);

            const getPromise = caughtPokemonStore.getCaughtPokemon(1);
            setTimeout(() => getAllRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(caughtPokemon);
            expect(mocks.mockStore.getAll).toHaveBeenCalled();
        });
    });

    describe('deleteCaughtPokemon', () => {
        beforeEach(async () => {
            const initPromise = caughtPokemonStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should delete caught pokemon successfully', async () => {
            const deleteRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.delete.mockReturnValue(deleteRequest);

            const deletePromise = caughtPokemonStore.deleteCaughtPokemon(1);
            setTimeout(() => deleteRequest.onsuccess(), 0);

            await expect(deletePromise).resolves.not.toThrow();
            expect(mocks.mockStore.delete).toHaveBeenCalledWith(1);
        });

        it('should handle delete errors', async () => {
            const error = new Error('Delete failed');
            const deleteRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.delete.mockReturnValue(deleteRequest);

            const deletePromise = caughtPokemonStore.deleteCaughtPokemon(1);
            setTimeout(() => deleteRequest.onerror(error), 0);

            await expect(deletePromise).rejects.toThrow('Delete failed');
        });
    });

    describe('getFavorites', () => {
        beforeEach(async () => {
            const initPromise = caughtPokemonStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should return only favorite pokemon', async () => {
            const favoritePokemon = createMockCaughtPokemon(1, 25, 1);
            favoritePokemon.isFavorite = true;

            const regularPokemon = createMockCaughtPokemon(2, 26, 1);
            regularPokemon.isFavorite = false;

            const allCaught = [favoritePokemon, regularPokemon];

            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: allCaught };
            mocks.mockIndex.getAll.mockReturnValue(getAllRequest);

            const favoritesPromise = caughtPokemonStore.getFavorites(1);
            setTimeout(() => getAllRequest.onsuccess(), 0);

            const result = await favoritesPromise;
            expect(result).toEqual([favoritePokemon]);
            expect(result).toHaveLength(1);
            expect(result[0].isFavorite).toBe(true);
        });
    });

    describe('getPokedexStats', () => {
        beforeEach(async () => {
            const initPromise = caughtPokemonStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should calculate pokedex statistics correctly', async () => {
            const favoritePokemon = createMockCaughtPokemon(1, 25, 1);
            favoritePokemon.isFavorite = true;

            const regularPokemon = createMockCaughtPokemon(2, 26, 1);
            regularPokemon.isFavorite = false;

            const allCaught = [favoritePokemon, regularPokemon];

            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: allCaught };
            mocks.mockIndex.getAll.mockReturnValue(getAllRequest);

            const statsPromise = caughtPokemonStore.getPokedexStats(1);
            setTimeout(() => getAllRequest.onsuccess(), 0);

            const result = await statsPromise;

            expect(result.totalCaught).toBe(2);
            expect(result.totalFavorites).toBe(1);
            expect(result.totalAvailable).toBe(1010);
            expect(result.completionPercentage).toBeCloseTo((2 / 1010) * 100);
        });
    });

    describe('cleanupDuplicateCaughtPokemon', () => {
        beforeEach(async () => {
            const initPromise = caughtPokemonStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should remove duplicate caught pokemon', async () => {
            // Create duplicates with same pokeApiId but different IDs
            const pokemon1 = createMockCaughtPokemon(1, 25, 1);
            const pokemon2 = createMockCaughtPokemon(2, 25, 1); // Same pokemon, different caught instance

            const allCaught = [pokemon1, pokemon2];

            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: allCaught };
            mocks.mockIndex.getAll.mockReturnValue(getAllRequest);

            const deleteRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.delete.mockReturnValue(deleteRequest);

            const cleanupPromise = caughtPokemonStore.cleanupDuplicateCaughtPokemon(1);

            setTimeout(() => getAllRequest.onsuccess(), 0);
            setTimeout(() => deleteRequest.onsuccess(), 10);

            await cleanupPromise;

            // Should delete the second pokemon (higher ID)
            expect(mocks.mockStore.delete).toHaveBeenCalledWith(2);
            expect(mocks.mockStore.delete).toHaveBeenCalledTimes(1);
        });
    });
});
