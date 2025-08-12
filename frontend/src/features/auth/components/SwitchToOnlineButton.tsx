import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../../../stores';
import { authEvents } from '../../../common/utils/eventBus';

export const SwitchToOnlineButton: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const { isAuthenticated, isOfflineAccount } = useAuthStore();
    const { isOnline } = useAppStore();

    const handleSwitchToOnline = () => {
        authEvents.openRegister();
    };

    if (!isAuthenticated || !isOfflineAccount || !isOnline) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={handleSwitchToOnline}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex items-center px-4 py-3 rounded-lg shadow-lg font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl"
            >
                <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
                <span className="text-sm">
                    {isHovered ? 'Create permanent account' : 'Switch to online account'}
                </span>
            </button>
        </div>
    );
};
