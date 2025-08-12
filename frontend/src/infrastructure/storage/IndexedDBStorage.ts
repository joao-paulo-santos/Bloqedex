import type { Pokemon, CaughtPokemon, User, PokedexStats } from '../../core/entities';
import type { OfflineAction, IOfflineStorage } from '../../core/interfaces';
import { getLastConsecutiveIdFromIds } from '../../common/utils/pokemonHelpers';

interface PendingAccount {
    id: string;
    username: string;
    email: string;
    createdAt: number;
    syncAttempts: number;
}

export class IndexedDBStorage implements IOfflineStorage {
    private dbName = 'BloqedexDB';
    private dbVersion = 4;
    private db: IDBDatabase | null = null;
    private pokemonIdsCache: Set<number> | null = null;

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

                // Pokemon store
                if (!db.objectStoreNames.contains('pokemon')) {
                    const pokemonStore = db.createObjectStore('pokemon', { keyPath: 'id' });
                    pokemonStore.createIndex('pokeApiId', 'pokeApiId', { unique: false });
                    pokemonStore.createIndex('name', 'name', { unique: false });
                }

                // Caught Pokemon store
                if (!db.objectStoreNames.contains('caughtPokemon')) {
                    const caughtStore = db.createObjectStore('caughtPokemon', { keyPath: 'id' });
                    caughtStore.createIndex('pokemonId', 'pokemon.id', { unique: false });
                    caughtStore.createIndex('caughtDate', 'caughtDate', { unique: false });
                    caughtStore.createIndex('userId', 'userId', { unique: false });
                }

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }

                // Offline actions store
                if (!db.objectStoreNames.contains('offlineActions')) {
                    const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
                    actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    actionsStore.createIndex('status', 'status', { unique: false });
                }

                // Pending accounts store
                if (!db.objectStoreNames.contains('pendingAccounts')) {
                    const pendingAccountsStore = db.createObjectStore('pendingAccounts', { keyPath: 'id' });
                    pendingAccountsStore.createIndex('email', 'email', { unique: true });
                    pendingAccountsStore.createIndex('createdAt', 'createdAt', { unique: false });
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

    async deletePendingAction(actionId: string): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');

        return new Promise((resolve, reject) => {
            const request = store.delete(actionId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async syncWhenOnline(): Promise<void> {
        const isOnline = await this.isOnline();
        if (!isOnline) return;

    }

    async savePokemon(pokemon: Pokemon): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readwrite');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            const request = store.put(pokemon);
            request.onsuccess = () => {
                if (this.pokemonIdsCache) {
                    this.pokemonIdsCache.add(pokemon.id);
                }
                resolve();
            };
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

    async getPokemonByPokeApiId(pokeApiId: number): Promise<Pokemon | null> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');
        const index = store.index('pokeApiId');

        return new Promise((resolve, reject) => {
            const request = index.get(pokeApiId);
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

    async getPokemonPage(page: number, pageSize: number): Promise<{ pokemon: Pokemon[], totalCount: number }> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            // Get total count first
            const countRequest = store.count();
            countRequest.onsuccess = () => {
                const totalCount = countRequest.result;

                // Calculate range for pagination
                const startIndex = (page - 1) * pageSize;

                // Use cursor to efficiently get the page
                const pokemon: Pokemon[] = [];
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
            };
            countRequest.onerror = () => reject(countRequest.error);
        });
    }

    async getPokemonCount(): Promise<number> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async hasPokemonRange(startId: number, endId: number): Promise<boolean> {
        if (!this.db) await this.init();

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
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');
        const pokemon: Pokemon[] = [];

        return new Promise((resolve, reject) => {
            for (let id = startId; id <= endId; id++) {
                const request = store.get(id);
                request.onsuccess = () => {
                    if (request.result) {
                        pokemon.push(request.result);
                    }
                    if (id === endId) {
                        // Sort by ID to maintain order
                        pokemon.sort((a, b) => a.id - b.id);
                        resolve(pokemon);
                    }
                };
                request.onerror = () => reject(request.error);
            }
        });
    }

    async getAllPokemonIds(): Promise<Set<number>> {
        // Return cached IDs if available
        if (this.pokemonIdsCache) {
            return this.pokemonIdsCache;
        }

        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['pokemon'], 'readonly');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            const request = store.getAllKeys();
            request.onsuccess = () => {
                const ids = new Set(request.result as number[]);
                this.pokemonIdsCache = ids;
                resolve(ids);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getLastConsecutiveId(): Promise<number> {
        const allIds = await this.getAllPokemonIds();
        return getLastConsecutiveIdFromIds(allIds);
    }

    async saveManyPokemon(pokemon: Pokemon[]): Promise<void> {
        if (!this.db) await this.init();
        const existingIds = await this.getAllPokemonIds();

        const newPokemon = pokemon.filter(p => !existingIds.has(p.id));

        if (newPokemon.length === 0) {
            return;
        }

        const transaction = this.db!.transaction(['pokemon'], 'readwrite');
        const store = transaction.objectStore('pokemon');

        return new Promise((resolve, reject) => {
            let completed = 0;
            const total = newPokemon.length;

            newPokemon.forEach(p => {
                const request = store.put(p);
                request.onsuccess = () => {
                    if (this.pokemonIdsCache) {
                        this.pokemonIdsCache.add(p.id);
                    }
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
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

    async getCaughtPokemon(userId?: number | string): Promise<CaughtPokemon[]> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['caughtPokemon'], 'readonly');
        const store = transaction.objectStore('caughtPokemon');

        return new Promise((resolve, reject) => {
            if (userId) {
                // Check if the userId index exists before trying to use it
                try {
                    if (store.indexNames.contains('userId')) {
                        // Filter by userId using the index
                        const index = store.index('userId');
                        const request = index.getAll(userId);
                        request.onsuccess = () => {
                            const result = request.result;
                            const uniquePokemon = this.removeDuplicatesByPokeApiId(result);
                            resolve(uniquePokemon);
                        };
                        request.onerror = () => reject(request.error);
                    } else {
                        // Fallback: get all and filter manually
                        console.warn('userId index not found, filtering manually');
                        const request = store.getAll();
                        request.onsuccess = () => {
                            const allItems = request.result;
                            const filtered = allItems.filter((item: CaughtPokemon) => item.userId === userId);
                            const uniquePokemon = this.removeDuplicatesByPokeApiId(filtered);
                            resolve(uniquePokemon);
                        };
                        request.onerror = () => reject(request.error);
                    }
                } catch (error) {
                    console.error('Error accessing userId index:', error);
                    // Fallback: get all and filter manually
                    const request = store.getAll();
                    request.onsuccess = () => {
                        const allItems = request.result;
                        const filtered = allItems.filter((item: CaughtPokemon) => item.userId === userId);
                        const uniquePokemon = this.removeDuplicatesByPokeApiId(filtered);
                        resolve(uniquePokemon);
                    };
                    request.onerror = () => reject(request.error);
                }
            } else {
                // Get all caught Pokemon
                const request = store.getAll();
                request.onsuccess = () => {
                    const result = request.result;
                    const uniquePokemon = this.removeDuplicatesByPokeApiId(result);
                    resolve(uniquePokemon);
                };
                request.onerror = () => reject(request.error);
            }
        });
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

    async cleanupDuplicateCaughtPokemon(userId?: number | string): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        return new Promise((resolve, reject) => {
            // Get all caught Pokemon for the user
            let request: IDBRequest;
            if (userId && store.indexNames.contains('userId')) {
                const index = store.index('userId');
                request = index.getAll(userId);
            } else {
                request = store.getAll();
            }

            request.onsuccess = async () => {
                try {
                    let allPokemon = request.result as CaughtPokemon[];

                    if (userId && !store.indexNames.contains('userId')) {
                        allPokemon = allPokemon.filter(p => p.userId === userId);
                    }

                    const grouped = new Map<number, CaughtPokemon[]>();
                    for (const pokemon of allPokemon) {
                        const pokeApiId = pokemon.pokemon.pokeApiId;
                        if (!grouped.has(pokeApiId)) {
                            grouped.set(pokeApiId, []);
                        }
                        grouped.get(pokeApiId)!.push(pokemon);
                    }

                    for (const [, duplicates] of grouped) {
                        if (duplicates.length > 1) {
                            duplicates.sort((a, b) => a.id - b.id);
                            const toDelete = duplicates.slice(1);

                            for (const duplicate of toDelete) {
                                const deleteReq = store.delete(duplicate.id);
                                await new Promise<void>((resolveDelete, rejectDelete) => {
                                    deleteReq.onsuccess = () => resolveDelete();
                                    deleteReq.onerror = () => rejectDelete(deleteReq.error);
                                });
                            }

                        }
                    }

                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async deleteCaughtPokemon(id: number): Promise<void> {
        if (!this.db) await this.init();

        const transaction = this.db!.transaction(['caughtPokemon'], 'readwrite');
        const store = transaction.objectStore('caughtPokemon');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => {
                console.error('IndexedDB: Failed to delete Pokemon with ID:', id, 'Error:', request.error);
                reject(request.error);
            };
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

    async storePendingAccount(account: PendingAccount): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pendingAccounts'], 'readwrite');
            const store = transaction.objectStore('pendingAccounts');
            const request = store.add(account);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingAccounts(): Promise<PendingAccount[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pendingAccounts'], 'readonly');
            const store = transaction.objectStore('pendingAccounts');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removePendingAccount(accountId: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pendingAccounts'], 'readwrite');
            const store = transaction.objectStore('pendingAccounts');
            const request = store.delete(accountId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearPendingAccounts(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pendingAccounts'], 'readwrite');
            const store = transaction.objectStore('pendingAccounts');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
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
}

export const indexedDBStorage = new IndexedDBStorage();
