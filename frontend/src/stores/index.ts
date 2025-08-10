// Re-export feature stores
export { useAuthStore } from '../features/auth';
export { usePokemonStore } from '../features/pokemon';
export { usePokedexStore } from '../features/pokedex';

// App Global State Store
import { create } from 'zustand';
import { useAuthStore } from '../features/auth';
import { authRepository } from '../infrastructure/repositories';
import { apiConfig } from '../config/api';

interface AppGlobalState {
  isOnline: boolean;
  lastSyncTime: number;
  lastHealthCheck: number;
  setOnlineStatus: (status: boolean) => void;
  updateLastSyncTime: () => void;
  checkBackendHealth: () => Promise<void>;
}

export const useAppStore = create<AppGlobalState>((set, get) => ({
  isOnline: false,
  lastSyncTime: 0,
  lastHealthCheck: 0,

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status, lastHealthCheck: Date.now() });
  },

  updateLastSyncTime: () => {
    set({ lastSyncTime: Date.now() });
  },

  checkBackendHealth: async () => {
    try {
      const isHealthy = await authRepository.isOnline();
      get().setOnlineStatus(isHealthy);
    } catch (error) {
      console.warn('Backend health check failed:', error);
      get().setOnlineStatus(false);
    }
  },
}));

// Initialize function
export const initializeStores = async () => {
  // Load authentication state
  const authStore = useAuthStore.getState();
  await authStore.loadUser();

  // Get app store instance
  const appStore = useAppStore.getState();

  // Initial backend health check
  await appStore.checkBackendHealth();

  // Set up periodic backend health checks using configured interval
  setInterval(() => {
    appStore.checkBackendHealth();
  }, apiConfig.healthCheckInterval);

  // Set up health check on window focus (when user returns to tab)
  window.addEventListener('focus', () => {
    appStore.checkBackendHealth();
  });

  // Seed offline data for initial app functionality
  try {
    const { seedOfflineData } = await import('../common/utils/offlineSeeder');
    await seedOfflineData();
  } catch (error) {
    console.warn('Failed to seed offline data:', error);
  }
};
