import type { CaughtPokemon, NormalizedCaughtPokemon } from '../../../core/types';
import { IndexedDBBase } from '../core/IndexedDBBase';

export class LocalCaughtPokemonStore extends IndexedDBBase {

    static normalize(caught: CaughtPokemon): NormalizedCaughtPokemon {
        return {
            ...caught,
            isFavorite: caught.isFavorite ? 1 : 0
        };
    }

    static denormalize(caught: NormalizedCaughtPokemon): CaughtPokemon {
        return {
            ...caught,
            isFavorite: !!caught.isFavorite
        };
    }
    protected createStores(db: IDBDatabase): void {
        // Caught Pokemon store
        if (!db.objectStoreNames.contains('caughtPokemon')) {
            const caughtStore = db.createObjectStore('caughtPokemon', { keyPath: ['userId', 'pokemon.pokeApiId'] });
            caughtStore.createIndex('pokemonId', 'pokemon.id', { unique: false });
            caughtStore.createIndex('caughtDate', 'caughtDate', { unique: false });
            caughtStore.createIndex('userId', 'userId', { unique: false });
            caughtStore.createIndex('userId_isFavorite', ['userId', 'isFavorite'], { unique: false });
        }
    }

    async getCaughtCount(userId: number): Promise<number> {
        await this.ensureInitialized();
        const transaction = this.createTransaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');
        try {
            const index = store.index('userId');
            return await this.promisifyRequest(index.count(userId));
        } catch (error) {
            console.error('Error counting caught Pokemon for user:', userId, error);
            return 0;
        }
    }

    async getFavoriteCount(userId: number): Promise<number> {
        await this.ensureInitialized();
        const transaction = this.createTransaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');
        try {
            const index = store.index('userId_isFavorite');
            return await this.promisifyRequest(index.count([userId, 1]));
        } catch (error) {
            console.error('Error counting favorite Pokemon for user:', userId, error);
            return 0;
        }
    }

    async saveCaughtPokemon(caughtPokemon: CaughtPokemon): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');
        const normalized = LocalCaughtPokemonStore.normalize(caughtPokemon);
        await this.promisifyVoidRequest(store.put(normalized));
    }

    async saveManyCaughtPokemon(caughtPokemon: CaughtPokemon[]): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');
        const normalized = caughtPokemon.map(LocalCaughtPokemonStore.normalize);
        await Promise.all(normalized.map(item => this.promisifyVoidRequest(store.put(item))));
    }

    async getCaughtPokemon(userId: number): Promise<CaughtPokemon[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');

        try {
            const index = store.index('userId');
            const results = await this.promisifyRequest(index.getAll(userId));
            return results.map(LocalCaughtPokemonStore.denormalize);
        } catch (error) {
            console.error('Error accessing caught Pokemon for user:', userId, error);
            return [];
        }
    }

    async getCaughtPokemonPaginated(userId: number, pageIndex: number, pageSize: number): Promise<{ pokemon: CaughtPokemon[], total: number }> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');
        try {
            const index = store.index('userId');
            const total = await this.promisifyRequest(index.count(userId));
            const offset = pageIndex * pageSize;
            const results: NormalizedCaughtPokemon[] = [];
            let skipped = 0;
            let collected = 0;
            await new Promise<void>((resolve, reject) => {
                const request = index.openCursor(IDBKeyRange.only(userId));
                request.onsuccess = (event: Event) => {
                    const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                    if (cursor && collected < pageSize) {
                        if (skipped < offset) {
                            skipped++;
                            cursor.continue();
                        } else {
                            results.push(cursor.value);
                            collected++;
                            cursor.continue();
                        }
                    } else {
                        resolve();
                    }
                };
                request.onerror = (event: Event) => {
                    reject((event.target as IDBRequest).error);
                };
            });
            return {
                pokemon: results.map(LocalCaughtPokemonStore.denormalize),
                total
            };
        } catch (error) {
            console.error('Error accessing paginated caught Pokemon for user:', userId, error);
            return { pokemon: [], total: 0 };
        }
    }

    async getCaughtPokemonById(userId: number, pokeApiId: number): Promise<CaughtPokemon | null> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');

        try {
            const result = await this.promisifyRequest(store.get([userId, pokeApiId]));
            return result ? LocalCaughtPokemonStore.denormalize(result) : null;
        } catch (error) {
            console.error('Error accessing caught Pokemon for user:', userId, error);
            return null;
        }
    }

    async deleteCaughtPokemon(userId: number, pokeApiId: number): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        try {
            await this.promisifyVoidRequest(store.delete([userId, pokeApiId]));
        } catch (error) {
            console.error('IndexedDB: Failed to delete Pokemon with pokeApiId:', pokeApiId, 'for user:', userId, 'Error:', error);
            throw error;
        }
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');

        try {
            const index = store.index('userId_isFavorite');
            const favorites = await this.promisifyRequest(index.getAll([userId, 1]));
            return favorites.map(LocalCaughtPokemonStore.denormalize);
        } catch (error) {
            console.error('Error accessing favorites for user:', userId, error);
            return [];
        }
    }

    async clearCaughtPokemonForUser(userId: number): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        // Get all caught Pokemon for the specified user
        const index = store.index('userId');
        const pokemonToDelete = await this.promisifyRequest(index.getAll(userId));


        // Delete all caught Pokemon for this specific user
        const deletePromises = pokemonToDelete.map(pokemon =>
            this.promisifyVoidRequest(store.delete(pokemon.id))
        );

        await Promise.all(deletePromises);
    }
}
