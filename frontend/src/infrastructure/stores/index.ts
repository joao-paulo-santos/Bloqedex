// Re-export feature stores
export { useAuthStore } from '../../features/auth';
export { usePokemonStore } from '../../features/pokemon';
export { usePokedexStore } from '../../features/pokedex';

// App Global State Store
import { useAuthStore } from '../../features/auth';
import { usePokemonStore } from '../../features/pokemon';
import { apiConfig } from '../../config/api';


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
  await authStore.initialize();
  await authStore.checkBackendHealth();
  await authStore.loadUser();

  // Initialize Pokemon store with cached data
  const pokemonStore = usePokemonStore.getState();
  await pokemonStore.initialize();

  // Set up periodic backend health checks using configured interval
  setInterval(() => {
    authStore.checkBackendHealth();
  }, apiConfig.healthCheckInterval);

  // Set up periodic pokemon fetch
  const pokemonFetchInterval = setInterval(() => {
    burstPokemonCacheFill(false);
    if (pokemonStore.hasAllPokemon()) {
      clearInterval(pokemonFetchInterval);
    }
  }, apiConfig.autoFetchInterval);

  // Set up periodic offline action sync
  setInterval(() => {
    authStore.syncOfflineActions();
  }, apiConfig.offlineActionSyncInterval);

  // Set up health check on window focus (when user returns to tab)
  window.addEventListener('focus', () => {
    authStore.checkBackendHealth();
  });
};

function burstPokemonCacheFill(chain: boolean) {
  if (fillCacheRunning && !chain) return;
  fillCacheRunning = true;

  const pokemonStore = usePokemonStore.getState();
  const authStore = useAuthStore.getState();

  if (authStore.isOnline && !pokemonStore.isLoading && !pokemonStore.hasAllPokemon()) {
    pokemonStore.fillCache().then(() => burstPokemonCacheFill(true));
  } else {
    fillCacheRunning = false;
  }
}
