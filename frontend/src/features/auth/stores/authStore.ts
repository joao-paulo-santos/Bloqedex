import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../../core/entities';
import { authRepository } from '../../../infrastructure/repositories';
import { indexedDBStorage } from '../../../infrastructure/storage/IndexedDBStorage';

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
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    registerOffline: (username: string, email: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    syncPendingAccounts: () => Promise<number>;
    getPendingAccountsCount: () => number;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            token: null,
            isOfflineAccount: false,
            pendingAccounts: [],

            login: async (email: string, password: string) => {
                try {
                    const response = await authRepository.login({ email, password });
                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                        isOfflineAccount: false,
                    });
                } catch (error) {
                    throw error instanceof Error ? error : new Error('Login failed');
                }
            },

            register: async (username: string, email: string, password: string) => {
                const { isOfflineAccount, user: currentOfflineUser, token: currentOfflineToken } = get();

                try {
                    const response = await authRepository.register({ username, email, password });

                    // If switching from offline to online account, migrate the Pokemon data
                    if (isOfflineAccount && currentOfflineUser && currentOfflineToken) {
                        try {
                            // Get all Pokemon caught by the offline user
                            const offlinePokemon = await indexedDBStorage.getCaughtPokemon(currentOfflineToken);

                            // Migrate them to the new online user ID
                            for (const pokemon of offlinePokemon) {
                                const updatedPokemon = {
                                    ...pokemon,
                                    userId: response.user.id
                                };
                                await indexedDBStorage.saveCaughtPokemon(updatedPokemon);
                            }

                            console.log(`Migrated ${offlinePokemon.length} Caught Pokemon from offline to online account`);
                        } catch (error) {
                            console.error('Failed to migrate Pokemon data:', error);
                        }

                        await indexedDBStorage.clearPendingAccounts();
                        set({ pendingAccounts: [] });
                    }

                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                        isOfflineAccount: false,
                    });
                } catch (error) {
                    throw error instanceof Error ? error : new Error('Registration failed');
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

                set({
                    pendingAccounts: updatedPendingAccounts,
                    isAuthenticated: true,
                    user: {
                        id: offlineToken,
                        username: newAccount.username,
                        email: newAccount.email,
                        createdAt: new Date(newAccount.createdAt).toISOString(),
                    },
                    token: offlineToken,
                    isOfflineAccount: true,
                });
            },

            logout: () => {
                authRepository.logout();
                const { isOfflineAccount } = get();

                if (isOfflineAccount) {
                    set({ pendingAccounts: [] });
                    indexedDBStorage.clearPendingAccounts().catch(error => {
                        console.error('Failed to clear pending accounts from IndexedDB:', error);
                    });
                }

                set({
                    isAuthenticated: false,
                    user: null,
                    token: null,
                    isOfflineAccount: false,
                });
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
                        set({
                            isAuthenticated: true,
                            user: {
                                id: offlineToken, // Use the full token as user ID for consistency
                                username: offlineAccount.username,
                                email: offlineAccount.email,
                                createdAt: new Date(offlineAccount.createdAt).toISOString(),
                            },
                            token: offlineToken,
                            isOfflineAccount: true,
                            pendingAccounts,
                        });
                    }
                } catch (error) {
                    console.error('Failed to load offline accounts:', error);
                }
            },

            syncPendingAccounts: async () => {
                // Since we don't store passwords, we can't automatically sync accounts
                // This method is kept for compatibility but will always return 0
                // Offline accounts need to be manually recreated online
                return 0;
            },

            getPendingAccountsCount: () => {
                return get().pendingAccounts.length;
            },
        }),
        {
            name: 'bloqedex-auth-storage',
        }
    )
);
