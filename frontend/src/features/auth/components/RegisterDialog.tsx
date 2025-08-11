import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../../../stores';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { XIcon } from '../../../components/common/Icons';

interface RegisterDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

export const RegisterDialog: React.FC<RegisterDialogProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuthStore();
    const { isOnline } = useAppStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Only validate password when online
        if (isOnline) {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
        }

        setIsLoading(true);

        try {
            // Pass appropriate parameters based on online status
            if (isOnline) {
                await register(username, email, password);
            } else {
                // For offline accounts, only pass username
                await register(username, '', '');
            }
            onClose();
            // Reset form
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Background overlay */}
            <div className="fixed inset-0 backdrop-blur-[2px] bg-black/10 transition-opacity" onClick={onClose}></div>

            {/* Dialog container */}
            <div className="flex items-center justify-center min-h-screen p-4">
                {/* Dialog */}
                <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full z-10">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">
                                {isOnline ? 'Create Your Account' : 'Create Offline Account'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XIcon size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            {!isOnline && (
                                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                                    <p><strong>Creating offline account:</strong> You can start using the app immediately. When you go online later, you'll be able to add email/password and sync your data.</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Username {!isOnline && <span className="text-xs text-gray-500">(can be changed later)</span>}
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {isOnline && (
                                <>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                            disabled={isLoading}
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex items-center justify-between pt-4">
                                {isOnline && (
                                    <button
                                        type="button"
                                        onClick={onSwitchToLogin}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                        disabled={isLoading}
                                    >
                                        Already have an account? Sign in
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${!isOnline ? 'ml-auto' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
