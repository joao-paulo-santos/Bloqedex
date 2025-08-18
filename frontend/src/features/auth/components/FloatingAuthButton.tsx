import React, { useState } from 'react';
import { useAuthStore } from '../../../infrastructure/stores';
import { authEvents } from '../../../common/utils/eventBus';

export const FloatingAuthButton: React.FC = () => {
    const [showOptions, setShowOptions] = useState(false);
    const { isOnline } = useAuthStore();

    const handleLoginClick = () => {
        setShowOptions(false);
        authEvents.openLogin();
    };

    const handleRegisterClick = () => {
        setShowOptions(false);
        authEvents.openRegister();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="relative">
                {/* Main Button */}
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center px-4 py-3 rounded-lg shadow-lg font-medium transition-all duration-200 bg-green-600 text-white hover:bg-green-700 hover:shadow-xl"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm">Start tracking your pokémons</span>
                    <svg
                        className={`w-4 h-4 ml-2 transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Options Menu */}
                {showOptions && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <button
                            onClick={isOnline ? handleLoginClick : undefined}
                            className={`block w-full px-4 py-3 text-sm transition-colors text-left ${isOnline
                                ? 'text-gray-700 hover:bg-gray-50'
                                : 'text-gray-400 cursor-not-allowed bg-gray-50'
                                }`}
                            disabled={!isOnline}
                        >
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <div>
                                    <div>Login</div>
                                    {!isOnline && (
                                        <div className="text-xs text-gray-400">Requires internet</div>
                                    )}
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={handleRegisterClick}
                            className="block w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100 text-left"
                        >
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <div>
                                    <div>Create Account</div>
                                    {!isOnline && (
                                        <div className="text-xs text-green-600">Works offline</div>
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Click outside handler */}
                {showOptions && (
                    <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setShowOptions(false)}
                    />
                )}
            </div>
        </div>
    );
};
