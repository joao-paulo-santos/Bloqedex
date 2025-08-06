import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NetworkState {
    isOnline: boolean;
    isServerReachable: boolean;
    lastOnlineAt: Date | null;
    lastOfflineAt: Date | null;

    // Actions
    setOnline: (isOnline: boolean) => void;
    setServerReachable: (isReachable: boolean) => void;
    checkConnection: () => Promise<boolean>;
    pingServer: () => Promise<boolean>;

    // Listeners
    setupNetworkListeners: () => () => void;
}

// Safe way to check for navigator and window
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
const getInitialOnlineState = () => isBrowser ? navigator.onLine : true;

// Server ping endpoint - this should be a lightweight endpoint on your server
const SERVER_PING_URL = '/api/ping';
// Fallback to root path if the ping endpoint is not available
const FALLBACK_PING_URL = '/';

export const useNetworkStore = create<NetworkState>()(
    persist(
        (set, get) => ({
            isOnline: getInitialOnlineState(),
            isServerReachable: true, // Assume server is reachable initially
            lastOnlineAt: getInitialOnlineState() ? new Date() : null,
            lastOfflineAt: !getInitialOnlineState() ? new Date() : null,

            setOnline: (isOnline: boolean) => {
                const timestamp = new Date();
                set({
                    isOnline,
                    lastOnlineAt: isOnline ? timestamp : get().lastOnlineAt,
                    lastOfflineAt: !isOnline ? timestamp : get().lastOfflineAt
                });

                // If device goes online, check server reachability
                if (isOnline) {
                    get().pingServer();
                } else {
                    // If device is offline, server is not reachable
                    set({ isServerReachable: false });
                }
            },

            setServerReachable: (isReachable: boolean) => {
                set({ isServerReachable: isReachable });
            },

            checkConnection: async () => {
                if (!isBrowser) return true;

                const isOnline = navigator.onLine;
                get().setOnline(isOnline);

                // Only ping the server if the device is online
                if (isOnline) {
                    await get().pingServer();
                }

                return isOnline && get().isServerReachable;
            },

            pingServer: async () => {
                if (!isBrowser || !get().isOnline) {
                    return false;
                }

                try {
                    // Try the ping endpoint first
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                    const response = await fetch(SERVER_PING_URL, {
                        method: 'HEAD',
                        cache: 'no-store',
                        signal: controller.signal
                    }).catch(() => {
                        // If ping endpoint fails, try the fallback URL
                        return fetch(FALLBACK_PING_URL, {
                            method: 'HEAD',
                            cache: 'no-store',
                            signal: controller.signal
                        });
                    });

                    clearTimeout(timeoutId);

                    const isReachable = response.ok;
                    get().setServerReachable(isReachable);
                    return isReachable;
                } catch (error) {
                    // Network error or timeout
                    get().setServerReachable(false);
                    return false;
                }
            },

            setupNetworkListeners: () => {
                if (!isBrowser) return () => { };

                // Initialize status based on current connection
                get().checkConnection();

                // Create handlers
                const handleOnline = () => {
                    get().setOnline(true);
                    // When coming back online, actively check if server is reachable
                    setTimeout(() => get().pingServer(), 1000);
                };

                const handleOffline = () => get().setOnline(false);

                // Set up periodic server ping when online
                const pingInterval = setInterval(() => {
                    if (get().isOnline) {
                        get().pingServer();
                    }
                }, 30000); // Check server every 30 seconds when online

                // Attach listeners
                window.addEventListener('online', handleOnline);
                window.addEventListener('offline', handleOffline);

                // Return cleanup function
                return () => {
                    window.removeEventListener('online', handleOnline);
                    window.removeEventListener('offline', handleOffline);
                    clearInterval(pingInterval);
                };
            },
        }),
        {
            name: 'network-status',
            partialize: (state) => ({
                isOnline: state.isOnline,
                isServerReachable: state.isServerReachable,
                lastOnlineAt: state.lastOnlineAt,
                lastOfflineAt: state.lastOfflineAt,
            }),
        }
    )
);
