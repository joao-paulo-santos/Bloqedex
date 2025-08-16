import type { CaughtPokemon, PokedexStats, IPokedexRepository, PaginatedResponse } from '../../core/types';
import { localOfflineActionsDataSource, localPokedexDataSource, remotePokedexDataSource } from '../datasources/DataSourceIndex';
import { isOfflineAccount } from '../../common/utils/userContext';

export class PokedexRepository implements IPokedexRepository {
    async getCaughtPokemon(
        userId: number,
        isOnline: boolean,
        pageIndex: number = 0,
        pageSize: number = 20
    ): Promise<PaginatedResponse<CaughtPokemon>> {
        if (isOnline && !isOfflineAccount()) {
            const hasPendingPokedexActions = await localOfflineActionsDataSource.hasPokedexInterferingPendingActions();

            if (!hasPendingPokedexActions) {
                const response = await remotePokedexDataSource.getCaughtPokemon(pageIndex, pageSize);
                if (response) {
                    await localPokedexDataSource.saveManyCaughtPokemon(response.caughtPokemon);
                    return {
                        pokemon: response.caughtPokemon,
                        page: pageIndex + 1,
                        pageSize,
                        totalCount: response.totalCount,
                        totalPages: Math.ceil(response.totalCount / pageSize)
                    };
                }
            }
        }

        const offlineCaughtPokemon = await localPokedexDataSource.getPaginatedCaughtPokemon(userId, pageIndex, pageSize);

        return {
            pokemon: offlineCaughtPokemon.caughtPokemon,
            page: pageIndex + 1,
            pageSize,
            totalCount: offlineCaughtPokemon.totalCount,
            totalPages: Math.ceil(offlineCaughtPokemon.totalCount / pageSize)
        };
    }

    async getFavorites(userId: number): Promise<CaughtPokemon[]> {
        return await localPokedexDataSource.getFavorites(userId);
    }

    async catchPokemon(userId: number, pokeApiId: number, isOnline: boolean, notes?: string): Promise<CaughtPokemon | null> {
        if (isOnline && !isOfflineAccount()) {
            const response = await remotePokedexDataSource.catchPokemon(pokeApiId, notes);
            if (response) {
                await localPokedexDataSource.catchPokemon(userId, pokeApiId, notes);
                return response;
            }
        }

        await localOfflineActionsDataSource.catchPokemon(userId, pokeApiId, notes);
        return await localPokedexDataSource.catchPokemon(userId, pokeApiId, notes);
    }

    async catchBulkPokemon(userId: number, pokeApiId: number[], isOnline: boolean, notes?: string): Promise<CaughtPokemon[]> {
        if (isOnline && !isOfflineAccount()) {
            const response = await remotePokedexDataSource.catchBulkPokemon(pokeApiId, notes);
            if (response) {
                await localPokedexDataSource.catchBulkPokemon(userId, pokeApiId, notes);
                return response;
            }
        }

        await localOfflineActionsDataSource.catchBulkPokemon(userId, pokeApiId, notes);
        return await localPokedexDataSource.catchBulkPokemon(userId, pokeApiId, notes);
    }

    async releasePokemon(userId: number, pokeApiId: number, isOnline: boolean): Promise<boolean> {
        if (isOnline && !isOfflineAccount()) {
            const result = await remotePokedexDataSource.releasePokemon(pokeApiId);
            if (result) {
                await localPokedexDataSource.releasePokemon(userId, pokeApiId);
                return result;
            }
        }

        await localOfflineActionsDataSource.releasePokemon(userId, pokeApiId);
        await localPokedexDataSource.releasePokemon(userId, pokeApiId);
        return true;
    }

    async releaseBulkPokemon(userId: number, pokeApiIds: number[], isOnline: boolean): Promise<boolean> {
        if (isOnline && !isOfflineAccount()) {
            const result = await remotePokedexDataSource.releaseBulkPokemon(pokeApiIds);
            if (result) {
                await localPokedexDataSource.releaseBulkPokemon(userId, pokeApiIds);
                return result;
            }
        }

        await localOfflineActionsDataSource.releaseBulkPokemon(userId, pokeApiIds);
        await localPokedexDataSource.releaseBulkPokemon(userId, pokeApiIds);
        return true;
    }

    async updateCaughtPokemon(
        userId: number,
        pokeApiId: number,
        updates: { notes?: string; isFavorite?: boolean },
        isOnline: boolean
    ): Promise<CaughtPokemon | null> {
        const pokemon = await localPokedexDataSource.getCaughtPokemonById(userId, pokeApiId);
        if (!pokemon) return null;
        const updatedPokemon = { ...pokemon, ...updates };

        if (isOnline && !isOfflineAccount()) {
            const response = await remotePokedexDataSource.updateCaughtPokemon(pokeApiId, updates);
            if (response) {
                await localPokedexDataSource.saveCaughtPokemon(updatedPokemon);
                return response;
            }
        }

        await localPokedexDataSource.saveCaughtPokemon(updatedPokemon);
        await localOfflineActionsDataSource.updateCaughtPokemon(userId, pokeApiId, updates);
        return updatedPokemon;
    }

    async getStats(userId: number, isOnline: boolean): Promise<PokedexStats | null> {
        if (isOnline && !isOfflineAccount()) {
            const response = await remotePokedexDataSource.getPokedexStats();
            if (response) {
                return response;
            }
        }

        return await localPokedexDataSource.getPokedexStats(userId);
    }

    async clearUserData(userId: number): Promise<boolean> {
        return await localPokedexDataSource.clearUserData(userId);
    }
}

export const pokedexRepository = new PokedexRepository();
