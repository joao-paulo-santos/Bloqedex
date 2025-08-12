// Re-export feature stores
export { useAuthStore } from '../features/auth';
export { usePokemonStore } from '../features/pokemon';
export { usePokedexStore } from '../features/pokedex';

// App Global State Store
import { create } from 'zustand';
import { useAuthStore } from '../features/auth';
import { usePokemonStore } from '../features/pokemon';
import { authRepository } from '../infrastructure/repositories';
import { apiConfig } from '../config/api';
import { toastEvents } from '../common/utils/eventBus';
import { syncManager } from '../infrastructure/datasources/DataSourceIndex';

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
    const oldStatus = get().isOnline;
    set({ isOnline: status, lastHealthCheck: Date.now() });

    if (!oldStatus && status) {

      // Only sync pending actions if user has an online account
      // Offline accounts should only sync when explicitly converting to online
      import('../features/auth/stores/authStore').then(({ useAuthStore }) => {
        const authState = useAuthStore.getState();

        if (!authState.isOfflineAccount && authState.isAuthenticated) {
          syncManager.syncPendingActions().catch(error => {
            console.error('Failed to sync pending actions after reconnection:', error);
          });
        }
      }).catch(error => {
        console.error('Failed to check auth state for sync:', error);
      });
    }
  },

  updateLastSyncTime: () => {
    set({ lastSyncTime: Date.now() });
  },

  checkBackendHealth: async () => {
    try {
      const oldStatus = get().isOnline;
      const isHealthy = await authRepository.isOnline();
      get().setOnlineStatus(isHealthy);

      if (oldStatus !== isHealthy) {
        if (isHealthy) {
          toastEvents.showSuccess('Connected');
        } else {
          toastEvents.showWarning('Connection lost');
        }
      }
    } catch {
      const oldStatus = get().isOnline;
      get().setOnlineStatus(false);
      if (oldStatus !== false) {
        toastEvents.showWarning('Connection lost');
      }
    }
  },
}));

// Initialize function
let isInitialized = false;
let fillCacheRunning = false;

export const initializeStores = async () => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  // Load authentication state
  const authStore = useAuthStore.getState();
  await authStore.loadUser();

  // Initialize Pokemon store with cached data
  const pokemonStore = usePokemonStore.getState();
  await pokemonStore.initialize();

  // Get app store instance
  const appStore = useAppStore.getState();

  // Initial backend health check
  await appStore.checkBackendHealth();

  // Start periodic sync for offline actions
  syncManager.startPeriodicSync();

  // Set up periodic backend health checks using configured interval
  setInterval(() => {
    appStore.checkBackendHealth();
  }, apiConfig.healthCheckInterval);

  // Set up periodic pokemon fetch
  setInterval(() => {
    fillCacheFunc(false);
  }, apiConfig.autoFetchInterval);

  // Set up health check on window focus (when user returns to tab)
  window.addEventListener('focus', () => {
    appStore.checkBackendHealth();
  });
};

function fillCacheFunc(chain: boolean) {
  if (fillCacheRunning && !chain) return;
  fillCacheRunning = true;

  const pokemonStore = usePokemonStore.getState();
  const appStore = useAppStore.getState();

  if (appStore.isOnline && !pokemonStore.isLoading && !pokemonStore.hasAllPokemon()) {
    pokemonStore.fillCache().then(() => fillCacheFunc(true));
  } else {
    fillCacheRunning = false;
  }
}
