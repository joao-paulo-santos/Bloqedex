import type { OfflineAction } from '../../../core/types';
import { IndexedDBBase } from '../core/IndexedDBBase';

export class LocalOfflineActionStore extends IndexedDBBase {
    protected createStores(db: IDBDatabase): void {
        // Offline actions store
        if (!db.objectStoreNames.contains('offlineActions')) {
            const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
            actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
            actionsStore.createIndex('status', 'status', { unique: false });
        }
    }

    async isOnline(): Promise<boolean> {
        return navigator.onLine;
    }

    async savePendingAction(action: OfflineAction): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        await this.promisifyVoidRequest(store.put(action));
    }

    async getPendingActions(): Promise<OfflineAction[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readonly');
        const store = transaction.objectStore('offlineActions');
        const index = store.index('status');

        return await this.promisifyRequest(index.getAll('pending'));
    }

    async clearPendingActions(): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        await this.promisifyVoidRequest(store.clear());
    }

    async deletePendingAction(actionId: string): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        await this.promisifyVoidRequest(store.delete(actionId));
    }

    async syncWhenOnline(): Promise<void> {
        const isOnline = await this.isOnline();
        if (!isOnline) return;
        // Implementation would go here - sync pending actions
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
