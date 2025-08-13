import { describe, it, expect } from 'vitest';
import { extractErrorMessage, isNetworkError } from './networkHelpers';

describe('networkHelpers', () => {
    describe('extractErrorMessage', () => {
        it('should extract message from axios error response with errors object', () => {
            const error = {
                response: {
                    data: {
                        errors: {
                            field1: ['First error message', 'Second error message'],
                            field2: 'Single error string'
                        }
                    }
                }
            };

            expect(extractErrorMessage(error)).toBe('First error message');
        });

        it('should extract message from response data message field', () => {
            const error = {
                response: {
                    data: {
                        message: 'Custom error message'
                    }
                }
            };

            expect(extractErrorMessage(error)).toBe('Custom error message');
        });

        it('should extract message from response data title field', () => {
            const error = {
                response: {
                    data: {
                        title: 'Error title'
                    }
                }
            };

            expect(extractErrorMessage(error)).toBe('Error title');
        });

        it('should extract message from response data error field', () => {
            const error = {
                response: {
                    data: {
                        error: 'Error description'
                    }
                }
            };

            expect(extractErrorMessage(error)).toBe('Error description');
        });

        it('should extract message from response data detail field', () => {
            const error = {
                response: {
                    data: {
                        detail: 'Detailed error information'
                    }
                }
            };

            expect(extractErrorMessage(error)).toBe('Detailed error information');
        });

        it('should extract message when response data is a string', () => {
            const error = {
                response: {
                    data: 'Simple error string'
                }
            };

            expect(extractErrorMessage(error)).toBe('Simple error string');
        });

        it('should extract message from error object message property', () => {
            const error = {
                message: 'Direct error message'
            };

            expect(extractErrorMessage(error)).toBe('Direct error message');
        });

        it('should return default message for unknown error format', () => {
            expect(extractErrorMessage('string error')).toBe('An unexpected error occurred');
            expect(extractErrorMessage(123)).toBe('An unexpected error occurred');
            expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
            expect(extractErrorMessage(undefined)).toBe('An unexpected error occurred');
            expect(extractErrorMessage({})).toBe('An unexpected error occurred');
        });

        it('should prioritize errors object over other fields', () => {
            const error = {
                response: {
                    data: {
                        errors: {
                            field1: ['Priority error message']
                        },
                        message: 'Secondary message',
                        title: 'Secondary title'
                    }
                }
            };

            expect(extractErrorMessage(error)).toBe('Priority error message');
        });

        it('should handle empty errors object gracefully', () => {
            const error = {
                response: {
                    data: {
                        errors: {},
                        message: 'Fallback message'
                    }
                }
            };

            expect(extractErrorMessage(error)).toBe('Fallback message');
        });
    });

    describe('isNetworkError', () => {
        it('should return false for non-objects', () => {
            expect(isNetworkError(null)).toBe(false);
            expect(isNetworkError(undefined)).toBe(false);
            expect(isNetworkError('string')).toBe(false);
            expect(isNetworkError(123)).toBe(false);
        });

        it('should detect network errors by message patterns', () => {
            const networkErrors = [
                { message: 'Network Error' },
                { message: 'CONNECTION REFUSED' },
                { message: 'err_connection_refused' },
                { message: 'ERR_NETWORK' },
                { message: 'err_internet_disconnected' },
                { message: 'Failed to fetch' },
                { message: 'net::err_connection_timeout' },
                { message: 'timeout occurred' },
                { message: 'ENOTFOUND' },
                { message: 'ECONNREFUSED' },
                { message: 'ENETDOWN' },
                { message: 'ENETUNREACH' },
                { message: 'EHOSTUNREACH' },
                { message: 'ECONNRESET' }
            ];

            networkErrors.forEach(error => {
                expect(isNetworkError(error)).toBe(true);
            });
        });

        it('should detect network errors by code patterns', () => {
            const networkErrors = [
                { code: 'ERR_NETWORK' },
                { code: 'err_connection_refused' },
                { code: 'ENOTFOUND' },
                { code: 'ECONNREFUSED' }
            ];

            networkErrors.forEach(error => {
                expect(isNetworkError(error)).toBe(true);
            });
        });

        it('should detect network errors by status codes', () => {
            const networkErrors = [
                { status: 0 },
                { status: 502 },
                { status: 503 },
                { status: 504 },
                { response: { status: 0 } },
                { response: { status: 502 } },
                { response: { status: 503 } },
                { response: { status: 504 } }
            ];

            networkErrors.forEach(error => {
                expect(isNetworkError(error)).toBe(true);
            });
        });

        it('should not detect non-network errors', () => {
            const nonNetworkErrors = [
                { message: 'Validation error' },
                { message: 'User not found' },
                { status: 400 },
                { status: 401 },
                { status: 403 },
                { status: 404 },
                { status: 500 },
                { response: { status: 400 } },
                { response: { status: 401 } },
                { response: { status: 403 } },
                { response: { status: 404 } },
                { response: { status: 500 } },
                { code: 'VALIDATION_ERROR' },
                { code: 'USER_NOT_FOUND' },
                {}
            ];

            nonNetworkErrors.forEach(error => {
                expect(isNetworkError(error)).toBe(false);
            });
        });

        it('should handle case-insensitive pattern matching', () => {
            const caseVariations = [
                { message: 'NETWORK ERROR' },
                { message: 'Network Error' },
                { message: 'network error' },
                { code: 'ERR_NETWORK' },
                { code: 'err_network' },
                { code: 'Err_Network' }
            ];

            caseVariations.forEach(error => {
                expect(isNetworkError(error)).toBe(true);
            });
        });

        it('should handle complex error objects', () => {
            const complexError = {
                message: 'Request failed with status code 503',
                code: 'ERR_NETWORK',
                status: 503,
                response: {
                    status: 503,
                    data: 'Service unavailable'
                }
            };

            expect(isNetworkError(complexError)).toBe(true);
        });

        it('should handle empty string values gracefully', () => {
            const emptyStringError = {
                message: '',
                code: '',
                status: 200
            };

            expect(isNetworkError(emptyStringError)).toBe(false);
        });
    });
});
