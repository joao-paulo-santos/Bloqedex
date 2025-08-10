import { BaseApiClient } from './BaseApiClient';
import { indexedDBStorage } from '../storage/IndexedDBStorage';

// Handles offline synchronization operations
export class SyncManager extends BaseApiClient {
    async syncPendingActions(): Promise<void> {
        if (!(await this.isOnline())) return;

        const pendingActions = await indexedDBStorage.getPendingActions();

        for (const action of pendingActions) {
            try {
                switch (action.type) {
                    case 'catch':
                        await this.client.post('/pokedex/catch', action.payload);
                        break;
                    case 'release':
                        await this.client.delete(`/pokedex/release/${action.payload.caughtPokemonId}`);
                        break;
                    case 'update':
                        await this.client.put(`/pokedex/update/${action.payload.id}`, action.payload);
                        break;
                    // Add other action types as needed
                }

                // Mark action as completed
                action.status = 'completed';
                await indexedDBStorage.savePendingAction(action);

            } catch (error) {
                console.warn(`Failed to sync action ${action.id}:`, error);
                action.status = 'failed';
                await indexedDBStorage.savePendingAction(action);
            }
        }

        // Clean up completed actions
        await indexedDBStorage.cleanupExpiredData();
    }

    async startPeriodicSync(intervalMs: number = 30000): Promise<void> {
        setInterval(async () => {
            try {
                await this.syncPendingActions();
            } catch (error) {
                console.warn('Periodic sync failed:', error);
            }
        }, intervalMs);
    }
}

export const syncManager = new SyncManager();
