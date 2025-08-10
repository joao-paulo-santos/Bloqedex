import { OfflineIcon } from './Icons';

export const OfflineIndicator = () => {
    return (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
            <OfflineIcon size={16} />
            <span>You're offline. Some features may be limited.</span>
        </div>
    );
};
