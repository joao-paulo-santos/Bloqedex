// Event system for decoupled component communication
// Benefits over Zustand for UI interactions:
// 1. No state bloat - UI actions don't persist in store
// 2. Loose coupling - components don't need to know about each other
// 3. Scalable - easy to add new events without touching global state
// 4. Performance - no unnecessary re-renders from state changes

import type { User } from '../../core/types';

type EventMap = {
    // Auth Events
    'auth:openLogin': void;
    'auth:openRegister': void;
    'auth:closeDialogs': void;
    'auth:login': { userId: number; user: User };
    'auth:logout': { isOfflineAccount: boolean; userId?: number };

    // Toast Events
    'toast:show': {
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
    };
    'toast:dismiss': { id: string };

    // Pokemon Events
    'pokemon:caught': { pokeApiId: number };
    'pokemon:released': { pokeApiId: number };
    'pokemon:bulk-caught': { pokeApiIds: number[] };
    'pokemon:bulk-released': { pokeApiIds: number[] };
    'pokemon:refresh-caught-status': { caughtPokemon: Array<{ pokemon: { pokeApiId: number } }> };

    // Future event examples 
    // 'notification:show': { message: string; type: 'success' | 'error' | 'info' };
    // 'modal:open': { modalId: string; data?: any };
    // 'search:focus': void;
    // 'theme:toggle': void;
};

class EventBus {
    private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

    on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
        if (!this.listeners.has(event as string)) {
            this.listeners.set(event as string, new Set());
        }
        this.listeners.get(event as string)!.add(callback as (data: unknown) => void);

        // Return cleanup function
        return () => this.off(event, callback);
    }

    off<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
        const eventListeners = this.listeners.get(event as string);
        if (eventListeners) {
            eventListeners.delete(callback as (data: unknown) => void);
        }
    }

    emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
        const eventListeners = this.listeners.get(event as string);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }

    // Helper for void events
    emitVoid<K extends keyof EventMap>(event: K) {
        this.emit(event, undefined as EventMap[K]);
    }
}

export const eventBus = new EventBus();

// Helper functions for common actions
export const authEvents = {
    openLogin: () => eventBus.emitVoid('auth:openLogin'),
    openRegister: () => eventBus.emitVoid('auth:openRegister'),
    closeDialogs: () => eventBus.emitVoid('auth:closeDialogs'),
};

export const toastEvents = {
    showSuccess: (message: string, duration?: number) =>
        eventBus.emit('toast:show', { message, type: 'success', duration }),
    showError: (message: string, duration?: number) =>
        eventBus.emit('toast:show', { message, type: 'error', duration }),
    showWarning: (message: string, duration?: number) =>
        eventBus.emit('toast:show', { message, type: 'warning', duration }),
    showInfo: (message: string, duration?: number) =>
        eventBus.emit('toast:show', { message, type: 'info', duration }),
    dismiss: (id: string) => eventBus.emit('toast:dismiss', { id }),
};
