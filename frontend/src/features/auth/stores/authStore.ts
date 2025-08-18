import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../../core/types';
import { authRepository } from '../../../infrastructure/repositories';
import { AuthService } from '../../../core/Services';
import { toastEvents, eventBus } from '../../../common/utils/eventBus';
import { extractErrorMessage } from '../../../common/utils/networkHelpers';
import { syncManager } from '../../../infrastructure/datasources/SyncManager';

interface AuthState {
    isOnline: boolean;
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isOfflineAccount: boolean;
    initialize: () => Promise<void>;
    login: (usernameOrEmail: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    registerOffline: (username: string, email: string) => Promise<void>;
    convertOfflineToOnline: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    logoutWithPendingCheck: () => Promise<boolean>; // Returns true if logout should proceed
    loadUser: () => Promise<void>;
    getPendingActionsCount: () => Promise<number>;
    checkBackendHealth: () => Promise<boolean>;
    syncOfflineActions: () => Promise<void>;
}

const authService = new AuthService(authRepository);

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isOnline: false,
            isAuthenticated: false,
            user: null,
            token: null,
            isOfflineAccount: false,

            initialize: async () => {
                set({ isOnline: false });
            },

            login: async (usernameOrEmail: string, password: string) => {
                try {
                    const response = await authService.login({ usernameOrEmail, password });
                    // await authRepository.login({ usernameOrEmail, password });
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
                    const response = await authService.register({ username, email, password });

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
                const offlineUserId = -hashStringToNumber(username);

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
                    const response = await authService.register({ username, email, password });

                    // Migrate Pokemon data from offline to online account
                    eventBus.emit('auth:offlineToOnlineConversion', {
                        oldUser: currentOfflineUser,
                        newUser: response.user
                    });

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

                set({
                    isAuthenticated: false,
                    user: null,
                    token: null,
                    isOfflineAccount: false,
                });
            }, logoutWithPendingCheck: async () => {
                const { isOfflineAccount, user } = get();

                if (isOfflineAccount) {
                    return false;
                }

                try {
                    const pendingActions = await syncManager.getUserPendingActions(user!.id);
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

                const { isOnline } = get();

                try {
                    const user = await authRepository.getCurrentUser(isOnline);
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
                const { user } = get();
                if (!user) return 0;
                try {
                    const pendingActions = await syncManager.getUserPendingActions(user.id);
                    return pendingActions.length;
                } catch (error) {
                    console.error('Failed to get pending actions count:', error);
                    return 0;
                }
            },

            checkBackendHealth: async () => {
                const oldStatus = get().isOnline;
                try {
                    const isHealthy = await authRepository.isOnline();
                    set({ isOnline: isHealthy });
                    if (oldStatus !== isHealthy) {
                        if (isHealthy) {
                            toastEvents.showSuccess('Connected');
                            get().syncOfflineActions();
                        } else {
                            toastEvents.showWarning('Connection lost');
                        }
                        eventBus.emit('auth:connectivityChange', { isConnected: isHealthy });
                    }
                    return isHealthy;
                } catch (error) {
                    console.error('Failed to check backend health:', error);
                    set({ isOnline: false });
                    if (oldStatus !== false) {
                        eventBus.emit('auth:connectivityChange', { isConnected: false });
                        toastEvents.showWarning('Connection lost');
                    }
                    return false;
                }
            },
            syncOfflineActions: async () => {
                const { user, isOnline, isOfflineAccount } = get();
                if (isOfflineAccount || !isOnline || !user) return;

                try {
                    await syncManager.syncPendingActions(user.id);
                } catch (error) {
                    console.error('Failed to sync offline actions:', error);
                }
            },
        }),
        {
            name: 'bloqedex-auth-storage',
        }
    )
);

function hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}