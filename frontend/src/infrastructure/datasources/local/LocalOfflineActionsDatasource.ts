import type { OfflineAction } from '../../../core/types';
import { BaseDataSource } from '../BaseDataSource';
import { indexedDBStorage } from '../../storage/IndexedDBStorage';

// Data source for Offline Actions
export class LocalOfflineActionsDataSource extends BaseDataSource {

    async getPendingActions(userId: number): Promise<OfflineAction[]> {
        return await indexedDBStorage.getPendingActions(userId);
    }

    async hasPokedexInterferingPendingActions(userId: number): Promise<boolean> {
        const pendingActions = await this.getPendingActions(userId);
        return pendingActions.some(action =>
            ['catch', 'release', 'update', 'bulk_catch', 'bulk_release'].includes(action.type)
        );
    }

    async migratePendingActions(oldUserId: number, newUserId: number): Promise<void> {
        const pendingActions = await indexedDBStorage.getPendingActions(oldUserId);
        for (const action of pendingActions) {
            await indexedDBStorage.savePendingAction({ ...action, userId: newUserId });
        }
        await indexedDBStorage.clearPendingActions(oldUserId);
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

    async cleanupExpiredData(): Promise<void> {
        await indexedDBStorage.cleanupExpiredData();
    }

    async deleteOfflineAction(actionId: string): Promise<void> {
        await indexedDBStorage.deletePendingAction(actionId);
    }

    async saveOfflineAction(action: OfflineAction): Promise<void> {
        await indexedDBStorage.savePendingAction(action);
    }

    async completeOfflineAction(actionId: string): Promise<void> {
        await indexedDBStorage.completePendingAction(actionId);
    }

    async failOfflineAction(actionId: string): Promise<void> {
        await indexedDBStorage.failPendingAction(actionId);
    }

    async failOfflineActionAndRetry(action: OfflineAction): Promise<void> {
        await indexedDBStorage.failPendingAction(action.id);
        await indexedDBStorage.savePendingAction({
            ...action,
            id: `${action.userId}_retry_${Date.now()}`,
            status: 'pending'
        });
    }
}

// Export singleton instance
export const localOfflineActionsDataSource = new LocalOfflineActionsDataSource();
