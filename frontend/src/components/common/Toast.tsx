import React, { useEffect, useState } from 'react';

interface ToastProps {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
    id,
    message,
    type,
    duration = 5000,
    onDismiss
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Progress bar animation - track progress based on this specific toast's start time
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const newProgress = (remaining / duration) * 100;

            setProgress(newProgress);

            // If time is up, dismiss this specific toast
            if (remaining <= 0) {
                setIsVisible(false);
                setTimeout(() => onDismiss(id), 300);
            }
        }, 50); // Update every 50ms for smoother animation

        return () => {
            clearInterval(interval);
        };
    }, [startTime, duration, id, onDismiss]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-500 border-green-600';
            case 'error':
                return 'bg-red-500 border-red-600';
            case 'warning':
                return 'bg-yellow-500 border-yellow-600';
            case 'info':
                return 'bg-blue-500 border-blue-600';
            default:
                return 'bg-gray-500 border-gray-600';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            default:
                return '';
        }
    };

    return (
        <div
            className={`
                relative overflow-hidden
                rounded-lg shadow-lg border-l-4 text-white
                transform transition-all duration-300 ease-in-out
                ${getTypeStyles()}
                ${isVisible
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
                }
                min-w-80 max-w-md
            `}
        >
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                    <span className="text-lg mr-3">{getIcon()}</span>
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="ml-4 text-white hover:text-gray-200 transition-colors"
                    aria-label="Close toast"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20">
                <div
                    className="h-full bg-white bg-opacity-60 transition-all ease-linear"
                    style={{
                        width: `${progress}%`,
                        transitionDuration: '100ms'
                    }}
                />
            </div>
        </div>
    );
};
