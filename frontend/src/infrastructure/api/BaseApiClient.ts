import axios, { type AxiosInstance } from 'axios';
import { indexedDBStorage } from '../storage/IndexedDBStorage';
import { apiConfig } from '../../config/api';

export class BaseApiClient {
    protected client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: apiConfig.baseUrl,
            timeout: apiConfig.timeout,
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor to add auth token
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.clearAuth();
                    // Use EventBus instead of window.location for better UX
                    console.warn('Authentication expired - please log in again');
                }
                return Promise.reject(error);
            }
        );
    }

    // Network status check
    async isOnline(): Promise<boolean> {
        if (!navigator.onLine) return false;

        try {
            await this.client.get('/health', { timeout: apiConfig.healthCheckTimeout });
            return true;
        } catch {
            return false;
        }
    }

    // Cache helpers
    protected async getCachedData<T>(key: string): Promise<T | null> {
        return await indexedDBStorage.getCache<T>(key);
    }

    protected async setCachedData<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
        await indexedDBStorage.setCache(key, data, ttl);
    }

    protected clearAuth(): void {
        localStorage.removeItem('auth_token');
    }
}
