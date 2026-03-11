import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * Parse and format API error responses
 * @param error - The error object from axios or other sources
 * @returns Formatted error object
 */
export function parseApiError(error: unknown): ApiError {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const errorData = error.response?.data;
    
    // Handle validation errors (400)
    if (statusCode === 400 && errorData?.errors) {
      return {
        message: errorData.message || 'Validation error',
        statusCode,
        errors: errorData.errors,
      };
    }
    
    // Handle authentication errors (401)
    if (statusCode === 401) {
      return {
        message: 'Authentication required. Please log in.',
        statusCode,
      };
    }
    
    // Handle authorization errors (403)
    if (statusCode === 403) {
      return {
        message: 'You do not have permission to perform this action.',
        statusCode,
      };
    }
    
    // Handle not found errors (404)
    if (statusCode === 404) {
      return {
        message: errorData?.message || 'Resource not found.',
        statusCode,
      };
    }
    
    // Handle server errors (500+)
    if (statusCode && statusCode >= 500) {
      return {
        message: 'Server error. Please try again later.',
        statusCode,
      };
    }
    
    // Generic error with message from server
    if (errorData?.message) {
      return {
        message: errorData.message,
        statusCode,
      };
    }
    
    // Network error (no response)
    if (error.request && !error.response) {
      return {
        message: 'Network error. Please check your internet connection.',
      };
    }
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }
  
  // Unknown error type
  return {
    message: 'An unexpected error occurred.',
  };
}

/**
 * Get user-friendly error message
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const apiError = parseApiError(error);
  
  // If there are validation errors, format them
  if (apiError.errors) {
    const errorMessages = Object.entries(apiError.errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    return `${apiError.message}\n${errorMessages}`;
  }
  
  return apiError.message;
}

/**
 * Log error to console with context
 * @param error - The error object
 * @param context - Additional context about where the error occurred
 */
export function logError(error: unknown, context: string) {
  const apiError = parseApiError(error);
  console.error(`[${context}] Error:`, {
    message: apiError.message,
    statusCode: apiError.statusCode,
    errors: apiError.errors,
    originalError: error,
  });
}

/**
 * Handle API errors with toast notifications
 * @param error - The error object
 * @param toast - Toast hook from useToast
 * @param context - Context for logging
 */
export function handleApiError(
  error: unknown,
  toast: { error: (message: string) => void },
  context: string = 'API Request'
) {
  logError(error, context);
  const errorMessage = getErrorMessage(error);
  toast.error(errorMessage);
}
