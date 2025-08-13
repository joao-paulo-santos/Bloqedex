/**
 * Base class for IndexedDB operations with common utilities
 */
export abstract class IndexedDBBase {
    protected dbName = 'BloqedexDB';
    protected dbVersion = 4;
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
                this.createStores(db);
            };
        });
    }

    protected abstract createStores(db: IDBDatabase): void;

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
}
