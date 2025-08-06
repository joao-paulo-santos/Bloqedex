'use client';

import { useEffect, useState } from 'react';
import { useNetworkStore } from '@/stores/networkStore';
import Link from 'next/link';
import { OnlineStatusIndicator } from '@/components/common/OnlineStatusIndicator';
import InstallPWA from '@/components/common/InstallPWA';

export default function PwaTestPage() {
    const { isOnline, isServerReachable, checkConnection, pingServer, setServerReachable, setOnline } = useNetworkStore();
    const [isInstalled, setIsInstalled] = useState(false);
    const [apiResponse, setApiResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [forcedOfflineMode, setForcedOfflineMode] = useState(false);
    const [forcedServerUnreachableMode, setForcedServerUnreachableMode] = useState(false);

    useEffect(() => {
        // Check if the app is already installed
        if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        // Check connection immediately
        checkConnection();

        window.addEventListener('appinstalled', () => setIsInstalled(true));

        return () => {
            window.removeEventListener('appinstalled', () => setIsInstalled(true));
        };
    }, [checkConnection]);

    // Effect for forced offline mode
    useEffect(() => {
        if (forcedOfflineMode) {
            setOnline(false);
        } else if (!forcedOfflineMode && navigator.onLine) {
            setOnline(true);
        }
    }, [forcedOfflineMode, setOnline]);

    // Effect for forced server unreachable mode
    useEffect(() => {
        if (forcedServerUnreachableMode) {
            setServerReachable(false);
        } else if (!forcedServerUnreachableMode) {
            // Only ping if not forcing unreachable state
            pingServer();
        }
    }, [forcedServerUnreachableMode, pingServer, setServerReachable]);

    const testServerPing = async () => {
        if (forcedServerUnreachableMode) {
            setApiResponse("Server ping result: Failed (forced unreachable mode)");
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        try {
            const isReachable = await pingServer();
            setApiResponse(`Server ping result: ${isReachable ? 'Successful' : 'Failed'}`);
        } catch (error) {
            setErrorMessage('Error while pinging server');
            console.error('Error pinging server:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const testApiCall = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const response = await fetch('/api/ping');
            if (response.ok) {
                const data = await response.json();
                setApiResponse(JSON.stringify(data, null, 2));
            } else {
                setErrorMessage(`API returned status: ${response.status}`);
            }
        } catch (error) {
            setErrorMessage('Error making API call');
            console.error('Error making API call:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">PWA Features Test</h1>

            <div className="space-y-8">
                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Test Controls</h2>
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={forcedOfflineMode}
                                    onChange={() => setForcedOfflineMode(!forcedOfflineMode)}
                                    className="form-checkbox h-5 w-5"
                                />
                                <span>Simulate Offline Mode</span>
                            </label>
                        </div>

                        <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={forcedServerUnreachableMode}
                                    onChange={() => setForcedServerUnreachableMode(!forcedServerUnreachableMode)}
                                    className="form-checkbox h-5 w-5"
                                />
                                <span>Simulate Server Unreachable</span>
                            </label>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
                            <p className="font-medium text-yellow-700">Testing Tips:</p>
                            <ul className="list-disc pl-5 mt-1 text-yellow-600">
                                <li>Use these toggles to simulate network conditions</li>
                                <li>You can also use DevTools Network panel&apos;s &quot;Offline&quot; checkbox</li>
                                <li>For realistic testing, try actually disconnecting your network</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Network Status</h2>
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                            <OnlineStatusIndicator position="static" />
                        </div>
                        <div className="flex flex-col">
                            <p>Device Online: <strong>{isOnline ? 'Yes' : 'No'}</strong></p>
                            <p>Server Reachable: <strong>{isServerReachable ? 'Yes' : 'No'}</strong></p>
                            {forcedOfflineMode && <p className="text-orange-500">* Offline mode forced via test controls</p>}
                            {forcedServerUnreachableMode && <p className="text-orange-500">* Server unreachable mode forced via test controls</p>}
                        </div>

                        <div className="flex space-x-4 mt-2">
                            <button
                                onClick={testServerPing}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Testing...' : 'Test Server Connection'}
                            </button>
                            <button
                                onClick={() => checkConnection()}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                                disabled={isLoading}
                            >
                                Refresh Status
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">API Test</h2>
                    <div className="flex flex-col space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Test calling the API endpoint while online and offline to see caching behavior.
                        </p>
                        <button
                            onClick={testApiCall}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition w-fit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Fetching...' : 'Test API Call'}
                        </button>

                        {errorMessage && (
                            <div className="p-4 bg-red-100 text-red-800 rounded">
                                {errorMessage}
                            </div>
                        )}

                        {apiResponse && (
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                                <pre className="whitespace-pre-wrap break-words">{apiResponse}</pre>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Navigation Test</h2>
                    <p className="mb-4">
                        Click these links to test navigation between pages in online and offline mode:
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/" className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition">
                            Home
                        </Link>
                        <Link href="/pokedex" className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition">
                            Pokédex
                        </Link>
                        <Link href="/offline" className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition">
                            Offline Page
                        </Link>
                        <Link href="/non-existent-page" className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition">
                            Non-existent Page
                        </Link>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Installation</h2>
                    {isInstalled ? (
                        <p>App is installed! You&apos;re using it in standalone mode.</p>
                    ) : (
                        <div>
                            <p className="mb-4">
                                Install this app on your device for a better experience and offline access.
                            </p>
                            <InstallPWA />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
