import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus, authEvents, toastEvents } from './eventBus';

describe('EventBus', () => {
    beforeEach(() => {
        // Clear all listeners before each test to ensure isolation
        eventBus['listeners'].clear();
    });

    describe('Basic Event Operations', () => {
        it('should register and emit events with data', () => {
            const mockCallback = vi.fn();

            eventBus.on('toast:show', mockCallback);
            eventBus.emit('toast:show', {
                message: 'Test message',
                type: 'success'
            });

            expect(mockCallback).toHaveBeenCalledOnce();
            expect(mockCallback).toHaveBeenCalledWith({
                message: 'Test message',
                type: 'success'
            });
        });

        it('should register and emit void events', () => {
            const mockCallback = vi.fn();

            eventBus.on('auth:openLogin', mockCallback);
            eventBus.emitVoid('auth:openLogin');

            expect(mockCallback).toHaveBeenCalledOnce();
            expect(mockCallback).toHaveBeenCalledWith(undefined);
        });

        it('should handle multiple listeners for the same event', () => {
            const mockCallback1 = vi.fn();
            const mockCallback2 = vi.fn();
            const mockCallback3 = vi.fn();

            eventBus.on('auth:openLogin', mockCallback1);
            eventBus.on('auth:openLogin', mockCallback2);
            eventBus.on('auth:openLogin', mockCallback3);

            eventBus.emitVoid('auth:openLogin');

            expect(mockCallback1).toHaveBeenCalledOnce();
            expect(mockCallback2).toHaveBeenCalledOnce();
            expect(mockCallback3).toHaveBeenCalledOnce();
        });

        it('should not fail when emitting events with no listeners', () => {
            expect(() => {
                eventBus.emit('toast:show', { message: 'Test', type: 'info' });
                eventBus.emitVoid('auth:openLogin');
            }).not.toThrow();
        });

        it('should prevent duplicate listeners', () => {
            const mockCallback = vi.fn();

            // Register the same callback multiple times
            eventBus.on('auth:openLogin', mockCallback);
            eventBus.on('auth:openLogin', mockCallback);
            eventBus.on('auth:openLogin', mockCallback);

            eventBus.emitVoid('auth:openLogin');

            // Should only be called once due to Set deduplication
            expect(mockCallback).toHaveBeenCalledOnce();
        });
    });

    describe('Event Removal', () => {
        it('should remove listeners using off method', () => {
            const mockCallback = vi.fn();

            eventBus.on('auth:openLogin', mockCallback);
            eventBus.off('auth:openLogin', mockCallback);
            eventBus.emitVoid('auth:openLogin');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should remove listeners using cleanup function', () => {
            const mockCallback = vi.fn();

            const cleanup = eventBus.on('auth:openLogin', mockCallback);
            cleanup();
            eventBus.emitVoid('auth:openLogin');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should only remove the specific listener', () => {
            const mockCallback1 = vi.fn();
            const mockCallback2 = vi.fn();

            eventBus.on('auth:openLogin', mockCallback1);
            const cleanup2 = eventBus.on('auth:openLogin', mockCallback2);

            cleanup2(); // Remove only the second callback
            eventBus.emitVoid('auth:openLogin');

            expect(mockCallback1).toHaveBeenCalledOnce();
            expect(mockCallback2).not.toHaveBeenCalled();
        });

        it('should handle removing non-existent listeners gracefully', () => {
            const mockCallback = vi.fn();

            expect(() => {
                eventBus.off('auth:openLogin', mockCallback);
            }).not.toThrow();
        });
    });

    describe('Event Isolation', () => {
        it('should not trigger listeners for different events', () => {
            const authCallback = vi.fn();
            const toastCallback = vi.fn();

            eventBus.on('auth:openLogin', authCallback);
            eventBus.on('toast:show', toastCallback);

            eventBus.emitVoid('auth:openLogin');

            expect(authCallback).toHaveBeenCalledOnce();
            expect(toastCallback).not.toHaveBeenCalled();
        });

        it('should handle similar event names correctly', () => {
            const loginCallback = vi.fn();
            const registerCallback = vi.fn();

            eventBus.on('auth:openLogin', loginCallback);
            eventBus.on('auth:openRegister', registerCallback);

            eventBus.emitVoid('auth:openLogin');

            expect(loginCallback).toHaveBeenCalledOnce();
            expect(registerCallback).not.toHaveBeenCalled();
        });
    });

    describe('Memory Management', () => {
        it('should clean up listeners to prevent memory leaks', () => {
            const mockCallback = vi.fn();

            const cleanup = eventBus.on('auth:openLogin', mockCallback);

            // Verify listener is registered
            expect(eventBus['listeners'].get('auth:openLogin')?.size).toBe(1);

            cleanup();

            // Verify listener is removed
            expect(eventBus['listeners'].get('auth:openLogin')?.size).toBe(0);
        });

        it('should handle multiple cleanups of the same listener', () => {
            const mockCallback = vi.fn();

            const cleanup = eventBus.on('auth:openLogin', mockCallback);

            expect(() => {
                cleanup();
                cleanup(); // Second cleanup should not throw
            }).not.toThrow();
        });
    });
});

