import React from 'react';

interface OfflineAccountWarningProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmLogout: () => void;
    username: string;
}

export const OfflineAccountWarning: React.FC<OfflineAccountWarningProps> = ({
    isOpen,
    onClose,
    onConfirmLogout,
    username
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 backdrop-blur-[2px] bg-black/10 transition-opacity" onClick={onClose}></div>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full z-10" onClick={e => e.stopPropagation()}>
                    <div className="p-6">
                        {/* Warning Icon */}
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>

                        {/* Header */}
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                            Logout Warning
                        </h3>

                        {/* Content */}
                        <div className="text-sm text-gray-600 space-y-3 mb-6">
                            <p>
                                <strong>{username}</strong>, you're currently using an offline account that hasn't been switched to an online account yet.
                            </p>
                            <p>
                                <strong className="text-amber-700">⚠️ If you logout now:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                                <li>Your offline account will be removed</li>
                                <li>Your Pokédex progress will be lost</li>
                                <li>Your caught Pokémon data will be deleted</li>
                            </ul>
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                                <p className="text-blue-800 text-sm">
                                    <strong>💡 Recommendation:</strong> Use the "Switch to online account" button instead to keep your progress while creating a permanent account.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmLogout}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Logout Anyway
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
