/**
 * Base class for IndexedDB operations with common utilities
 */
export abstract class IndexedDBBase {
    protected dbName = 'BloqedexDB';
    protected dbVersion = 5;
    protected db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                this.createAllStores(db);
            };
        });
    }

    protected abstract createStores(db: IDBDatabase): void;

    protected createAllStores(db: IDBDatabase): void {
        // Pokemon store
        if (!db.objectStoreNames.contains('pokemon')) {
            const pokemonStore = db.createObjectStore('pokemon', { keyPath: 'pokeApiId' });
            pokemonStore.createIndex('name', 'name', { unique: false });
            pokemonStore.createIndex('isCaught', 'isCaught', { unique: false });
        }

        // Caught Pokemon store
        if (!db.objectStoreNames.contains('caughtPokemon')) {
            const caughtStore = db.createObjectStore('caughtPokemon', { keyPath: ['userId', 'pokemon.pokeApiId'] });
            caughtStore.createIndex('pokemonId', 'pokemon.id', { unique: false });
            caughtStore.createIndex('caughtDate', 'caughtDate', { unique: false });
            caughtStore.createIndex('userId', 'userId', { unique: false });
            caughtStore.createIndex('userId_isFavorite', ['userId', 'isFavorite'], { unique: false });
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
        }

        // Offline actions store
        if (!db.objectStoreNames.contains('offlineActions')) {
            const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
            actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
            actionsStore.createIndex('userId', 'userId', { unique: false });
            actionsStore.createIndex('status', 'status', { unique: false });
        }
    }

    protected async ensureInitialized(): Promise<void> {
        if (!this.db) {
            await this.init();
        }
    }

    protected createTransaction(storeNames: string[], mode: IDBTransactionMode = 'readonly'): IDBTransaction {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db.transaction(storeNames, mode);
    }

    protected promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    protected promisifyVoidRequest(request: IDBRequest): Promise<void> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close();
                this.db = null;
            }

            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve();
        });
    }
}
