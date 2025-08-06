import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';

export const useOnlineStatus = () => {
    const { syncWithServer } = useAuthStore();
    const { isOnline, setupNetworkListeners } = useNetworkStore();

    useEffect(() => {
        // Set up network listeners
        const cleanup = setupNetworkListeners();

        return cleanup;
    }, [setupNetworkListeners]);

    // Sync with server when coming back online
    useEffect(() => {
        if (isOnline) {
            syncWithServer();
        }
    }, [isOnline, syncWithServer]);

    return isOnline;
};
