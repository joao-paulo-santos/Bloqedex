import { BaseDataSource } from './BaseDataSource';
import { remotePokedexDataSource, localOfflineActionsDataSource } from './DataSourceIndex';
import type { OfflineAction } from '../../core/types';
import { eventBus } from '../../common/utils';

// Handles offline synchronization operations
export class SyncManager extends BaseDataSource {

    async syncPendingActions(userId: number): Promise<void> {
        const pendingActions = await localOfflineActionsDataSource.getPendingActions(userId);

        // Sort pending actions by timestamp to ensure proper chronological order
        const sortedActions = pendingActions.sort((a, b) =>
            a.timestamp - b.timestamp
        );

        for (let i = 0; i < sortedActions.length; i++) {
            const action = sortedActions[i];

            try {
                let success = false;
                switch (action.type) {
                    case 'catch': {
                        const payload = action.payload as { pokemonId: number; notes?: string };
                        const result = await remotePokedexDataSource.catchPokemon(payload.pokemonId, payload.notes);
                        if (result) {
                            success = true;
                        }
                        //TODO: sync localStore based on backend response
                        break;
                    }
                    case 'bulk_catch': {
                        const payload = action.payload as { pokemonToCatch: Array<{ pokemonId: number; notes?: string }> };
                        const pokemonIds = payload.pokemonToCatch.map(p => p.pokemonId);
                        const notes = payload.pokemonToCatch[0]?.notes;

                        const response = await remotePokedexDataSource.catchBulkPokemon(pokemonIds, notes);
                        if (response) {
                            success = true;
                        }
                        //TODO: sync localStore based on backend response
                        break;
                    }
                    case 'release': {
                        const payload = action.payload as { pokeApiId: number };
                        const response = await remotePokedexDataSource.releasePokemon(payload.pokeApiId);
                        if (response) {
                            success = true;
                        }
                        //TODO: sync localStore based on backend response
                        break;
                    }
                    case 'bulk_release': {
                        const payload = action.payload as { pokeApiIds: number[] };
                        const numericIds = payload.pokeApiIds.map(id => Number(id));
                        const response = await remotePokedexDataSource.releaseBulkPokemon(numericIds);
                        if (response) {
                            success = true;
                        }
                        //TODO: sync localStore based on backend response
                        break;
                    }
                    case 'update': {
                        const payload = action.payload as { pokemonApiId: number; notes?: string; isFavorite?: boolean };

                        const response = await remotePokedexDataSource.updateCaughtPokemon(payload.pokemonApiId, { notes: payload.notes, isFavorite: payload.isFavorite });
                        if (response) {
                            success = true;
                        }
                        //TODO: sync localStore based on backend response
                        break;
                    }
                }

                if (success) {
                    await localOfflineActionsDataSource.completeOfflineAction(action.id);
                } else {
                    await localOfflineActionsDataSource.failOfflineActionAndRetry(action);
                }

                // Add a small delay between actions to prevent overwhelming the server
                // Skip delay for the last action
                if (i < sortedActions.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                }

            } catch (error) {
                console.warn(`Failed to sync action ${action.id}:`, error);
                await localOfflineActionsDataSource.failOfflineActionAndRetry(action);
            }
        }

        await localOfflineActionsDataSource.cleanupExpiredData();
    }

    async getUserPendingActions(userId: number): Promise<OfflineAction[]> {
        return await localOfflineActionsDataSource.getPendingActions(userId);
    }

    async migratePendingActions(oldUserId: number, newUserId: number): Promise<void> {
        await localOfflineActionsDataSource.migratePendingActions(oldUserId, newUserId);
    }

    async triggerImmediateSync(userId: number): Promise<void> {
        try {
            await this.syncPendingActions(userId);
        } catch (error) {
            console.error('Immediate sync failed:', error);
        }
    }
}


export const syncManager = new SyncManager();

eventBus.on('auth:offlineToOnlineConversion', (data) => {
    syncManager.migratePendingActions(data.oldUser.id, data.newUser.id);
});