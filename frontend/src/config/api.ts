interface ApiConfig {
    baseUrl: string;
    timeout: number;
    healthCheckTimeout: number;
    healthCheckInterval: number;
}

const getApiConfig = (): ApiConfig => {
    // Default to development values
    const defaultConfig: ApiConfig = {
        baseUrl: 'http://localhost:5000/api/',
        timeout: 10000,
        healthCheckTimeout: 5000,
        healthCheckInterval: 5000,
    };

    // Override with environment variables if available
    return {
        baseUrl: import.meta.env.VITE_API_BASE_URL || defaultConfig.baseUrl,
        timeout: Number(import.meta.env.VITE_API_TIMEOUT) || defaultConfig.timeout,
        healthCheckTimeout: Number(import.meta.env.VITE_API_HEALTH_TIMEOUT) || defaultConfig.healthCheckTimeout,
        healthCheckInterval: Number(import.meta.env.VITE_API_HEALTH_INTERVAL) || defaultConfig.healthCheckInterval,
    };
};

export const apiConfig = getApiConfig();
