import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalUserStore } from './LocalUserStore';
import type { User } from '../../../core/types';

const createMockIndexedDB = () => {
    const mockStore = {
        get: vi.fn(),
        put: vi.fn(),
        add: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        getAll: vi.fn(),
        createIndex: vi.fn()
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

    return { mockDB, mockTransaction, mockStore, mockOpenRequest, mockIndexedDB };
};

const createMockUser = (id: number): User => ({
    id,
    username: `user${id}`,
    email: `user${id}@example.com`,
    role: 'user',
    createdDate: new Date().toISOString(),
    caughtPokemonCount: 0
});

describe('LocalUserStore', () => {
    let userStore: LocalUserStore;
    let mocks: ReturnType<typeof createMockIndexedDB>;

    beforeEach(() => {
        mocks = createMockIndexedDB();
        userStore = new LocalUserStore();

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
            const initPromise = userStore.init();

            // Don't trigger onsuccess here since it's already set up in beforeEach

            await expect(initPromise).resolves.not.toThrow();
            expect(mocks.mockIndexedDB.open).toHaveBeenCalledWith('BloqedexDB', 4);
        });

        it('should create user object store on upgrade', async () => {
            // Create a fresh mock for this test
            const upgradeRequest = {
                result: mocks.mockDB,
                onsuccess: vi.fn(),
                onerror: vi.fn(),
                onupgradeneeded: vi.fn()
            };

            mocks.mockIndexedDB.open.mockReturnValue(upgradeRequest);

            const storeInitPromise = userStore.init();

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

            expect(mocks.mockDB.createObjectStore).toHaveBeenCalledWith('users', { keyPath: 'id' });
        });
    });

    describe('saveUser', () => {
        it('should save a user successfully', async () => {
            const user = createMockUser(1);

            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = userStore.saveUser(user);

            // Simulate async success
            setTimeout(() => putRequest.onsuccess(), 0);

            await expect(savePromise).resolves.not.toThrow();
            expect(mocks.mockStore.put).toHaveBeenCalledWith(user);
        });

        it('should handle save errors', async () => {
            const user = createMockUser(1);
            const error = new Error('Save failed');

            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = userStore.saveUser(user);

            // Simulate async error
            setTimeout(() => putRequest.onerror(error), 0);

            await expect(savePromise).rejects.toThrow('Save failed');
        });
    });

    describe('getUser', () => {
        it('should retrieve a user by id', async () => {
            const user = createMockUser(1);

            const getRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: user };
            mocks.mockStore.get.mockReturnValue(getRequest);

            const getPromise = userStore.getUser(1);

            // Simulate async success
            setTimeout(() => getRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(user);
            expect(mocks.mockStore.get).toHaveBeenCalledWith(1);
        });

        it('should return null if user not found', async () => {
            const getRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: undefined };
            mocks.mockStore.get.mockReturnValue(getRequest);

            const getPromise = userStore.getUser(999);

            // Simulate async success
            setTimeout(() => getRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toBeNull();
        });
    });
});
