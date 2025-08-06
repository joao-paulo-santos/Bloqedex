import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/core/entities/User';
import { useNetworkStore } from './networkStore';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    syncWithServer: () => Promise<void>;
}

const mockLogin = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
        return {
            user: {
                id: '1',
                name: 'Test User',
                email: credentials.email,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
        };
    }

    throw new Error('Invalid credentials');
};

const mockRegister = async (data: RegisterData): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        user: {
            id: '2',
            name: data.name,
            email: data.email,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
    };
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials: LoginCredentials) => {
                set({ isLoading: true, error: null });
                // Get online status from network store
                const isOnline = useNetworkStore.getState().isOnline;

                try {
                    if (isOnline) {
                        // Online login
                        const response = await mockLogin(credentials);
                        set({
                            user: response.user,
                            token: response.token,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        // Offline login - check stored credentials
                        // In a real app, you'd check against securely stored credentials
                        // This is a simplified example
                        if (credentials.email === 'test@example.com' && credentials.password === 'password') {
                            const offlineUser = {
                                id: '1',
                                name: 'Test User (Offline)',
                                email: credentials.email,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            };

                            set({
                                user: offlineUser,
                                token: 'offline-token',
                                isAuthenticated: true,
                                isLoading: false,
                                error: null,
                            });
                        } else {
                            throw new Error('Invalid credentials (offline mode)');
                        }
                    }
                } catch (error) {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Login failed',
                    });
                }
            },

            register: async (data: RegisterData) => {
                set({ isLoading: true, error: null });
                // Get online status from network store
                const isOnline = useNetworkStore.getState().isOnline;

                try {
                    if (isOnline) {
                        // Online registration
                        const response = await mockRegister(data);
                        set({
                            user: response.user,
                            token: response.token,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        // Offline registration - store locally
                        const offlineUser = {
                            id: `offline-${Date.now()}`,
                            name: data.name,
                            email: data.email,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        set({
                            user: offlineUser,
                            token: 'offline-token',
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                    }
                } catch (error) {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Registration failed',
                    });
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: null,
                });
            },

            clearError: () => {
                set({ error: null });
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },

            setToken: (token: string | null) => {
                set({ token });
            },

            syncWithServer: async () => {
                const { user } = get();
                // Get online status from network store
                const isOnline = useNetworkStore.getState().isOnline;

                set({ isLoading: true });

                try {
                    if (isOnline && user) {
                        // Check if user has an offline ID
                        if (user.id.startsWith('offline-')) {
                            // This would be a real API call in a production app
                            const response = await mockRegister({
                                name: user.name,
                                email: user.email,
                                password: 'password', // In a real app, you'd handle this differently
                            });

                            set({
                                user: response.user,
                                token: response.token,
                                isLoading: false,
                                error: null,
                            });
                        }
                    }
                    set({ isLoading: false });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Sync failed',
                    });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
