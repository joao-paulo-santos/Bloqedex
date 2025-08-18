interface ApiConfig {
    baseUrl: string;
    timeout: number;
    healthCheckTimeout: number;
    healthCheckInterval: number;
    defaultPageSize: number;
    autoFetchInterval: number;
    cacheStaleThreshold: number;
    offlineActionSyncInterval: number;
}

const getApiConfig = (): ApiConfig => {
    // Default to development values
    const defaultConfig: ApiConfig = {
        baseUrl: 'http://localhost:5000/api/',
        timeout: 10000,
        healthCheckTimeout: 5000,
        healthCheckInterval: 5000,
        defaultPageSize: 30,
        autoFetchInterval: 1000,
        cacheStaleThreshold: 7 * 24 * 60 * 60 * 1000,
        offlineActionSyncInterval: 10000,
    };

    // Override with environment variables if available
    return {
        baseUrl: import.meta.env.VITE_API_BASE_URL || defaultConfig.baseUrl,
        timeout: Number(import.meta.env.VITE_API_TIMEOUT) || defaultConfig.timeout,
        healthCheckTimeout: Number(import.meta.env.VITE_API_HEALTH_TIMEOUT) || defaultConfig.healthCheckTimeout,
        healthCheckInterval: Number(import.meta.env.VITE_API_HEALTH_INTERVAL) || defaultConfig.healthCheckInterval,
        defaultPageSize: Number(import.meta.env.VITE_API_DEFAULT_PAGE_SIZE) || defaultConfig.defaultPageSize,
        autoFetchInterval: Number(import.meta.env.VITE_API_AUTO_FETCH_INTERVAL) || defaultConfig.autoFetchInterval,
        cacheStaleThreshold: Number(import.meta.env.VITE_CACHE_STALE_THRESHOLD) || defaultConfig.cacheStaleThreshold,
        offlineActionSyncInterval: Number(import.meta.env.VITE_OFFLINE_ACTION_SYNC_INTERVAL) || defaultConfig.offlineActionSyncInterval,
    };
};

export const apiConfig = getApiConfig();
