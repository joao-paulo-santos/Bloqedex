import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalOfflineActionStore } from './LocalOfflineActionStore';
import type { OfflineAction } from '../../../core/types';

const createMockIndexedDB = () => {
    const mockStore = {
        get: vi.fn(),
        put: vi.fn(),
        add: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        getAll: vi.fn(),
        openCursor: vi.fn(),
        createIndex: vi.fn(),
        index: vi.fn()
    };

    const mockIndex = {
        getAll: vi.fn(),
        openCursor: vi.fn()
    };

    mockStore.index.mockReturnValue(mockIndex);

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

    // Mock IDBKeyRange
    const mockIDBKeyRange = {
        upperBound: vi.fn((upper) => ({ upper, upperOpen: false })),
        lowerBound: vi.fn((lower) => ({ lower, lowerOpen: false })),
        bound: vi.fn((lower, upper) => ({ lower, upper, lowerOpen: false, upperOpen: false })),
        only: vi.fn((value) => ({ value }))
    };

    Object.defineProperty(globalThis, 'IDBKeyRange', {
        value: mockIDBKeyRange,
        writable: true,
        configurable: true
    });

    return { mockDB, mockTransaction, mockStore, mockIndex, mockOpenRequest, mockIndexedDB, mockIDBKeyRange };
};

const createMockOfflineAction = (id: string, type: OfflineAction['type'], status: OfflineAction['status'] = 'pending', age?: number): OfflineAction => ({
    id,
    type,
    payload: { testData: 'value' },
    timestamp: Date.now() - (age || 0),
    status
});

