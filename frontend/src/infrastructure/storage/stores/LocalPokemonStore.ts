import type { Pokemon } from '../../../core/types';
import { IndexedDBBase } from '../core/IndexedDBBase';
import { getLastConsecutiveIdFromIds } from '../../../common/utils/pokemonHelpers';

export class LocalPokemonStore extends IndexedDBBase {
    private pokemonIdsCache: Set<number> | null = null;

    protected createStores(db: IDBDatabase): void {
        // Pokemon store
        if (!db.objectStoreNames.contains('pokemon')) {
            const pokemonStore = db.createObjectStore('pokemon', { keyPath: 'id' });
            pokemonStore.createIndex('pokeApiId', 'pokeApiId', { unique: false });
            pokemonStore.createIndex('name', 'name', { unique: false });
        }
    }

    async savePokemon(pokemon: Pokemon): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readwrite');
        const store = transaction.objectStore('pokemon');

        await this.promisifyVoidRequest(store.put(pokemon));

        if (this.pokemonIdsCache) {
            this.pokemonIdsCache.add(pokemon.id);
        }
    }

    async getPokemon(id: number): Promise<Pokemon | null> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        const result = await this.promisifyRequest(store.get(id));
        return result || null;
    }

    async getPokemonByPokeApiId(pokeApiId: number): Promise<Pokemon | null> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');
        const index = store.index('pokeApiId');

        const result = await this.promisifyRequest(index.get(pokeApiId));
        return result || null;
    }

    async getAllPokemon(): Promise<Pokemon[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        return await this.promisifyRequest(store.getAll());
    }

    async getPokemonPage(page: number, pageSize: number): Promise<{ pokemon: Pokemon[], totalCount: number }> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        // Get total count first
        const totalCount = await this.promisifyRequest(store.count());

        // Calculate range for pagination
        const startIndex = (page - 1) * pageSize;
        const pokemon: Pokemon[] = [];

        return new Promise((resolve, reject) => {
            let currentIndex = 0;
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;

                if (cursor) {
                    if (currentIndex >= startIndex && pokemon.length < pageSize) {
                        pokemon.push(cursor.value);
                    }
                    currentIndex++;

                    if (pokemon.length < pageSize && currentIndex < totalCount) {
                        cursor.continue();
                    } else {
                        resolve({ pokemon, totalCount });
                    }
                } else {
                    resolve({ pokemon, totalCount });
                }
            };

            cursorRequest.onerror = () => reject(cursorRequest.error);
        });
    }

    async getPokemonCount(): Promise<number> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        return await this.promisifyRequest(store.count());
    }

    async hasPokemonRange(startId: number, endId: number): Promise<boolean> {
        const existingIds = await this.getAllPokemonIds();

        // Check if we have all Pokemon in the range
        for (let id = startId; id <= endId; id++) {
            if (!existingIds.has(id)) {
                return false;
            }
        }
        return true;
    }

    async getPokemonByIdRange(startId: number, endId: number): Promise<Pokemon[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        // Collect all requests
        const requests: Promise<Pokemon | undefined>[] = [];
        for (let id = startId; id <= endId; id++) {
            requests.push(
                this.promisifyRequest(store.get(id)).then(result => result || undefined)
            );
        }

        const results = await Promise.all(requests);
        const validPokemon = results.filter((p): p is Pokemon => p !== undefined);

        // Sort by ID to maintain order
        return validPokemon.sort((a, b) => a.id - b.id);
    }

    async getAllPokemonIds(): Promise<Set<number>> {
        // Return cached IDs if available
        if (this.pokemonIdsCache) {
            return this.pokemonIdsCache;
        }

        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        const keys = await this.promisifyRequest(store.getAllKeys());
        const ids = new Set(keys as number[]);
        this.pokemonIdsCache = ids;
        return ids;
    }

    async getLastConsecutiveId(): Promise<number> {
        const allIds = await this.getAllPokemonIds();
        return getLastConsecutiveIdFromIds(allIds);
    }

    async saveManyPokemon(pokemon: Pokemon[]): Promise<void> {
        if (pokemon.length === 0) return;

        const existingIds = await this.getAllPokemonIds();
        const newPokemon = pokemon.filter(p => !existingIds.has(p.id));

        if (newPokemon.length === 0) return;

        await this.ensureInitialized();

        const transaction = this.createTransaction(['pokemon'], 'readwrite');
        const store = transaction.objectStore('pokemon');

        const requests = newPokemon.map(p => {
            const request = store.put(p);
            return this.promisifyVoidRequest(request).then(() => {
                if (this.pokemonIdsCache) {
                    this.pokemonIdsCache.add(p.id);
                }
            });
        });

        await Promise.all(requests);
    }

    clearCache(): void {
        this.pokemonIdsCache = null;
    }
}
