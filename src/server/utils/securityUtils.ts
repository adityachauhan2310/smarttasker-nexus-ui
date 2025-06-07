/**
 * Utility functions for security purposes
 */

/**
 * Sanitize sensitive data in requests for logging
 * Replaces sensitive field values with [REDACTED]
 * @param data Request data to sanitize
 * @returns Sanitized string representation
 */
export const sanitizeRequestData = (data: Record<string, any>): string => {
  // Make a deep copy of the data to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Fields to sanitize (case insensitive)
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'pin'];
  
  // Recursively sanitize the object
  const sanitizeObject = (obj: Record<string, any>): void => {
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      
      // Check if the key name is sensitive
      const isSensitiveKey = sensitiveFields.some(field => lowerKey.includes(field));
      
      if (isSensitiveKey && typeof obj[key] === 'string') {
        // Redact the value
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively sanitize nested objects/arrays
        sanitizeObject(obj[key]);
      }
    }
  };
  
  sanitizeObject(sanitized);
  
  // Return a formatted string representation
  return JSON.stringify(sanitized, null, 2);
};

/**
 * Escape HTML special characters to prevent XSS
 * @param text Text to escape
 * @returns Escaped text
 */
export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Remove or escape potentially dangerous characters from user input
 * @param input Input to sanitize
 * @returns Sanitized input
 */
export const sanitizeUserInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove or escape potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/style=/gi, ''); // Remove style attributes
}; 