import axios, { type AxiosInstance } from 'axios';
import { apiConfig } from '../../../config/api';
import { useAppStore } from '../../../stores';
import { isNetworkError } from '../../../common/utils/networkHelpers';
import { API_PATHS } from '../../../config/uriPaths';

export class BaseDataSource {
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

    // Network status check - uses cached status from app store
    isOnline(): boolean {
        if (!navigator.onLine) return false;

        const appStore = useAppStore.getState();
        return appStore.isOnline;
    }

    // Network error detection helper
    protected isNetworkError(error: unknown): boolean {
        return isNetworkError(error);
    }

    // Health check method for the background service only
    async checkHealth(): Promise<boolean> {
        if (!navigator.onLine) return false;

        try {
            const healthClient = axios.create({
                baseURL: apiConfig.baseUrl,
                timeout: apiConfig.healthCheckTimeout,
                validateStatus: () => true,
            });

            const response = await healthClient.get(API_PATHS.SYSTEM.HEALTH);
            return response.status >= 200 && response.status < 300;
        } catch {
            return false;
        }
    }

    protected clearAuth(): void {
        localStorage.removeItem('auth_token');
    }
}
