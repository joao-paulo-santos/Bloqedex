import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../../core/entities';
import { authRepository } from '../../../infrastructure/repositories';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            token: null,

            login: async (email: string, password: string) => {
                try {
                    const response = await authRepository.login({ email, password });
                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                    });
                } catch (error) {
                    throw error instanceof Error ? error : new Error('Login failed');
                }
            },

            register: async (username: string, email: string, password: string) => {
                try {
                    const response = await authRepository.register({ username, email, password });
                    set({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token,
                    });
                } catch (error) {
                    throw error instanceof Error ? error : new Error('Registration failed');
                }
            },

            logout: () => {
                authRepository.logout();
                set({
                    isAuthenticated: false,
                    user: null,
                    token: null,
                });
            },

            loadUser: async () => {
                try {
                    const user = await authRepository.getCurrentUser();
                    const token = localStorage.getItem('auth_token');
                    if (user && token) {
                        set({
                            isAuthenticated: true,
                            user,
                            token,
                        });
                    }
                } catch (error) {
                    console.error('Failed to load user:', error);
                    get().logout();
                }
            },
        }),
        {
            name: 'bloqedex-auth-storage',
        }
    )
);
