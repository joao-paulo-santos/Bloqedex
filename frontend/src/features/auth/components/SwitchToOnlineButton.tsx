import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../../../infrastructure/stores';
import { authEvents } from '../../../common/utils/eventBus';
import { RefreshIcon } from '../../../components/common/Icons';

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
                <RefreshIcon size={20} className="mr-2" />
                <span className="text-sm">
                    {isHovered ? 'Create permanent account' : 'Switch to online account'}
                </span>
            </button>
        </div>
    );
};
