import type { User } from '../../../core/types';
import { IndexedDBBase } from '../core/IndexedDBBase';

interface PendingAccount {
    id: string;
    username: string;
    email: string;
    createdAt: number;
    syncAttempts: number;
}

export class LocalUserStore extends IndexedDBBase {
    protected createStores(db: IDBDatabase): void {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
        }

        // Pending accounts store
        if (!db.objectStoreNames.contains('pendingAccounts')) {
            const pendingAccountsStore = db.createObjectStore('pendingAccounts', { keyPath: 'id' });
            pendingAccountsStore.createIndex('email', 'email', { unique: true });
            pendingAccountsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
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

    async storePendingAccount(account: PendingAccount): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pendingAccounts'], 'readwrite');
        const store = transaction.objectStore('pendingAccounts');

        await this.promisifyVoidRequest(store.add(account));
    }

    async getPendingAccounts(): Promise<PendingAccount[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pendingAccounts'], 'readonly');
        const store = transaction.objectStore('pendingAccounts');

        return await this.promisifyRequest(store.getAll());
    }

    async removePendingAccount(accountId: string): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pendingAccounts'], 'readwrite');
        const store = transaction.objectStore('pendingAccounts');

        await this.promisifyVoidRequest(store.delete(accountId));
    }

    async clearPendingAccounts(): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pendingAccounts'], 'readwrite');
        const store = transaction.objectStore('pendingAccounts');

        await this.promisifyVoidRequest(store.clear());
    }
}

export type { PendingAccount };
