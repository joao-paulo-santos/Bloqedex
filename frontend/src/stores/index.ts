// Re-export feature stores
export { useAuthStore } from '../features/auth';
export { usePokemonStore } from '../features/pokemon';
export { usePokedexStore } from '../features/pokedex';

// App Global State Store
import { create } from 'zustand';
import { useAuthStore } from '../features/auth';

interface AppGlobalState {
  isOnline: boolean;
  lastSyncTime: number;
  setOnlineStatus: (status: boolean) => void;
  updateLastSyncTime: () => void;
}

export const useAppStore = create<AppGlobalState>((set) => ({
  isOnline: navigator.onLine,
  lastSyncTime: 0,

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
  },

  updateLastSyncTime: () => {
    set({ lastSyncTime: Date.now() });
  },
}));

// Initialize function
export const initializeStores = async () => {
  // Load authentication state
  const authStore = useAuthStore.getState();
  await authStore.loadUser();

  // Set up online/offline listeners
  const appStore = useAppStore.getState();

  window.addEventListener('online', () => {
    appStore.setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    appStore.setOnlineStatus(false);
  });

  // Check initial online status
  appStore.setOnlineStatus(navigator.onLine);

  // Seed offline data for initial app functionality
  try {
    const { seedOfflineData } = await import('../common/utils/offlineSeeder');
    await seedOfflineData();
  } catch (error) {
    console.warn('Failed to seed offline data:', error);
  }
};
