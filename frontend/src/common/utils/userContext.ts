export function getCurrentUserId(): number | null {
    try {
        const persistedState = JSON.parse(localStorage.getItem('bloqedex-auth-storage') || '{}');
        if (persistedState?.state?.user?.id) {
            return Number(persistedState.state.user.id);
        }

        return null;
    } catch (error) {
        console.error('Failed to get current user ID:', error);
        return null;
    }
}

export function isOfflineAccount(): boolean {
    try {
        const persistedState = JSON.parse(localStorage.getItem('bloqedex-auth-storage') || '{}');
        return persistedState?.state?.isOfflineAccount === true;
    } catch (error) {
        console.error('Failed to check if offline account:', error);
        return false;
    }
}