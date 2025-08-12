import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CaughtPokemon } from '../../../core/entities';
import { authRepository } from '../../../infrastructure/repositories';
import { indexedDBStorage } from '../../../infrastructure/storage/IndexedDBStorage';
import { toastEvents } from '../../../common/utils/eventBus';
import { extractErrorMessage } from '../../../infrastructure/api/BaseApiClient';

interface PendingAccount {
    id: string;
    username: string;
    email: string;
    createdAt: number;
    syncAttempts: number;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isOfflineAccount: boolean;
    pendingAccounts: PendingAccount[];
    login: (usernameOrEmail: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    registerOffline: (username: string, email: string) => Promise<void>;
    convertOfflineToOnline: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    logoutWithPendingCheck: () => Promise<boolean>; // Returns true if logout should proceed
    loadUser: () => Promise<void>;
    syncPendingAccounts: () => Promise<number>;
    getPendingAccountsCount: () => number;
    getPendingActionsCount: () => Promise<number>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            token: null,
            isOfflineAccount: false,
            pendingAccounts: [],

            login: async (usernameOrEmail: string, password: string) => {
                try {
                    const response = await authRepository.login({ usernameOrEmail, password });
                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                        isOfflineAccount: false,
                    });

                    import('../../pokemon/stores/pokemonStore').then(({ usePokemonStore }) => {
                        usePokemonStore.getState().refreshCaughtStatus();
                    }).catch(error => {
                        console.error('Failed to refresh Pokemon caught status after login:', error);
                    });

                    import('../../pokedex/stores/pokedexStore').then(({ usePokedexStore }) => {
                        usePokedexStore.getState().fetchCaughtPokemon();
                    }).catch(error => {
                        console.error('Failed to fetch caught Pokemon after login:', error);
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
                } catch (error) {
                    throw new Error(extractErrorMessage(error));
                }
            },

            registerOffline: async (username: string, email: string) => {
                const pendingAccounts = get().pendingAccounts;

                if (pendingAccounts.length > 0) {
                    throw new Error('You already have an offline account pending sync. Please connect to the internet to sync your account before creating a new one.');
                }

                const newAccount: PendingAccount = {
                    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    username,
                    email,
                    createdAt: Date.now(),
                    syncAttempts: 0,
                };

                const updatedPendingAccounts = [...pendingAccounts, newAccount];

                try {
                    await indexedDBStorage.storePendingAccount(newAccount);
                } catch (error) {
                    console.error('Failed to store pending account in IndexedDB:', error);
                }

                const offlineToken = `offline_${newAccount.id}`;
                // Generate a negative ID for offline accounts to avoid conflicts with online user IDs
                const offlineUserId = -Math.abs(Date.now() % 1000000);

                set({
                    pendingAccounts: updatedPendingAccounts,
                    isAuthenticated: true,
                    user: {
                        id: offlineUserId,
                        username: newAccount.username,
                        email: newAccount.email,
                        role: 'User',
                        createdDate: new Date(newAccount.createdAt).toISOString(),
                        caughtPokemonCount: 0,
                    },
                    token: offlineToken,
                    isOfflineAccount: true,
                });
            },

            convertOfflineToOnline: async (username: string, email: string, password: string) => {
                const { isOfflineAccount, user: currentOfflineUser, token: currentOfflineToken } = get();

                if (!isOfflineAccount || !currentOfflineUser || !currentOfflineToken) {
                    throw new Error('No offline account found to convert');
                }

                try {
                    // Register a new online account
                    const response = await authRepository.register({ username, email, password });

                    // Migrate Pokemon data from offline to online account
                    try {
                        // Get all Pokemon caught by the offline user
                        const offlinePokemon = await indexedDBStorage.getCaughtPokemon(currentOfflineToken);

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
                        const { syncManager } = await import('../../../infrastructure/api/SyncManager');
                        await syncManager.syncPendingActions(true); // Force sync during conversion
                    } catch (error) {
                        console.error('Failed to sync pending actions:', error);
                        toastEvents.showWarning('Account converted successfully, but some actions may need to be manually synced.');
                        // Don't fail the entire conversion if sync fails
                    }

                    // Clear pending accounts
                    await indexedDBStorage.clearPendingAccounts();

                    // Update auth state to online account
                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                        isOfflineAccount: false,
                        pendingAccounts: [],
                    });

                    import('../../pokedex/stores/pokedexStore').then(({ usePokedexStore }) => {
                        usePokedexStore.getState().fetchCaughtPokemon();
                    }).catch(error => {
                        console.error('Failed to fetch caught Pokemon after conversion:', error);
                    });

                    toastEvents.showSuccess('Account successfully converted to online! Your progress has been preserved.');
                } catch (error) {
                    throw new Error(extractErrorMessage(error));
                }
            },

            logout: () => {
                const { isOfflineAccount } = get();

                authRepository.logout();

                if (isOfflineAccount) {
                    set({ pendingAccounts: [] });
                    indexedDBStorage.clearPendingAccounts().catch(error => {
                        console.error('Failed to clear pending accounts from IndexedDB:', error);
                    });
                }

                // Always clear pending actions on logout regardless of user type
                // This prevents unrelated actions from being executed when a new user logs in
                indexedDBStorage.clearPendingActions().catch(error => {
                    console.error('Failed to clear pending actions from IndexedDB:', error);
                });

                // Clear caught status in Pokemon store (set all Pokemon to not caught)
                import('../../pokemon/stores/pokemonStore').then(({ usePokemonStore }) => {
                    usePokemonStore.getState().clearAllCaughtStatus();
                }).catch(error => {
                    console.error('Failed to clear Pokemon caught status:', error);
                });

                set({
                    isAuthenticated: false,
                    user: null,
                    token: null,
                    isOfflineAccount: false,
                });
            },

            logoutWithPendingCheck: async () => {
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
                    const wasOfflineAccount = persistedState.state.isOfflineAccount;

                    if (wasOfflineAccount) {
                        try {
                            const pendingAccounts = await indexedDBStorage.getPendingAccounts();
                            const offlineAccount = pendingAccounts.find(acc =>
                                acc.email === persistedState.state.user.email
                            );

                            if (offlineAccount) {
                                set({
                                    isAuthenticated: true,
                                    user: persistedState.state.user,
                                    token: persistedState.state.token,
                                    isOfflineAccount: true,
                                    pendingAccounts,
                                });

                                import('../../pokemon/stores/pokemonStore').then(({ usePokemonStore }) => {
                                    usePokemonStore.getState().refreshCaughtStatus();
                                }).catch(error => {
                                    console.error('Failed to refresh Pokemon caught status after loading offline account:', error);
                                });

                                import('../../pokedex/stores/pokedexStore').then(({ usePokedexStore }) => {
                                    usePokedexStore.getState().fetchCaughtPokemon();
                                }).catch(error => {
                                    console.error('Failed to fetch caught Pokemon after loading offline account:', error);
                                });
                                return;
                            }
                        } catch (error) {
                            console.error('Failed to load offline account:', error);
                        }
                    } else {
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

                                import('../../pokemon/stores/pokemonStore').then(({ usePokemonStore }) => {
                                    usePokemonStore.getState().refreshCaughtStatus();
                                }).catch(error => {
                                    console.error('Failed to refresh Pokemon caught status after loading online account:', error);
                                });

                                import('../../pokedex/stores/pokedexStore').then(({ usePokedexStore }) => {
                                    usePokedexStore.getState().fetchCaughtPokemon();
                                }).catch(error => {
                                    console.error('Failed to fetch caught Pokemon after loading online account:', error);
                                });
                                return;
                            }
                        } catch (error) {
                            console.error('Failed to load online user:', error);
                        }
                    }
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

                        import('../../pokemon/stores/pokemonStore').then(({ usePokemonStore }) => {
                            usePokemonStore.getState().refreshCaughtStatus();
                        }).catch(error => {
                            console.error('Failed to refresh Pokemon caught status after loading online account (fallback):', error);
                        });

                        import('../../pokedex/stores/pokedexStore').then(({ usePokedexStore }) => {
                            usePokedexStore.getState().fetchCaughtPokemon();
                        }).catch(error => {
                            console.error('Failed to fetch caught Pokemon after loading online account (fallback):', error);
                        });
                        return;
                    }
                } catch (error) {
                    console.error('Failed to load online user:', error);
                }

                try {
                    const pendingAccounts = await indexedDBStorage.getPendingAccounts();
                    if (pendingAccounts.length > 0) {
                        const offlineAccount = pendingAccounts[0];
                        const offlineToken = `offline_${offlineAccount.id}`;
                        // Generate a negative ID for offline accounts to avoid conflicts with online user IDs
                        const offlineUserId = -Math.abs(Date.now() % 1000000);

                        set({
                            isAuthenticated: true,
                            user: {
                                id: offlineUserId,
                                username: offlineAccount.username,
                                email: offlineAccount.email,
                                role: 'User',
                                createdDate: new Date(offlineAccount.createdAt).toISOString(),
                                caughtPokemonCount: 0,
                            },
                            token: offlineToken,
                            isOfflineAccount: true,
                            pendingAccounts,
                        });

                        import('../../pokemon/stores/pokemonStore').then(({ usePokemonStore }) => {
                            usePokemonStore.getState().refreshCaughtStatus();
                        }).catch(error => {
                            console.error('Failed to refresh Pokemon caught status after loading offline account (fallback):', error);
                        });

                        import('../../pokedex/stores/pokedexStore').then(({ usePokedexStore }) => {
                            usePokedexStore.getState().fetchCaughtPokemon();
                        }).catch(error => {
                            console.error('Failed to fetch caught Pokemon after loading offline account (fallback):', error);
                        });
                    }
                } catch (error) {
                    console.error('Failed to load offline accounts:', error);
                }
            },

            syncPendingAccounts: async () => {
                return 0;
            },

            getPendingAccountsCount: () => {
                return get().pendingAccounts.length;
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
