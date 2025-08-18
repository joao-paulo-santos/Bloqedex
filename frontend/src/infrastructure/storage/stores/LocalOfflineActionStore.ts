import type { OfflineAction } from '../../../core/types';
import { IndexedDBBase } from '../core/IndexedDBBase';

export class LocalOfflineActionStore extends IndexedDBBase {
    protected createStores(db: IDBDatabase): void {
        // Offline actions store
        if (!db.objectStoreNames.contains('offlineActions')) {
            const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
            actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
            actionsStore.createIndex('userId', 'userId', { unique: false });
            actionsStore.createIndex('status', 'status', { unique: false });
        }
    }

    async savePendingAction(action: OfflineAction): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        await this.promisifyVoidRequest(store.put(action));
    }

    async getPendingActions(userId: number): Promise<OfflineAction[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readonly');
        const store = transaction.objectStore('offlineActions');
        const index = store.index('userId');

        const allForUser: OfflineAction[] = await this.promisifyRequest(index.getAll(userId));
        return allForUser.filter(action => action.status === 'pending');
    }

    async clearPendingActions(userId: number): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');
        const index = store.index('userId');

        const allForUser: OfflineAction[] = await this.promisifyRequest(index.getAll(userId));
        const deletePromises = allForUser
            .filter(action => action.status === 'pending')
            .map(action => this.promisifyVoidRequest(store.delete(action.id)));
        await Promise.all(deletePromises);
    }

    async deletePendingAction(actionId: string): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        await this.promisifyVoidRequest(store.delete(actionId));
    }

    async completePendingAction(actionId: string): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        const action = await this.promisifyRequest(store.get(actionId));
        if (action) {
            action.status = 'completed';
            await this.promisifyVoidRequest(store.put(action));
        }
    }

    async failPendingAction(actionId: string): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        const action = await this.promisifyRequest(store.get(actionId));
        if (action) {
            action.status = 'failed';
            await this.promisifyVoidRequest(store.put(action));
        }
    }

    async cleanupExpiredData(): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
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
