export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}
