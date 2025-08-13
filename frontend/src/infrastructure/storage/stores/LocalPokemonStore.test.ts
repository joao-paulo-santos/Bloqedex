import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalPokemonStore } from './LocalPokemonStore';
import type { Pokemon } from '../../../core/types';

// Mock the pokemonHelpers module
vi.mock('../../../common/utils/pokemonHelpers', () => ({
    getLastConsecutiveIdFromIds: vi.fn((ids: Set<number>) => {
        const sortedIds = Array.from(ids).sort((a, b) => a - b);
        let lastConsecutive = 0;
        for (const id of sortedIds) {
            if (id === lastConsecutive + 1) {
                lastConsecutive = id;
            } else {
                break;
            }
        }
        return lastConsecutive;
    })
}));

// Mock IDBKeyRange
const mockIDBKeyRange = {
    only: vi.fn((value) => ({ only: value })),
    bound: vi.fn((lower, upper, lowerOpen = false, upperOpen = false) => ({
        lower, upper, lowerOpen, upperOpen
    })),
    upperBound: vi.fn((upper, open = false) => ({ upper, open })),
    lowerBound: vi.fn((lower, open = false) => ({ lower, open }))
};

Object.defineProperty(globalThis, 'IDBKeyRange', {
    value: mockIDBKeyRange,
    writable: true
});

function createMockPokemon(id: number, pokeApiId: number, name: string): Pokemon {
    return {
        id,
        pokeApiId,
        name,
        height: 10,
        weight: 100,
        hp: 50,
        attack: 55,
        defense: 40,
        specialAttack: 50,
        specialDefense: 50,
        speed: 90,
        spriteUrl: `https://example.com/${name}.png`,
        officialArtworkUrl: `https://example.com/${name}_artwork.png`,
        types: ['normal'],
        isCaught: false,
        firstAddedToPokedex: new Date().toISOString()
    };
}

function createMockIndexedDBStructure() {
    const mockStore = {
        put: vi.fn(),
        get: vi.fn(),
        getAll: vi.fn(),
        getAllKeys: vi.fn(),
        count: vi.fn(),
        openCursor: vi.fn(),
        index: vi.fn(),
        createIndex: vi.fn(),
        indexNames: {
            contains: vi.fn()
        }
    };

    const mockIndex = {
        get: vi.fn(),
        getAll: vi.fn(),
        openCursor: vi.fn()
    };

    const mockTransaction = {
        objectStore: vi.fn().mockReturnValue(mockStore),
        oncomplete: null,
        onerror: null,
        onabort: null
    };

    const mockDatabase = {
        objectStoreNames: {
            contains: vi.fn().mockReturnValue(true)
        },
        createObjectStore: vi.fn().mockReturnValue(mockStore),
        transaction: vi.fn().mockReturnValue(mockTransaction)
    };

    const mockOpenRequest = {
        onsuccess: vi.fn(),
        onerror: vi.fn(),
        onupgradeneeded: vi.fn(),
        result: mockDatabase
    };

    // Setup default behaviors
    mockStore.index.mockReturnValue(mockIndex);

    return {
        mockStore,
        mockIndex,
        mockTransaction,
        mockDatabase,
        mockOpenRequest
    };
}

