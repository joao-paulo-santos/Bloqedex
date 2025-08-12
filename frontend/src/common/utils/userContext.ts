export function getCurrentUserId(): number | string | null {
    try {
        const persistedState = JSON.parse(localStorage.getItem('bloqedex-auth-storage') || '{}');
        if (persistedState?.state?.user?.id) {
            return persistedState.state.user.id;
        }

        const token = localStorage.getItem('auth_token');
        if (token && token.startsWith('offline_')) {
            return token;
        }

        return null;
    } catch (error) {
        console.error('Failed to get current user ID:', error);
        return null;
    }
}

export function getUserIdFromToken(token: string): number | string | null {
    if (token.startsWith('offline_')) {
        return token;
    }

    try {
        const persistedState = JSON.parse(localStorage.getItem('bloqedx-auth-storage') || '{}');
        return persistedState?.state?.user?.id || null;
    } catch {
        return null;
    }
}