describe('Auth Helper Functions', () => {
    beforeEach(() => {
        eventBus['listeners'].clear();
    });

    it('should trigger openLogin event', () => {
        const mockCallback = vi.fn();

        eventBus.on('auth:openLogin', mockCallback);
        authEvents.openLogin();

        expect(mockCallback).toHaveBeenCalledOnce();
        expect(mockCallback).toHaveBeenCalledWith(undefined);
    });

    it('should trigger openRegister event', () => {
        const mockCallback = vi.fn();

        eventBus.on('auth:openRegister', mockCallback);
        authEvents.openRegister();

        expect(mockCallback).toHaveBeenCalledOnce();
    });

    it('should trigger closeDialogs event', () => {
        const mockCallback = vi.fn();

        eventBus.on('auth:closeDialogs', mockCallback);
        authEvents.closeDialogs();

        expect(mockCallback).toHaveBeenCalledOnce();
    });
});

describe('Toast Helper Functions', () => {
    beforeEach(() => {
        eventBus['listeners'].clear();
    });

    it('should show success toast with correct data', () => {
        const mockCallback = vi.fn();

        eventBus.on('toast:show', mockCallback);
        toastEvents.showSuccess('Success message', 5000);

        expect(mockCallback).toHaveBeenCalledWith({
            message: 'Success message',
            type: 'success',
            duration: 5000
        });
    });

    it('should show error toast with default duration', () => {
        const mockCallback = vi.fn();

        eventBus.on('toast:show', mockCallback);
        toastEvents.showError('Error message');

        expect(mockCallback).toHaveBeenCalledWith({
            message: 'Error message',
            type: 'error',
            duration: undefined
        });
    });

    it('should show warning toast', () => {
        const mockCallback = vi.fn();

        eventBus.on('toast:show', mockCallback);
        toastEvents.showWarning('Warning message', 3000);

        expect(mockCallback).toHaveBeenCalledWith({
            message: 'Warning message',
            type: 'warning',
            duration: 3000
        });
    });

    it('should show info toast', () => {
        const mockCallback = vi.fn();

        eventBus.on('toast:show', mockCallback);
        toastEvents.showInfo('Info message');

        expect(mockCallback).toHaveBeenCalledWith({
            message: 'Info message',
            type: 'info',
            duration: undefined
        });
    });

    it('should dismiss toast with correct id', () => {
        const mockCallback = vi.fn();

        eventBus.on('toast:dismiss', mockCallback);
        toastEvents.dismiss('toast-123');

        expect(mockCallback).toHaveBeenCalledWith({ id: 'toast-123' });
    });
});

