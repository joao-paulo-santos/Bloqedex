'use client';

import React from 'react';
import Link from 'next/link';
import { useNetworkStore } from '@/stores/networkStore';
import { OnlineStatusIndicator } from '@/components/common/OnlineStatusIndicator';

export default function OfflinePage() {
    const { isOnline, isServerReachable } = useNetworkStore();
    const isFullyConnected = isOnline && isServerReachable;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
                <div className="flex flex-col items-center text-center">
                    <svg
                        className="w-20 h-20 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>

                    <h1 className="text-2xl font-bold text-gray-800 mb-2">You&apos;re offline</h1>
                    <p className="text-gray-600 mb-6">
                        {isOnline && !isServerReachable
                            ? "You&apos;re connected to the internet, but we can&apos;t reach our servers."
                            : "You&apos;re not connected to the internet."}
                    </p>

                    <OnlineStatusIndicator position="static" className="mb-6" />

                    {isFullyConnected ? (
                        <Link
                            href="/"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Return to home
                        </Link>
                    ) : (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
