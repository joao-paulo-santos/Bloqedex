/**
 * Network-related utility functions for error handling and detection
 */

/**
 * Extracts a meaningful error message from various error response formats
 */
export const extractErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: Record<string, unknown> } };
        const data = axiosError.response?.data;

        if (data) {
            if (data.errors && typeof data.errors === 'object') {
                const errorMessages = [];
                for (const [, messages] of Object.entries(data.errors)) {
                    if (Array.isArray(messages)) {
                        errorMessages.push(...messages);
                    } else if (typeof messages === 'string') {
                        errorMessages.push(messages);
                    }
                }
                if (errorMessages.length > 0) {
                    return errorMessages[0];
                }
            }

            if (typeof data.message === 'string') {
                return data.message;
            }

            if (typeof data.title === 'string') {
                return data.title;
            }

            if (typeof data.error === 'string') {
                return data.error;
            }

            if (typeof data.detail === 'string') {
                return data.detail;
            }

            if (typeof data === 'string') {
                return data;
            }
        }
    }

    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }

    return 'An unexpected error occurred';
};

/**
 * Determines if an error is network-related (connection issues, timeouts, etc.)
 */
export const isNetworkError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;

    const err = error as {
        message?: string;
        code?: string;
        status?: number;
        response?: { status?: number };
    };
    const errorMessage = err.message?.toLowerCase() || '';
    const errorCode = err.code?.toLowerCase() || '';

    const networkErrorPatterns = [
        'network error',
        'connection refused',
        'err_connection_refused',
        'err_network',
        'err_internet_disconnected',
        'failed to fetch',
        'net::err_',
        'timeout',
        'enotfound',
        'econnrefused',
        'enetdown',
        'enetunreach',
        'ehostunreach',
        'econnreset'
    ];

    const networkStatusCodes = [0, 502, 503, 504];

    return networkErrorPatterns.some(pattern =>
        errorMessage.includes(pattern) || errorCode.includes(pattern)
    ) || (err.status !== undefined && networkStatusCodes.includes(err.status))
        || (err.response?.status !== undefined && networkStatusCodes.includes(err.response.status));
};
