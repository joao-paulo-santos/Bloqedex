'use client';

import React, { useEffect } from 'react';
import { useNetworkStore } from '@/stores/networkStore';

interface OnlineStatusIndicatorProps {
    position?: 'fixed' | 'relative' | 'static';
    className?: string;
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
    position = 'fixed',
    className = '',
}) => {
    const { isOnline, isServerReachable, setupNetworkListeners, checkConnection } = useNetworkStore();

    // Initialize network listeners
    useEffect(() => {
        const cleanup = setupNetworkListeners();

        // Check connection immediately on component mount
        checkConnection();

        return cleanup;
    }, [setupNetworkListeners, checkConnection]);

    // Determine if fully connected (both online and server reachable)
    const isFullyConnected = isOnline && isServerReachable;

    // Determine status message
    let statusMessage = 'Offline';
    if (isFullyConnected) {
        statusMessage = 'Online';
    } else if (isOnline && !isServerReachable) {
        statusMessage = 'Server Unreachable';
    }

    // Positioning class based on props
    const positionClass = position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : '';

    return (
        <div className={`${positionClass} ${className}`}>
            <div
                className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm ${isFullyConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
            >
                <div
                    className={`w-2 h-2 rounded-full ${isFullyConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}
                />
                {statusMessage}
            </div>
        </div>
    );
};
