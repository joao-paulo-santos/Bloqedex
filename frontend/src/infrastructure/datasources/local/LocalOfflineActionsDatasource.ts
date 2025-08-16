import type { OfflineAction } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';

// Data source for Offline Actions
export class LocalOfflineActionsDataSource extends BaseDataSource {

    async getPendingActions(): Promise<OfflineAction[]> {
        return await indexedDBStorage.getPendingActions();
    }

    async hasPokedexInterferingPendingActions(): Promise<boolean> {
        const pendingActions = await this.getPendingActions();
        return pendingActions.some(action =>
            ['catch', 'release', 'update', 'bulk_catch', 'bulk_release'].includes(action.type)
        );
    }

    async catchPokemon(userId: number, pokemonId: number, notes?: string): Promise<void> {
        const payload = { pokemonId, notes };

        const offlineAction: OfflineAction = {
            id: `${userId}_catch_${pokemonId}_${Date.now()}`,
            userId,
            type: 'catch',
            payload,
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);
    }

    async catchBulkPokemon(userId: number, pokemonIds: number[], notes?: string): Promise<void> {
        const payload = {
            pokemonToCatch: pokemonIds.map(pokeApiId => ({
                pokemonId: pokeApiId,
                notes: notes || ""
            }))
        };

        const offlineAction: OfflineAction = {
            id: `${userId}_catch_bulk_${Date.now()}`,
            userId,
            type: 'bulk_catch',
            payload,
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);
    }

    async releasePokemon(userId: number, pokeApiId: number): Promise<void> {
        const offlineAction: OfflineAction = {
            id: `${userId}_release_${pokeApiId}_${Date.now()}`,
            userId,
            type: 'release',
            payload: { pokeApiId },
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);
    }

    async releaseBulkPokemon(userId: number, pokeApiIds: number[]): Promise<void> {
        const offlineAction: OfflineAction = {
            id: `${userId}_release_bulk_${Date.now()}`,
            userId,
            type: 'bulk_release',
            payload: { pokeApiIds },
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);
    }

    async updateCaughtPokemon(
        userId: number,
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean }
    ): Promise<void> {
        const offlineAction: OfflineAction = {
            id: `${userId}_update_${pokeApiId}_${Date.now()}`,
            userId,
            type: 'update',
            payload: { pokeApiId, ...updates },
            timestamp: Date.now(),
            status: 'pending'
        };

        await indexedDBStorage.savePendingAction(offlineAction);
    }
}

// Export singleton instance
export const localOfflineActionsDataSource = new LocalOfflineActionsDataSource();