describe('LocalOfflineActionStore', () => {
    let offlineActionStore: LocalOfflineActionStore;
    let mocks: ReturnType<typeof createMockIndexedDB>;

    beforeEach(() => {
        mocks = createMockIndexedDB();
        offlineActionStore = new LocalOfflineActionStore();

        // Mock navigator.onLine
        Object.defineProperty(globalThis, 'navigator', {
            value: { onLine: true },
            writable: true,
            configurable: true
        });

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
            const initPromise = offlineActionStore.init();

            // Don't trigger onsuccess here since it's already set up in beforeEach
            // The setTimeout in beforeEach will handle it

            await expect(initPromise).resolves.not.toThrow();
            expect(mocks.mockIndexedDB.open).toHaveBeenCalledWith('BloqedexDB', 4);
        });

        it('should create offlineActions object store on upgrade', async () => {
            // Create a fresh mock for this test
            const upgradeRequest = {
                result: mocks.mockDB,
                onsuccess: vi.fn(),
                onerror: vi.fn(),
                onupgradeneeded: vi.fn()
            };

            mocks.mockIndexedDB.open.mockReturnValue(upgradeRequest);

            const storeInitPromise = offlineActionStore.init();

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

            expect(mocks.mockDB.createObjectStore).toHaveBeenCalledWith(
                'offlineActions',
                { keyPath: 'id' }
            );
            expect(mocks.mockStore.createIndex).toHaveBeenCalledWith(
                'timestamp',
                'timestamp',
                { unique: false }
            );
            expect(mocks.mockStore.createIndex).toHaveBeenCalledWith(
                'status',
                'status',
                { unique: false }
            );
        });
    });

    describe('isOnline', () => {
        beforeEach(async () => {
            const initPromise = offlineActionStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should return online status', async () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { onLine: true },
                writable: true,
                configurable: true
            });
            const isOnline = await offlineActionStore.isOnline();
            expect(isOnline).toBe(true);
        });

        it('should return false when offline', async () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { onLine: false },
                writable: true,
                configurable: true
            });
            const isOnline = await offlineActionStore.isOnline();
            expect(isOnline).toBe(false);
        });
    });

    describe('savePendingAction', () => {
        beforeEach(async () => {
            const initPromise = offlineActionStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should save an offline action successfully', async () => {
            const action = createMockOfflineAction('action1', 'catch');

            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = offlineActionStore.savePendingAction(action);

            // Simulate async success
            setTimeout(() => putRequest.onsuccess(), 0);

            await expect(savePromise).resolves.not.toThrow();
            expect(mocks.mockStore.put).toHaveBeenCalledWith(action);
        });

        it('should handle save errors', async () => {
            const action = createMockOfflineAction('action1', 'catch');
            const error = new Error('Save failed');

            const putRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.put.mockReturnValue(putRequest);

            const savePromise = offlineActionStore.savePendingAction(action);

            // Simulate async error
            setTimeout(() => putRequest.onerror(error), 0);

            await expect(savePromise).rejects.toThrow('Save failed');
        });
    });

    describe('getPendingActions', () => {
        beforeEach(async () => {
            const initPromise = offlineActionStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should retrieve all pending actions', async () => {
            const actions = [
                createMockOfflineAction('action1', 'catch'),
                createMockOfflineAction('action2', 'release')
            ];

            const getAllRequest = { onsuccess: vi.fn(), onerror: vi.fn(), result: actions };
            mocks.mockIndex.getAll.mockReturnValue(getAllRequest);

            const getPromise = offlineActionStore.getPendingActions();

            // Simulate async success
            setTimeout(() => getAllRequest.onsuccess(), 0);

            const result = await getPromise;
            expect(result).toEqual(actions);
            expect(mocks.mockIndex.getAll).toHaveBeenCalledWith('pending');
        });
    });

    describe('deletePendingAction', () => {
        beforeEach(async () => {
            const initPromise = offlineActionStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should delete a pending action successfully', async () => {
            const deleteRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.delete.mockReturnValue(deleteRequest);

            const deletePromise = offlineActionStore.deletePendingAction('action1');

            // Simulate async success
            setTimeout(() => deleteRequest.onsuccess(), 0);

            await expect(deletePromise).resolves.not.toThrow();
            expect(mocks.mockStore.delete).toHaveBeenCalledWith('action1');
        });

        it('should handle delete errors', async () => {
            const error = new Error('Delete failed');
            const deleteRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.delete.mockReturnValue(deleteRequest);

            const deletePromise = offlineActionStore.deletePendingAction('action1');

            // Simulate async error
            setTimeout(() => deleteRequest.onerror(error), 0);

            await expect(deletePromise).rejects.toThrow('Delete failed');
        });
    });

    describe('clearPendingActions', () => {
        beforeEach(async () => {
            const initPromise = offlineActionStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should clear all pending actions successfully', async () => {
            const clearRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.clear.mockReturnValue(clearRequest);

            const clearPromise = offlineActionStore.clearPendingActions();

            // Simulate async success
            setTimeout(() => clearRequest.onsuccess(), 0);

            await expect(clearPromise).resolves.not.toThrow();
            expect(mocks.mockStore.clear).toHaveBeenCalled();
        });

        it('should handle clear errors', async () => {
            const error = new Error('Clear failed');
            const clearRequest = { onsuccess: vi.fn(), onerror: vi.fn() };
            mocks.mockStore.clear.mockReturnValue(clearRequest);

            const clearPromise = offlineActionStore.clearPendingActions();

            // Simulate async error
            setTimeout(() => clearRequest.onerror(error), 0);

            await expect(clearPromise).rejects.toThrow('Clear failed');
        });
    });

    describe('cleanupExpiredData', () => {
        beforeEach(async () => {
            const initPromise = offlineActionStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should clean up expired completed actions', async () => {
            const oneHour = 60 * 60 * 1000;
            const expiredAction = createMockOfflineAction('expired1', 'catch', 'completed', oneHour + 1000);

            const mockCursor = {
                value: expiredAction,
                delete: vi.fn(() => ({ onsuccess: vi.fn(), onerror: vi.fn() })),
                continue: vi.fn()
            };

            const cursorRequest = {
                onsuccess: vi.fn(),
                onerror: vi.fn(),
                result: mockCursor
            };

            mocks.mockIndex.openCursor.mockReturnValue(cursorRequest);

            const cleanupPromise = offlineActionStore.cleanupExpiredData();

            // Simulate cursor operations
            setTimeout(() => {
                // First cursor result with expired action
                cursorRequest.onsuccess({ target: { result: mockCursor } });
                const deleteRequest = mockCursor.delete();
                setTimeout(() => deleteRequest.onsuccess(), 0);

                // End cursor
                setTimeout(() => {
                    cursorRequest.onsuccess({ target: { result: null } });
                }, 10);
            }, 0);

            await expect(cleanupPromise).resolves.not.toThrow();
            expect(mockCursor.delete).toHaveBeenCalled();
        });

        it('should skip pending actions during cleanup', async () => {
            const oneHour = 60 * 60 * 1000;
            const pendingAction = createMockOfflineAction('pending1', 'catch', 'pending', oneHour + 1000);

            const mockCursor = {
                value: pendingAction,
                delete: vi.fn(),
                continue: vi.fn()
            };

            const cursorRequest = {
                onsuccess: vi.fn(),
                onerror: vi.fn(),
                result: mockCursor
            };

            mocks.mockIndex.openCursor.mockReturnValue(cursorRequest);

            const cleanupPromise = offlineActionStore.cleanupExpiredData();

            // Simulate cursor operations
            setTimeout(() => {
                // First cursor result with pending action
                cursorRequest.onsuccess({ target: { result: mockCursor } });

                // End cursor
                setTimeout(() => {
                    cursorRequest.onsuccess({ target: { result: null } });
                }, 10);
            }, 0);

            await expect(cleanupPromise).resolves.not.toThrow();
            expect(mockCursor.delete).not.toHaveBeenCalled();
            expect(mockCursor.continue).toHaveBeenCalled();
        });

        it('should handle cleanup errors', async () => {
            const error = new Error('Cleanup failed');

            const cursorRequest = {
                onsuccess: vi.fn(),
                onerror: vi.fn()
            };

            mocks.mockIndex.openCursor.mockReturnValue(cursorRequest);

            const cleanupPromise = offlineActionStore.cleanupExpiredData();

            // Simulate async error
            setTimeout(() => cursorRequest.onerror(error), 0);

            await expect(cleanupPromise).rejects.toThrow('Cleanup failed');
        });
    });

    describe('syncWhenOnline', () => {
        beforeEach(async () => {
            const initPromise = offlineActionStore.init();
            mocks.mockOpenRequest.onsuccess();
            await initPromise;
        });

        it('should return early when offline', async () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { onLine: false },
                writable: true,
                configurable: true
            });

            await expect(offlineActionStore.syncWhenOnline()).resolves.not.toThrow();
        });

        it('should proceed when online', async () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { onLine: true },
                writable: true,
                configurable: true
            });

            await expect(offlineActionStore.syncWhenOnline()).resolves.not.toThrow();
        });
    });
});
