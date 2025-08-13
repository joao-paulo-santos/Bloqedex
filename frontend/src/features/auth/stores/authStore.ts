import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CaughtPokemon } from '../../../core/types';
import { authRepository } from '../../../infrastructure/repositories';
import { indexedDBStorage } from '../../../infrastructure/storage/IndexedDBStorage';
import { toastEvents, eventBus } from '../../../common/utils/eventBus';
import { extractErrorMessage } from '../../../common/utils/networkHelpers';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isOfflineAccount: boolean;
    login: (usernameOrEmail: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    registerOffline: (username: string, email: string) => Promise<void>;
    convertOfflineToOnline: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    logoutWithPendingCheck: () => Promise<boolean>; // Returns true if logout should proceed
    loadUser: () => Promise<void>;
    getPendingActionsCount: () => Promise<number>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            token: null,
            isOfflineAccount: false,

            login: async (usernameOrEmail: string, password: string) => {
                try {
                    const response = await authRepository.login({ usernameOrEmail, password });
                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                        isOfflineAccount: false,
                    });

                    // Emit login event for other features to handle
                    eventBus.emit('auth:login', {
                        userId: response.user.id,
                        user: response.user
                    });
                } catch (error) {
                    throw new Error(extractErrorMessage(error));
                }
            },

            register: async (username: string, email: string, password: string) => {
                try {
                    const response = await authRepository.register({ username, email, password });

                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                        isOfflineAccount: false,
                    });

                    // Emit login event for other features to handle
                    eventBus.emit('auth:login', {
                        userId: response.user.id,
                        user: response.user
                    });
                } catch (error) {
                    throw new Error(extractErrorMessage(error));
                }
            },

            registerOffline: async (username: string, email: string) => {
                const { isOfflineAccount } = get();

                if (isOfflineAccount) {
                    throw new Error('You already have an offline account. Please logout first before creating a new one.');
                }

                // Use -1 for offline user ID
                const offlineUserId = -1;

                set({
                    isAuthenticated: true,
                    user: {
                        id: offlineUserId,
                        username: username,
                        email: email,
                        role: 'User',
                        createdDate: new Date().toISOString(),
                        caughtPokemonCount: 0,
                    },
                    token: null,
                    isOfflineAccount: true,
                });

                // Emit login event for other features to handle
                eventBus.emit('auth:login', {
                    userId: offlineUserId,
                    user: {
                        id: offlineUserId,
                        username: username,
                        email: email,
                        role: 'User',
                        createdDate: new Date().toISOString(),
                        caughtPokemonCount: 0,
                    }
                });
            },

            convertOfflineToOnline: async (username: string, email: string, password: string) => {
                const { isOfflineAccount, user: currentOfflineUser } = get();

                if (!isOfflineAccount || !currentOfflineUser) {
                    throw new Error('No offline account found to convert');
                }

                try {
                    // Register a new online account
                    const response = await authRepository.register({ username, email, password });

                    // Migrate Pokemon data from offline to online account
                    try {
                        // Get all Pokemon caught by the offline user (using -1 as offline user ID)
                        const offlinePokemon = await indexedDBStorage.getCaughtPokemon(-1);

                        // Migrate them to the new online user ID
                        for (const pokemon of offlinePokemon) {
                            const updatedPokemon: CaughtPokemon = {
                                ...pokemon,
                                userId: response.user.id
                            };
                            await indexedDBStorage.saveCaughtPokemon(updatedPokemon);
                        }

                    } catch (error) {
                        console.error('Failed to migrate Pokemon data:', error);
                        toastEvents.showWarning('Account converted successfully, but some Pokemon data may not have been migrated.');
                        // Don't fail the entire conversion if migration fails
                    }

                    // Sync all pending actions to the online account
                    try {
                        const { syncManager } = await import('../../../infrastructure/datasources/DataSourceIndex');
                        await syncManager.syncPendingActions(true); // Force sync during conversion
                    } catch (error) {
                        console.error('Failed to sync pending actions:', error);
                        toastEvents.showWarning('Account converted successfully, but some actions may need to be manually synced.');
                        // Don't fail the entire conversion if sync fails
                    }

                    // Update auth state to online account
                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                        isOfflineAccount: false,
                    });

                    // Emit login event for other features to handle
                    eventBus.emit('auth:login', {
                        userId: response.user.id,
                        user: response.user
                    });

                    toastEvents.showSuccess('Account successfully converted to online! Your progress has been preserved.');
                } catch (error) {
                    throw new Error(extractErrorMessage(error));
                }
            },

            logout: () => {
                const { isOfflineAccount, user } = get();

                authRepository.logout();

                // Emit logout event for other features to handle
                eventBus.emit('auth:logout', {
                    isOfflineAccount: isOfflineAccount,
                    userId: user?.id
                });

                // Always clear pending actions on logout regardless of user type
                // This prevents unrelated actions from being executed when a new user logs in
                indexedDBStorage.clearPendingActions().catch(error => {
                    console.error('Failed to clear pending actions from IndexedDB:', error);
                });

                set({
                    isAuthenticated: false,
                    user: null,
                    token: null,
                    isOfflineAccount: false,
                });
            }, logoutWithPendingCheck: async () => {
                const { isOfflineAccount } = get();

                if (isOfflineAccount) {
                    return false;
                }

                try {
                    const pendingActions = await indexedDBStorage.getPendingActions();
                    const hasPendingActions = pendingActions.length > 0;

                    if (hasPendingActions) {
                        return false;
                    }

                    // No pending actions, safe to logout immediately
                    get().logout();
                    return true;
                } catch (error) {
                    console.error('Failed to check pending actions:', error);
                    get().logout();
                    return true;
                }
            },

            loadUser: async () => {
                const persistedState = JSON.parse(localStorage.getItem('bloqedex-auth-storage') || '{}');

                if (persistedState?.state?.isAuthenticated && persistedState?.state?.user) {
                    set({
                        isAuthenticated: persistedState.state.isAuthenticated,
                        user: persistedState.state.user,
                        token: persistedState.state.token,
                        isOfflineAccount: persistedState.state.isOfflineAccount,
                    });

                    // Emit login event for other features to handle
                    eventBus.emit('auth:login', {
                        userId: persistedState.state.user.id,
                        user: persistedState.state.user
                    });
                    return;
                }

                try {
                    const user = await authRepository.getCurrentUser();
                    const token = localStorage.getItem('auth_token');
                    if (user && token) {
                        set({
                            isAuthenticated: true,
                            user,
                            token,
                            isOfflineAccount: false,
                        });

                        // Emit login event for other features to handle
                        eventBus.emit('auth:login', {
                            userId: user.id,
                            user: user
                        });
                        return;
                    }
                } catch (error) {
                    console.error('Failed to load online user:', error);
                }

                // No valid persisted state, user needs to login again
            },

            getPendingActionsCount: async () => {
                try {
                    const pendingActions = await indexedDBStorage.getPendingActions();
                    return pendingActions.length;
                } catch (error) {
                    console.error('Failed to get pending actions count:', error);
                    return 0;
                }
            },
        }),
        {
            name: 'bloqedex-auth-storage',
        }
    )
);
