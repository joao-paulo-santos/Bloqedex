import type {
    Pokemon,
    CaughtPokemon,
    User,
    OfflineAction,
    IOfflineStorage
} from '../../core/types';
import {
    LocalPokemonStore,
    LocalCaughtPokemonStore,
    LocalUserStore,
    LocalOfflineActionStore
} from './stores';

/**
 * Modern IndexedDB storage implementation using specialized stores
 * Each domain (Pokemon, Users, etc.) is handled by a dedicated store class
 */
export class IndexedDBStorage implements IOfflineStorage {
    private pokemonStore = new LocalPokemonStore();
    private caughtPokemonStore = new LocalCaughtPokemonStore();
    private userStore = new LocalUserStore();
    private offlineActionStore = new LocalOfflineActionStore();

    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) return;

        // Initialize all stores (they share the same database)
        await Promise.all([
            this.pokemonStore.init(),
            this.caughtPokemonStore.init(),
            this.userStore.init(),
            this.offlineActionStore.init()
        ]);

        this.initialized = true;
    }

    // ==========================================
    // Pokemon Operations (delegate to PokemonStore)
    // ==========================================

    async savePokemon(pokemon: Pokemon): Promise<void> {
        return this.pokemonStore.savePokemon(pokemon);
    }

    async getPokemon(pokeApiId: number): Promise<Pokemon | null> {
        return this.pokemonStore.getPokemon(pokeApiId);
    }

    async getAllPokemon(): Promise<Pokemon[]> {
        return this.pokemonStore.getAllPokemon();
    }

    async getPokemonPage(page: number, pageSize: number): Promise<{ pokemon: Pokemon[], totalCount: number }> {
        return this.pokemonStore.getPokemonPage(page, pageSize);
    }

    async getPokemonCount(): Promise<number> {
        return this.pokemonStore.getPokemonCount();
    }

    async hasPokemonRange(startId: number, endId: number): Promise<boolean> {
        return this.pokemonStore.hasPokemonRange(startId, endId);
    }

    async getPokemonByIdRange(startId: number, endId: number): Promise<Pokemon[]> {
        return this.pokemonStore.getPokemonByIdRange(startId, endId);
    }

    async getAllPokemonIds(): Promise<Set<number>> {
        return this.pokemonStore.getAllPokemonIds();
    }

    async getLastConsecutiveId(): Promise<number> {
        return this.pokemonStore.getLastConsecutiveId();
    }

    async saveManyPokemon(pokemon: Pokemon[]): Promise<void> {
        return this.pokemonStore.saveManyPokemon(pokemon);
    }

    async clearAllCaughtStatus(): Promise<void> {
        return await this.pokemonStore.clearAllCaughtStatus();
    }

    // ==========================================
    // Caught Pokemon Operations (delegate to CaughtPokemonStore)
    // ==========================================

    async saveCaughtPokemon(caughtPokemon: CaughtPokemon): Promise<void> {
        return this.caughtPokemonStore.saveCaughtPokemon(caughtPokemon);
    }

    async saveManyCaughtPokemon(caughtPokemon: CaughtPokemon[]): Promise<void> {
        return this.caughtPokemonStore.saveManyCaughtPokemon(caughtPokemon);
    }

    async getCaughtPokemon(userId: number): Promise<CaughtPokemon[]> {
        return this.caughtPokemonStore.getCaughtPokemon(userId);
    }

    async getCaughtPokemonById(userId: number, pokeApiId: number): Promise<CaughtPokemon | null> {
        return this.caughtPokemonStore.getCaughtPokemonById(userId, pokeApiId);
    }

    async getCaughtPokemonPaginated(userId: number, pageIndex: number, pageSize: number): Promise<{ pokemon: CaughtPokemon[], total: number }> {
        return this.caughtPokemonStore.getCaughtPokemonPaginated(userId, pageIndex, pageSize);
    }

    async deleteCaughtPokemon(userId: number, pokeApiId: number): Promise<void> {
        return this.caughtPokemonStore.deleteCaughtPokemon(userId, pokeApiId);
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        return this.caughtPokemonStore.getFavorites(userId);
    }

    async getCaughtPokemonCount(userId: number): Promise<number> {
        return this.caughtPokemonStore.getCaughtCount(userId);
    }

    async getFavoriteCount(userId: number): Promise<number> {
        return this.caughtPokemonStore.getFavoriteCount(userId);
    }

    async clearCaughtPokemonForUser(userId: number): Promise<void> {
        return this.caughtPokemonStore.clearCaughtPokemonForUser(userId);
    }

    // ==========================================
    // User Operations (delegate to UserStore)
    // ==========================================

    async saveUser(user: User): Promise<void> {
        return this.userStore.saveUser(user);
    }

    async getUser(id: number): Promise<User | null> {
        return this.userStore.getUser(id);
    }

    // ==========================================
    // Offline Action Operations (delegate to OfflineActionStore)
    // ==========================================

    async savePendingAction(action: OfflineAction): Promise<void> {
        return this.offlineActionStore.savePendingAction(action);
    }

    async getPendingActions(userId: number): Promise<OfflineAction[]> {
        return this.offlineActionStore.getPendingActions(userId);
    }

    async clearPendingActions(userId: number): Promise<void> {
        return this.offlineActionStore.clearPendingActions(userId);
    }

    async deletePendingAction(actionId: string): Promise<void> {
        return this.offlineActionStore.deletePendingAction(actionId);
    }

    async cleanupExpiredData(): Promise<void> {
        return this.offlineActionStore.cleanupExpiredData();
    }

    async completePendingAction(actionId: string): Promise<void> {
        return this.offlineActionStore.completePendingAction(actionId);
    }

    async failPendingAction(actionId: string): Promise<void> {
        return this.offlineActionStore.failPendingAction(actionId);
    }

    // ==========================================
    // Utility Methods
    // ==========================================

    /**
     * Clear all caches across stores
     */
    clearCaches(): void {
        this.pokemonStore.clearCache();
    }
}

// Export singleton instance for backwards compatibility
export const indexedDBStorage = new IndexedDBStorage();

// Export types
