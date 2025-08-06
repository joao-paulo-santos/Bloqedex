import { useCallback, useEffect, useState } from 'react';

type CacheOptions = {
    expirationTimeInMinutes?: number;
};

// Default cache expiration time (24 hours)
const DEFAULT_EXPIRATION_TIME = 24 * 60; // minutes

export type CachedData<T> = {
    data: T;
    timestamp: number;
};

export const useLocalStorage = <T>(
    key: string,
    initialValue: T,
    options: CacheOptions = {}
) => {
    const { expirationTimeInMinutes = DEFAULT_EXPIRATION_TIME } = options;

    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);

            // Parse stored json or if none return initialValue
            if (item) {
                const cachedData = JSON.parse(item) as CachedData<T>;

                // Check if the cached data has expired
                const now = new Date().getTime();
                const expirationTime = expirationTimeInMinutes * 60 * 1000; // convert to milliseconds

                if (now - cachedData.timestamp < expirationTime) {
                    return cachedData.data;
                }
            }
            return initialValue;
        } catch (error) {
            // If error also return initialValue
            console.error('Error reading from localStorage:', error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                const cachedData: CachedData<T> = {
                    data: valueToStore,
                    timestamp: new Date().getTime(),
                };
                window.localStorage.setItem(key, JSON.stringify(cachedData));
            }
        } catch (error) {
            // A more advanced implementation would handle the error case
            console.error('Error writing to localStorage:', error);
        }
    }, [key, storedValue]);

    // Subscribe to changes in localStorage
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    const cachedData = JSON.parse(e.newValue) as CachedData<T>;
                    setStoredValue(cachedData.data);
                } catch (error) {
                    console.error('Error parsing localStorage change:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue] as const;
};

// Utility function to clear expired items from local storage
export const clearExpiredCacheItems = (
    expirationTimeInMinutes: number = DEFAULT_EXPIRATION_TIME
): void => {
    if (typeof window === 'undefined') return;

    const now = new Date().getTime();
    const expirationTime = expirationTimeInMinutes * 60 * 1000; // convert to milliseconds

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            try {
                const item = localStorage.getItem(key);
                if (item) {
                    const cachedData = JSON.parse(item) as CachedData<unknown>;
                    if (now - cachedData.timestamp > expirationTime) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (_error) {
                // Skip items that are not in our cache format
                continue;
            }
        }
    }
};
