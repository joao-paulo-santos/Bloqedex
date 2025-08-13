import type { CaughtPokemon, PokedexStats } from '../../../core/types';
import { IndexedDBBase } from '../core/IndexedDBBase';

export class LocalCaughtPokemonStore extends IndexedDBBase {
    protected createStores(db: IDBDatabase): void {
        // Caught Pokemon store
        if (!db.objectStoreNames.contains('caughtPokemon')) {
            const caughtStore = db.createObjectStore('caughtPokemon', { keyPath: 'id' });
            caughtStore.createIndex('pokemonId', 'pokemon.id', { unique: false });
            caughtStore.createIndex('caughtDate', 'caughtDate', { unique: false });
            caughtStore.createIndex('userId', 'userId', { unique: false });
        }
    }

    async saveCaughtPokemon(caughtPokemon: CaughtPokemon): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        await this.promisifyVoidRequest(store.put(caughtPokemon));
    }

    async getCaughtPokemon(userId?: number | string): Promise<CaughtPokemon[]> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');

        let result: CaughtPokemon[];

        if (userId) {
            try {
                if (store.indexNames.contains('userId')) {
                    // Filter by userId using the index
                    const index = store.index('userId');
                    result = await this.promisifyRequest(index.getAll(userId));
                } else {
                    // Fallback: get all and filter manually
                    console.warn('userId index not found, filtering manually');
                    const allItems = await this.promisifyRequest(store.getAll());
                    result = allItems.filter((item: CaughtPokemon) => item.userId === userId);
                }
            } catch (error) {
                console.error('Error accessing userId index:', error);
                // Fallback: get all and filter manually
                const allItems = await this.promisifyRequest(store.getAll());
                result = allItems.filter((item: CaughtPokemon) => item.userId === userId);
            }
        } else {
            // Get all caught Pokemon
            result = await this.promisifyRequest(store.getAll());
        }

        return this.removeDuplicatesByPokeApiId(result);
    }

    async deleteCaughtPokemon(id: number): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        try {
            await this.promisifyVoidRequest(store.delete(id));
        } catch (error) {
            console.error('IndexedDB: Failed to delete Pokemon with ID:', id, 'Error:', error);
            throw error;
        }
    }

    async getFavorites(userId?: number | string): Promise<CaughtPokemon[]> {
        const allCaught = await this.getCaughtPokemon(userId);
        return allCaught.filter(pokemon => pokemon.isFavorite);
    }

    async getPokedexStats(userId?: number | string): Promise<PokedexStats> {
        const allCaught = await this.getCaughtPokemon(userId);
        const totalCaught = allCaught.length;
        const totalFavorites = allCaught.filter(pokemon => pokemon.isFavorite).length;

        // Calculate unique species caught
        const uniqueSpecies = new Set(allCaught.map(pokemon => pokemon.pokemon.id)).size;

        // Assuming there are 1010 Pokemon total (as of recent generations)
        const totalAvailable = 1010;
        const completionPercentage = totalAvailable > 0 ? (uniqueSpecies / totalAvailable) * 100 : 0;

        return {
            totalCaught,
            totalFavorites,
            completionPercentage,
            totalAvailable
        };
    }

    async cleanupDuplicateCaughtPokemon(userId?: number | string): Promise<void> {
        await this.ensureInitialized();

        const transaction = this.createTransaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        // Get all caught Pokemon for the user
        let allPokemon: CaughtPokemon[];
        if (userId && store.indexNames.contains('userId')) {
            const index = store.index('userId');
            allPokemon = await this.promisifyRequest(index.getAll(userId));
        } else {
            const allItems = await this.promisifyRequest(store.getAll());
            allPokemon = userId ? allItems.filter(p => p.userId === userId) : allItems;
        }

        // Group by pokeApiId
        const grouped = new Map<number, CaughtPokemon[]>();
        for (const pokemon of allPokemon) {
            const pokeApiId = pokemon.pokemon.pokeApiId;
            if (!grouped.has(pokeApiId)) {
                grouped.set(pokeApiId, []);
            }
            grouped.get(pokeApiId)!.push(pokemon);
        }

        // Delete duplicates (keep the first one, delete the rest)
        const deletePromises: Promise<void>[] = [];
        for (const [, duplicates] of grouped) {
            if (duplicates.length > 1) {
                // Sort by ID and keep the first one
                duplicates.sort((a, b) => a.id - b.id);
                const toDelete = duplicates.slice(1);

                for (const duplicate of toDelete) {
                    deletePromises.push(
                        this.promisifyVoidRequest(store.delete(duplicate.id))
                    );
                }
            }
        }

        await Promise.all(deletePromises);
    }

    private removeDuplicatesByPokeApiId(caughtPokemon: CaughtPokemon[]): CaughtPokemon[] {
        const seen = new Map<number, CaughtPokemon>();

        for (const pokemon of caughtPokemon) {
            const pokeApiId = pokemon.pokemon.pokeApiId;
            const existing = seen.get(pokeApiId);

            if (!existing || pokemon.id < existing.id) {
                seen.set(pokeApiId, pokemon);
            }
        }

        return Array.from(seen.values());
    }
}
