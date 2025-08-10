import type { Pokemon, CaughtPokemon, User } from '../../core/entities';
import type { OfflineAction, CacheEntry, IOfflineStorage } from '../../core/interfaces';

export class IndexedDBStorage implements IOfflineStorage {
    private dbName = 'BloqedexDB';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('pokemon')) {
                    const pokemonStore = db.createObjectStore('pokemon', { keyPath: 'id' });
                    pokemonStore.createIndex('pokeApiId', 'pokeApiId', { unique: false });
                    pokemonStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('caughtPokemon')) {
                    const caughtStore = db.createObjectStore('caughtPokemon', { keyPath: 'id' });
                    caughtStore.createIndex('pokemonId', 'pokemonId', { unique: false });
                    caughtStore.createIndex('caughtAt', 'caughtAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('offlineActions')) {
                    const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
                    actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    actionsStore.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    async isOnline(): Promise<boolean> {
        return navigator.onLine;
    }

    async savePendingAction(action: OfflineAction): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        return new Promise((resolve, reject) => {
            const request = store.put(action);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingActions(): Promise<OfflineAction[]> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['offlineActions'], 'readonly');
        const store = transaction.objectStore('offlineActions');
        const index = store.index('status');

        return new Promise((resolve, reject) => {
            const request = index.getAll('pending');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearPendingActions(): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async syncWhenOnline(): Promise<void> {
        const isOnline = await this.isOnline();
        if (!isOnline) return;

        const pendingActions = await this.getPendingActions();

        // TODO: Implement sync logic with API
        console.log('Syncing pending actions:', pendingActions);
    }

    async savePokemon(pokemon: Pokemon): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readwrite');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            const request = store.put(pokemon);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPokemon(id: number): Promise<Pokemon | null> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPokemon(): Promise<Pokemon[]> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveCaughtPokemon(caughtPokemon: CaughtPokemon): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        return new Promise((resolve, reject) => {
            const request = store.put(caughtPokemon);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getCaughtPokemon(): Promise<CaughtPokemon[]> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCaughtPokemon(id: number): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async setCache<T>(key: string, data: T, ttlMs: number = 300000): Promise<void> {
        if (!this.db) await this.init();

        const entry: CacheEntry<T> & { key: string } = {
            key,
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs,
        };

        const transaction = this.db!.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        return new Promise((resolve, reject) => {
            const request = store.put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getCache<T>(key: string): Promise<T | null> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }

                // Check if cache has expired
                if (Date.now() > result.expiresAt) {
                    // Remove expired cache entry
                    this.deleteCache(key);
                    resolve(null);
                    return;
                }

                resolve(result.data);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCache(key: string): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');

        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearExpiredCache(): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('expiresAt');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async saveUser(user: User): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');

        return new Promise((resolve, reject) => {
            const request = store.put(user);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getUser(id: number): Promise<User | null> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async cleanupExpiredData(): Promise<void> {
        await this.clearExpiredCache();

        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');
        const index = store.index('timestamp');

        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            const request = index.openCursor(IDBKeyRange.upperBound(oneDayAgo));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const action = cursor.value as OfflineAction;
                    if (action.status === 'completed' || action.status === 'failed') {
                        cursor.delete();
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });
    }
}

export const indexedDBStorage = new IndexedDBStorage();