describe('Real-world Usage Scenarios', () => {
    beforeEach(() => {
        eventBus['listeners'].clear();
    });

    it('should handle component mounting and unmounting pattern', () => {
        const mockCallback = vi.fn();

        // Simulate component mount
        const cleanup = eventBus.on('auth:openLogin', mockCallback);

        // Simulate user interaction
        authEvents.openLogin();
        expect(mockCallback).toHaveBeenCalledOnce();

        // Simulate component unmount
        cleanup();

        // Event after unmount should not trigger callback
        authEvents.openLogin();
        expect(mockCallback).toHaveBeenCalledOnce(); // Still only once
    });

    it('should handle multiple components listening to the same event', () => {
        const dialogCallback = vi.fn();
        const analyticsCallback = vi.fn();
        const loggerCallback = vi.fn();

        // Multiple components interested in login events
        eventBus.on('auth:openLogin', dialogCallback);
        eventBus.on('auth:openLogin', analyticsCallback);
        eventBus.on('auth:openLogin', loggerCallback);

        authEvents.openLogin();

        expect(dialogCallback).toHaveBeenCalledOnce();
        expect(analyticsCallback).toHaveBeenCalledOnce();
        expect(loggerCallback).toHaveBeenCalledOnce();
    });

    it('should handle rapid event emissions', () => {
        const mockCallback = vi.fn();

        eventBus.on('toast:show', mockCallback);

        // Rapid fire toast events
        toastEvents.showSuccess('Message 1');
        toastEvents.showError('Message 2');
        toastEvents.showWarning('Message 3');
        toastEvents.showInfo('Message 4');

        expect(mockCallback).toHaveBeenCalledTimes(4);
        expect(mockCallback).toHaveBeenNthCalledWith(1, {
            message: 'Message 1',
            type: 'success',
            duration: undefined
        });
        expect(mockCallback).toHaveBeenNthCalledWith(4, {
            message: 'Message 4',
            type: 'info',
            duration: undefined
        });
    });

    it('should handle event chaining scenarios', () => {
        const step1Callback = vi.fn();
        const step2Callback = vi.fn();
        const step3Callback = vi.fn();

        // Chain events: login -> success toast -> close dialogs
        eventBus.on('auth:openLogin', step1Callback);
        eventBus.on('toast:show', step2Callback);
        eventBus.on('auth:closeDialogs', step3Callback);

        // Simulate event chain
        authEvents.openLogin();
        toastEvents.showSuccess('Login successful');
        authEvents.closeDialogs();

        expect(step1Callback).toHaveBeenCalledOnce();
        expect(step2Callback).toHaveBeenCalledOnce();
        expect(step3Callback).toHaveBeenCalledOnce();
    });

    describe('Pokemon Events', () => {
        it('should emit and handle pokemon:caught event', () => {
            const mockCallback = vi.fn();

            eventBus.on('pokemon:caught', mockCallback);
            eventBus.emit('pokemon:caught', { pokeApiId: 25 });

            expect(mockCallback).toHaveBeenCalledOnce();
            expect(mockCallback).toHaveBeenCalledWith({ pokeApiId: 25 });
        });

        it('should emit and handle pokemon:released event', () => {
            const mockCallback = vi.fn();

            eventBus.on('pokemon:released', mockCallback);
            eventBus.emit('pokemon:released', { pokeApiId: 26 });

            expect(mockCallback).toHaveBeenCalledOnce();
            expect(mockCallback).toHaveBeenCalledWith({ pokeApiId: 26 });
        });

        it('should emit and handle pokemon:bulk-caught event', () => {
            const mockCallback = vi.fn();
            const pokeApiIds = [1, 4, 7, 150];

            eventBus.on('pokemon:bulk-caught', mockCallback);
            eventBus.emit('pokemon:bulk-caught', { pokeApiIds });

            expect(mockCallback).toHaveBeenCalledOnce();
            expect(mockCallback).toHaveBeenCalledWith({ pokeApiIds });
        });

        it('should emit and handle pokemon:bulk-released event', () => {
            const mockCallback = vi.fn();
            const pokeApiIds = [25, 26, 27];

            eventBus.on('pokemon:bulk-released', mockCallback);
            eventBus.emit('pokemon:bulk-released', { pokeApiIds });

            expect(mockCallback).toHaveBeenCalledOnce();
            expect(mockCallback).toHaveBeenCalledWith({ pokeApiIds });
        });

        it('should emit and handle pokemon:refresh-caught-status event', () => {
            const mockCallback = vi.fn();
            const caughtPokemon = [
                { pokemon: { pokeApiId: 1 } },
                { pokemon: { pokeApiId: 4 } },
                { pokemon: { pokeApiId: 7 } }
            ];

            eventBus.on('pokemon:refresh-caught-status', mockCallback);
            eventBus.emit('pokemon:refresh-caught-status', { caughtPokemon });

            expect(mockCallback).toHaveBeenCalledOnce();
            expect(mockCallback).toHaveBeenCalledWith({ caughtPokemon });
        });

        it('should handle multiple pokemon events simultaneously', () => {
            const caughtCallback = vi.fn();
            const releasedCallback = vi.fn();
            const bulkCaughtCallback = vi.fn();

            eventBus.on('pokemon:caught', caughtCallback);
            eventBus.on('pokemon:released', releasedCallback);
            eventBus.on('pokemon:bulk-caught', bulkCaughtCallback);

            // Emit multiple pokemon events
            eventBus.emit('pokemon:caught', { pokeApiId: 25 });
            eventBus.emit('pokemon:released', { pokeApiId: 26 });
            eventBus.emit('pokemon:bulk-caught', { pokeApiIds: [1, 2, 3] });

            expect(caughtCallback).toHaveBeenCalledWith({ pokeApiId: 25 });
            expect(releasedCallback).toHaveBeenCalledWith({ pokeApiId: 26 });
            expect(bulkCaughtCallback).toHaveBeenCalledWith({ pokeApiIds: [1, 2, 3] });
        });

        it('should validate pokemon event data types', () => {
            const caughtCallback = vi.fn();
            const bulkCallback = vi.fn();

            eventBus.on('pokemon:caught', caughtCallback);
            eventBus.on('pokemon:bulk-caught', bulkCallback);

            // Test with proper data types
            eventBus.emit('pokemon:caught', { pokeApiId: 150 });
            eventBus.emit('pokemon:bulk-caught', { pokeApiIds: [1, 2, 3] });

            expect(caughtCallback).toHaveBeenCalledWith({ pokeApiId: 150 });
            expect(bulkCallback).toHaveBeenCalledWith({ pokeApiIds: [1, 2, 3] });
        });

        it('should handle pokemon event cleanup properly', () => {
            const mockCallback = vi.fn();

            const cleanup = eventBus.on('pokemon:caught', mockCallback);

            // Event should work before cleanup
            eventBus.emit('pokemon:caught', { pokeApiId: 25 });
            expect(mockCallback).toHaveBeenCalledTimes(1);

            // Cleanup and verify event no longer triggers
            cleanup();
            eventBus.emit('pokemon:caught', { pokeApiId: 26 });
            expect(mockCallback).toHaveBeenCalledTimes(1); // Should not increase
        });
    });

    describe('Cross-Feature Event Integration', () => {
        it('should handle auth logout triggering pokemon data clearing', () => {
            const authCallback = vi.fn();
            const pokemonCallback = vi.fn();

            eventBus.on('auth:logout', authCallback);
            eventBus.on('pokemon:refresh-caught-status', pokemonCallback);

            // Simulate logout followed by pokemon data refresh
            eventBus.emit('auth:logout', { isOfflineAccount: false, userId: 1 });
            eventBus.emit('pokemon:refresh-caught-status', { caughtPokemon: [] });

            expect(authCallback).toHaveBeenCalledWith({ isOfflineAccount: false, userId: 1 });
            expect(pokemonCallback).toHaveBeenCalledWith({ caughtPokemon: [] });
        });

        it('should handle pokemon catch triggering pokedex updates', () => {
            const pokemonCallback = vi.fn();
            const toastCallback = vi.fn();

            eventBus.on('pokemon:caught', pokemonCallback);
            eventBus.on('toast:show', toastCallback);

            // Simulate catching pokemon and showing success message
            eventBus.emit('pokemon:caught', { pokeApiId: 150 });
            toastEvents.showSuccess('Mewtwo caught!');

            expect(pokemonCallback).toHaveBeenCalledWith({ pokeApiId: 150 });
            expect(toastCallback).toHaveBeenCalledWith({
                message: 'Mewtwo caught!',
                type: 'success'
            });
        });

        it('should handle complex event workflows', () => {
            const authLoginCallback = vi.fn();
            const pokemonRefreshCallback = vi.fn();
            const pokemonCaughtCallback = vi.fn();
            const toastCallback = vi.fn();

            eventBus.on('auth:login', authLoginCallback);
            eventBus.on('pokemon:refresh-caught-status', pokemonRefreshCallback);
            eventBus.on('pokemon:caught', pokemonCaughtCallback);
            eventBus.on('toast:show', toastCallback);

            // Simulate login workflow: login -> refresh data -> catch pokemon -> show success
            eventBus.emit('auth:login', {
                userId: 1,
                user: { id: 1, username: 'trainer', email: 'trainer@test.com', role: 'User', createdDate: '2025-01-01', caughtPokemonCount: 0 }
            });
            eventBus.emit('pokemon:refresh-caught-status', {
                caughtPokemon: [{ pokemon: { pokeApiId: 25 } }]
            });
            eventBus.emit('pokemon:caught', { pokeApiId: 150 });
            toastEvents.showSuccess('Welcome back, trainer!');

            expect(authLoginCallback).toHaveBeenCalledTimes(1);
            expect(pokemonRefreshCallback).toHaveBeenCalledTimes(1);
            expect(pokemonCaughtCallback).toHaveBeenCalledTimes(1);
            expect(toastCallback).toHaveBeenCalledTimes(1);
        });
    });
});
