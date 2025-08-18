export interface IOfflineStorage {
    savePendingAction(action: OfflineAction): Promise<void>;
    getPendingActions(userId: number): Promise<OfflineAction[]>;
    clearPendingActions(userId: number): Promise<void>;
}

export interface OfflineAction {
    id: string;
    userId: number;
    type: 'catch' | 'release' | 'update' | 'bulk_catch' | 'bulk_release';
    payload: Record<string, unknown>;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
}