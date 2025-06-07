import { AxiosError } from 'axios';
import { ApiError } from '../client/api/apiClient';
import { toast } from '../hooks/use-toast';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error category types
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'authentication',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

/**
 * Structured error object
 */
export interface StructuredError {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code?: string;
  details?: Record<string, any>;
  originalError?: any;
}

/**
 * Categorize an error based on status code or error type
 */
export function categorizeError(error: AxiosError | ApiError | Error): ErrorCategory {
  if ('status' in error) {
    // ApiError or AxiosError with response
    const status = error.status || (error as AxiosError).response?.status;
    
    if (status === 401 || status === 403) {
      return ErrorCategory.AUTH;
    } else if (status === 400 || status === 422) {
      return ErrorCategory.VALIDATION;
    } else if (status && status >= 500) {
      return ErrorCategory.SERVER;
    } else if (status && status >= 400) {
      return ErrorCategory.CLIENT;
    }
  }
  
  // Network errors
  if (
    error instanceof AxiosError && 
    (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')
  ) {
    return ErrorCategory.NETWORK;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Determine error severity based on category and status
 */
export function determineErrorSeverity(
  error: AxiosError | ApiError | Error, 
  category: ErrorCategory
): ErrorSeverity {
  if (category === ErrorCategory.NETWORK) {
    return ErrorSeverity.WARNING;
  } else if (category === ErrorCategory.SERVER) {
    return ErrorSeverity.ERROR;
  } else if (category === ErrorCategory.AUTH) {
    return ErrorSeverity.WARNING;
  } else if (category === ErrorCategory.VALIDATION) {
    return ErrorSeverity.INFO;
  }
  
  return ErrorSeverity.ERROR;
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(
  error: AxiosError | ApiError | Error, 
  category: ErrorCategory
): string {
  // If we have a specific error message, use it
  if ('message' in error && error.message) {
    return error.message;
  }
  
  // Default messages by category
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Network error. Please check your connection and try again.';
    case ErrorCategory.AUTH:
      return 'Authentication error. Please sign in again.';
    case ErrorCategory.VALIDATION:
      return 'Please check the form for errors.';
    case ErrorCategory.SERVER:
      return 'Server error. Our team has been notified.';
    case ErrorCategory.CLIENT:
      return 'Something went wrong with your request.';
    default:
      return 'An unexpected error occurred.';
  }
}

/**
 * Process an error into a structured format
 */
export function processError(error: any): StructuredError {
  let processedError: StructuredError;
  
  try {
    const category = categorizeError(error);
    const severity = determineErrorSeverity(error, category);
    const message = getUserFriendlyMessage(error, category);
    
    processedError = {
      message,
      severity,
      category,
      originalError: error,
      code: 'code' in error ? error.code : undefined,
      details: 'errors' in error ? error.errors : undefined,
    };
    
    // Log error to console for debugging
    console.error('Processed error:', processedError);
    
  } catch (e) {
    // Fallback if error processing fails
    processedError = {
      message: 'An unexpected error occurred',
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.UNKNOWN,
      originalError: error,
    };
  }
  
  return processedError;
}

/**
 * Display an error toast notification
 */
export function showErrorToast(error: any): void {
  const processedError = processError(error);
  
  toast({
    title: getErrorTitle(processedError.category),
    description: processedError.message,
    variant: getToastVariant(processedError.severity),
  });
}

/**
 * Get a title for the error toast based on category
 */
function getErrorTitle(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Connection Error';
    case ErrorCategory.AUTH:
      return 'Authentication Error';
    case ErrorCategory.VALIDATION:
      return 'Validation Error';
    case ErrorCategory.SERVER:
      return 'Server Error';
    case ErrorCategory.CLIENT:
      return 'Request Error';
    default:
      return 'Error';
  }
}

/**
 * Map error severity to toast variant
 */
function getToastVariant(severity: ErrorSeverity): 'default' | 'destructive' {
  switch (severity) {
    case ErrorSeverity.ERROR:
    case ErrorSeverity.CRITICAL:
      return 'destructive';
    default:
      return 'default';
  }
}

export default {
  processError,
  showErrorToast,
  categorizeError,
  determineErrorSeverity,
  getUserFriendlyMessage,
}; 