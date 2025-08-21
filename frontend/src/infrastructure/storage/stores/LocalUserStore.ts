import type { User } from '../../../core/types';
import { IndexedDBBase } from '../core/IndexedDBBase';

export class LocalUserStore extends IndexedDBBase {
    protected createStores(db: IDBDatabase): void {
        this.createAllStores(db);
    }

    async saveUser(user: User): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');

        await this.promisifyVoidRequest(store.put(user));
    }

    async getUser(id: number): Promise<User | null> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['users'], 'readonly');
        const store = transaction.objectStore('users');

        const result = await this.promisifyRequest(store.get(id));
        return result || null;
    }
}
