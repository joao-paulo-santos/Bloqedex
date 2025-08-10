export interface IOfflineStorage {
    isOnline(): Promise<boolean>;
    savePendingAction(action: OfflineAction): Promise<void>;
    getPendingActions(): Promise<OfflineAction[]>;
    clearPendingActions(): Promise<void>;
    syncWhenOnline(): Promise<void>;
}

export interface OfflineAction {
    id: string;
    type: 'catch' | 'release' | 'update' | 'bulk_catch' | 'bulk_release';
    payload: Record<string, unknown>;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
}
