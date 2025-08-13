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
});
