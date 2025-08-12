import axios, { type AxiosInstance } from 'axios';
import { apiConfig } from '../../config/api';
import { useAppStore } from '../../stores';

export const extractErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: Record<string, unknown> } };
        const data = axiosError.response?.data;

        if (data) {
            if (data.errors && typeof data.errors === 'object') {
                const errorMessages = [];
                for (const [, messages] of Object.entries(data.errors)) {
                    if (Array.isArray(messages)) {
                        errorMessages.push(...messages);
                    } else if (typeof messages === 'string') {
                        errorMessages.push(messages);
                    }
                }
                if (errorMessages.length > 0) {
                    return errorMessages[0];
                }
            }

            if (typeof data.message === 'string') {
                return data.message;
            }

            if (typeof data.title === 'string') {
                return data.title;
            }

            if (typeof data.error === 'string') {
                return data.error;
            }

            if (typeof data.detail === 'string') {
                return data.detail;
            }

            if (typeof data === 'string') {
                return data;
            }
        }
    }

    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }

    return 'An unexpected error occurred';
};

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

    // Network status check - uses cached status from app store
    isOnline(): boolean {
        if (!navigator.onLine) return false;

        const appStore = useAppStore.getState();
        return appStore.isOnline;
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

            const response = await healthClient.get('/health');
            return response.status >= 200 && response.status < 300;
        } catch {
            return false;
        }
    }

    protected clearAuth(): void {
        localStorage.removeItem('auth_token');
    }
}
