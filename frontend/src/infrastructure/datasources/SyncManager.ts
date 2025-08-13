import { BaseDataSource } from './remote/BaseDataSource';
import { indexedDBStorage } from '../storage/IndexedDBStorage';
import { getCurrentUserId, isOfflineAccount } from '../../common/utils/userContext';
import { pokedexDataSource } from './DataSourceIndex';
import type { CaughtPokemon } from '../../core/types';

// Handles offline synchronization operations
export class SyncManager extends BaseDataSource {

    async syncPendingActions(forceSync = false): Promise<void> {
        if (!(await this.isOnline())) return;

        if (!forceSync && isOfflineAccount()) {
            return;
        }

        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            console.warn('No user ID available for sync');
            return;
        }

        const pendingActions = await indexedDBStorage.getPendingActions();

        for (const action of pendingActions) {
            try {
                switch (action.type) {
                    case 'catch': {
                        const payload = action.payload as { pokemonId: number; notes?: string };
                        const catchResponse = await pokedexDataSource.catchPokemon(currentUserId, payload.pokemonId, payload.notes);
                        await this.cleanupAndSaveCatchResponse(catchResponse, payload.pokemonId);
                        break;
                    }
                    case 'bulk_catch': {
                        const payload = action.payload as { pokemonToCatch: Array<{ pokemonId: number; notes?: string }> };
                        const pokemonIds = payload.pokemonToCatch.map(p => p.pokemonId);
                        const notes = payload.pokemonToCatch[0]?.notes;

                        const bulkCatchResponse = await pokedexDataSource.catchBulkPokemon(currentUserId, pokemonIds, notes);
                        for (const caught of bulkCatchResponse) {
                            await this.cleanupAndSaveCatchResponse(caught, caught.pokemon.pokeApiId);
                        }
                        break;
                    }
                    case 'release': {
                        const payload = action.payload as { pokeApiId: number };
                        await pokedexDataSource.releasePokemon(currentUserId, payload.pokeApiId);
                        break;
                    }
                    case 'bulk_release': {
                        const payload = action.payload as { pokeApiIds: number[] };
                        // Ensure IDs are numbers
                        const numericIds = payload.pokeApiIds.map(id => Number(id));

                        if (numericIds.length > 0) {
                            await pokedexDataSource.releaseBulkPokemon(currentUserId, numericIds);
                        }
                        break;
                    }
                    case 'update': {
                        const payload = action.payload as { pokemonApiId: number; notes?: string; isFavorite?: boolean };

                        const updateResponse = await pokedexDataSource.updateCaughtPokemon(currentUserId, payload.pokemonApiId, payload);
                        if (updateResponse) {
                            await indexedDBStorage.saveCaughtPokemon(updateResponse);
                        }
                        break;
                    }
                }

                await indexedDBStorage.deletePendingAction(action.id);

            } catch (error) {
                console.warn(`Failed to sync action ${action.id}:`, error);
                action.status = 'failed';
                await indexedDBStorage.savePendingAction(action);
            }
        }

        await indexedDBStorage.cleanupExpiredData();
    }

    private async cleanupAndSaveCatchResponse(caughtPokemon: CaughtPokemon, pokeApiId: number): Promise<void> {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            await indexedDBStorage.saveCaughtPokemon(caughtPokemon);
            return;
        }

        const existingCaught = await indexedDBStorage.getCaughtPokemon(currentUserId);

        const tempEntries = existingCaught.filter(cp =>
            cp.pokemon.pokeApiId === pokeApiId &&
            cp.id !== caughtPokemon.id
        );

        for (const tempEntry of tempEntries) {
            await indexedDBStorage.deleteCaughtPokemon(currentUserId, tempEntry.pokemon.pokeApiId);
        }

        await indexedDBStorage.saveCaughtPokemon(caughtPokemon);
    }

    async startPeriodicSync(intervalMs: number = 30000): Promise<void> {
        try {
            await this.syncPendingActions();
        } catch (error) {
            console.warn('Initial sync failed:', error);
        }

        setInterval(async () => {
            try {
                await this.syncPendingActions();
            } catch (error) {
                console.warn('Periodic sync failed:', error);
            }
        }, intervalMs);
    }

    async triggerImmediateSync(): Promise<void> {
        try {
            await this.syncPendingActions();
        } catch (error) {
            console.error('Immediate sync failed:', error);
        }
    }
}

export const syncManager = new SyncManager();