describe('LocalPokemonStore', () => {
    let pokemonStore: LocalPokemonStore;
    let mocks: ReturnType<typeof createMockIndexedDBStructure>;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Create fresh mocks
        mocks = createMockIndexedDBStructure();

        // Mock indexedDB global
        Object.defineProperty(globalThis, 'indexedDB', {
            value: {
                open: vi.fn().mockReturnValue(mocks.mockOpenRequest)
            },
            writable: true
        });

        pokemonStore = new LocalPokemonStore();
    });

    describe('initialization', () => {
        it('should initialize the database correctly', async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);

            await initPromise;

            expect(indexedDB.open).toHaveBeenCalledWith('BloqedexDB', 4);
        }); it('should create pokemon object store on database upgrade', async () => {
            mocks.mockDatabase.objectStoreNames.contains.mockReturnValue(false);

            const initPromise = pokemonStore.init();

            // Trigger upgrade
            setTimeout(() => {
                mocks.mockOpenRequest.onupgradeneeded({
                    target: { result: mocks.mockDatabase }
                } as unknown as IDBVersionChangeEvent);
                mocks.mockOpenRequest.onsuccess();
            }, 0);

            await initPromise;

            expect(mocks.mockDatabase.createObjectStore).toHaveBeenCalledWith('pokemon', { keyPath: 'id' });
        });
    });

    describe('savePokemon', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should save pokemon successfully', async () => {
            const pokemon = createMockPokemon(1, 25, 'pikachu');
            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = pokemonStore.savePokemon(pokemon);
            setTimeout(() => putRequest.onsuccess(), 0);

            await savePromise;

            expect(mocks.mockStore.put).toHaveBeenCalledWith(pokemon);
        });

        it('should handle save errors', async () => {
            const pokemon = createMockPokemon(1, 25, 'pikachu');
            const error = new Error('Save failed');
            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = pokemonStore.savePokemon(pokemon);
            setTimeout(() => putRequest.onerror(error), 0);

            await expect(savePromise).rejects.toThrow('Save failed');
        });
    });

    describe('getPokemon', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should retrieve pokemon by id', async () => {
            const pokemon = createMockPokemon(1, 25, 'pikachu');
            const getRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: pokemon };
            mocks.mockStore.get.mockReturnValue(getRequest);

            const getPromise = pokemonStore.getPokemon(1);
            setTimeout(() => getRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(pokemon);
            expect(mocks.mockStore.get).toHaveBeenCalledWith(1);
        });

        it('should return null for non-existent pokemon', async () => {
            const getRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: undefined };
            mocks.mockStore.get.mockReturnValue(getRequest);

            const getPromise = pokemonStore.getPokemon(999);
            setTimeout(() => getRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toBeNull();
        });
    });

    describe('getPokemonByPokeApiId', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should retrieve pokemon by pokeApiId', async () => {
            const pokemon = createMockPokemon(1, 25, 'pikachu');
            const getRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: pokemon };
            mocks.mockIndex.get.mockReturnValue(getRequest);

            const getPromise = pokemonStore.getPokemonByPokeApiId(25);
            setTimeout(() => getRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(pokemon);
            expect(mocks.mockStore.index).toHaveBeenCalledWith('pokeApiId');
            expect(mocks.mockIndex.get).toHaveBeenCalledWith(25);
        });
    });

    describe('getAllPokemon', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should retrieve all pokemon', async () => {
            const pokemon = [
                createMockPokemon(1, 25, 'pikachu'),
                createMockPokemon(2, 26, 'raichu')
            ];
            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: pokemon };
            mocks.mockStore.getAll.mockReturnValue(getAllRequest);

            const getPromise = pokemonStore.getAllPokemon();
            setTimeout(() => getAllRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(pokemon);
            expect(mocks.mockStore.getAll).toHaveBeenCalled();
        });
    });

    describe('getPokemonCount', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should return pokemon count', async () => {
            const countRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: 150 };
            mocks.mockStore.count.mockReturnValue(countRequest);

            const countPromise = pokemonStore.getPokemonCount();
            setTimeout(() => countRequest.onsuccess(), 0);

            const result = await countPromise;
            expect(result).toBe(150);
            expect(mocks.mockStore.count).toHaveBeenCalled();
        });
    });

    describe('getAllPokemonIds', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should retrieve all pokemon ids', async () => {
            const keys = [1, 2, 3, 4, 5];
            const getAllKeysRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: keys };
            mocks.mockStore.getAllKeys.mockReturnValue(getAllKeysRequest);

            const getPromise = pokemonStore.getAllPokemonIds();
            setTimeout(() => getAllKeysRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(new Set(keys));
            expect(mocks.mockStore.getAllKeys).toHaveBeenCalled();
        });

        it('should return cached ids on second call', async () => {
            const keys = [1, 2, 3];
            const getAllKeysRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: keys };
            mocks.mockStore.getAllKeys.mockReturnValue(getAllKeysRequest);

            // First call
            const getPromise1 = pokemonStore.getAllPokemonIds();
            setTimeout(() => getAllKeysRequest.onsuccess(), 0);
            const result1 = await getPromise1;

            // Second call should use cache
            const result2 = await pokemonStore.getAllPokemonIds();

            expect(result1).toEqual(result2);
            expect(mocks.mockStore.getAllKeys).toHaveBeenCalledTimes(1); // Only called once
        });
    });

    describe('hasPokemonRange', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should return true when all pokemon in range exist', async () => {
            const keys = [1, 2, 3, 4, 5];
            const getAllKeysRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: keys };
            mocks.mockStore.getAllKeys.mockReturnValue(getAllKeysRequest);

            const hasRangePromise = pokemonStore.hasPokemonRange(1, 3);
            setTimeout(() => getAllKeysRequest.onsuccess(), 0);

            const result = await hasRangePromise;
            expect(result).toBe(true);
        });

        it('should return false when pokemon in range are missing', async () => {
            const keys = [1, 3, 5]; // Missing 2 and 4
            const getAllKeysRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: keys };
            mocks.mockStore.getAllKeys.mockReturnValue(getAllKeysRequest);

            const hasRangePromise = pokemonStore.hasPokemonRange(1, 5);
            setTimeout(() => getAllKeysRequest.onsuccess(), 0);

            const result = await hasRangePromise;
            expect(result).toBe(false);
        });
    });

    describe('getPokemonByIdRange', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should retrieve pokemon by id range', async () => {
            const pokemon1 = createMockPokemon(1, 25, 'pikachu');
            const pokemon2 = createMockPokemon(2, 26, 'raichu');

            // Mock multiple get requests
            mocks.mockStore.get
                .mockReturnValueOnce({ onsuccess: vi.fn(), onerror: vi.fn(), result: pokemon1 })
                .mockReturnValueOnce({ onsuccess: vi.fn(), onerror: vi.fn(), result: pokemon2 })
                .mockReturnValueOnce({ onsuccess: vi.fn(), onerror: vi.fn(), result: undefined });

            const getRangePromise = pokemonStore.getPokemonByIdRange(1, 3);

            // Trigger success for all requests
            setTimeout(() => {
                const calls = mocks.mockStore.get.mock.calls;
                calls.forEach((_, index) => {
                    const request = mocks.mockStore.get.mock.results[index].value;
                    request.onsuccess();
                });
            }, 0);

            const result = await getRangePromise;
            expect(result).toEqual([pokemon1, pokemon2]);
            expect(result).toHaveLength(2);
        });
    });

    describe('getLastConsecutiveId', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should return last consecutive id', async () => {
            const keys = [1, 2, 3, 5, 6]; // 4 is missing, so last consecutive is 3
            const getAllKeysRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: keys };
            mocks.mockStore.getAllKeys.mockReturnValue(getAllKeysRequest);

            const getLastPromise = pokemonStore.getLastConsecutiveId();
            setTimeout(() => getAllKeysRequest.onsuccess(), 0);

            const result = await getLastPromise;
            expect(result).toBe(3);
        });
    });

    describe('saveManyPokemon', () => {
        beforeEach(async () => {
            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;
        });

        it('should save multiple pokemon efficiently', async () => {
            const existingKeys = [1, 2];
            const pokemon = [
                createMockPokemon(1, 25, 'pikachu'), // Already exists
                createMockPokemon(3, 27, 'sandshrew'), // New
                createMockPokemon(4, 28, 'sandslash')  // New
            ];

            // Mock existing keys check
            const getAllKeysRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: existingKeys };
            mocks.mockStore.getAllKeys.mockReturnValue(getAllKeysRequest);

            // Mock put operations - return different requests for each call
            const putRequest1 = { onsuccess: vi.fn(), onerror: vi.fn() };
            const putRequest2 = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put
                .mockReturnValueOnce(putRequest1)
                .mockReturnValueOnce(putRequest2);

            const savePromise = pokemonStore.saveManyPokemon(pokemon);

            // Trigger getAllKeys first
            setTimeout(() => getAllKeysRequest.onsuccess(), 0);

            // Then trigger the put operations
            setTimeout(() => {
                putRequest1.onsuccess();
                putRequest2.onsuccess();
            }, 10);

            await savePromise;

            // Should only save the 2 new pokemon (ids 3 and 4)
            expect(mocks.mockStore.put).toHaveBeenCalledTimes(2);
            expect(mocks.mockStore.put).toHaveBeenCalledWith(pokemon[1]); // sandshrew
            expect(mocks.mockStore.put).toHaveBeenCalledWith(pokemon[2]); // sandslash
        });

        it('should handle empty array', async () => {
            await pokemonStore.saveManyPokemon([]);
            expect(mocks.mockStore.put).not.toHaveBeenCalled();
        });
    });

    describe('clearCache', () => {
        it('should clear the ids cache', async () => {
            // First populate cache
            const keys = [1, 2, 3];
            const getAllKeysRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: keys };
            mocks.mockStore.getAllKeys.mockReturnValue(getAllKeysRequest);

            const initPromise = pokemonStore.init();
            setTimeout(() => mocks.mockOpenRequest.onsuccess(), 0);
            await initPromise;

            const getPromise = pokemonStore.getAllPokemonIds();
            setTimeout(() => getAllKeysRequest.onsuccess(), 0);
            await getPromise;

            // Clear cache
            pokemonStore.clearCache();

            // Next call should hit the database again
            const getPromise2 = pokemonStore.getAllPokemonIds();
            setTimeout(() => getAllKeysRequest.onsuccess(), 10);
            await getPromise2;

            expect(mocks.mockStore.getAllKeys).toHaveBeenCalledTimes(2);
        });
    });
});
