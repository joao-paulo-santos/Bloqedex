import React, { useEffect, useState } from 'react';
import { eventBus } from '../../common/utils/eventBus';
import { Toast } from './Toast';

interface ToastData {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    useEffect(() => {
        const unsubscribeShow = eventBus.on('toast:show', (toastData) => {
            const id = Date.now().toString() + Math.random().toString(36);
            const newToast: ToastData = {
                id,
                message: toastData.message,
                type: toastData.type,
                duration: toastData.duration
            };

            setToasts(prev => [...prev, newToast]);
        });

        const unsubscribeDismiss = eventBus.on('toast:dismiss', (data) => {
            setToasts(prev => prev.filter(toast => toast.id !== data.id));
        });

        return () => {
            unsubscribeShow();
            unsubscribeDismiss();
        };
    }, []);

    const handleDismiss = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <div className="flex flex-col pointer-events-auto space-y-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onDismiss={handleDismiss}
                    />
                ))}
            </div>
        </div>
    );
};
