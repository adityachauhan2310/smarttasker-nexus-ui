import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import config from '../config/config';

// Rate limiting middleware
export const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes by default
  max: config.rateLimit.max, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});

// More restrictive rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
});

// CSRF Protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Simple CSRF check: Ensure Origin and Referer headers match the Host
  // This is a basic implementation; in production, use a proper CSRF token library
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  // Skip for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for API requests with Bearer token (assuming they're authenticated properly)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') &&
    req.path.startsWith('/api/')
  ) {
    return next();
  }

  if (origin && host) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      res.status(403).json({
        success: false,
        error: 'CSRF check failed',
      });
      return;
    }
  } else if (referer && host) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      res.status(403).json({
        success: false,
        error: 'CSRF check failed',
      });
      return;
    }
  } else {
    // If neither Origin nor Referer exists, and it's a mutating request, block it
    res.status(403).json({
      success: false,
      error: 'CSRF check failed',
    });
    return;
  }

  next();
};

// Configure secure HTTP headers with Helmet
export const secureHeaders = helmet({
  contentSecurityPolicy: config.env === 'production',
  crossOriginEmbedderPolicy: config.env === 'production',
  crossOriginOpenerPolicy: config.env === 'production',
  crossOriginResourcePolicy: config.env === 'production',
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: config.env === 'production',
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
});

// Function to sanitize request body for logging (remove sensitive data)
const sanitizeRequestData = (data: any): any => {
  if (!data) return {};
  
  // Create a copy to avoid modifying the original
  const sanitized = { ...data };
  
  // List of sensitive fields to mask
  const sensitiveFields = [
    'password', 'newPassword', 'currentPassword', 'token', 
    'refreshToken', 'accessToken', 'apiKey', 'secret',
    'authorization', 'creditCard', 'cardNumber', 'cvv', 'pin'
  ];
  
  // Mask sensitive fields
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log suspicious activities
  const suspiciousPaths = [
    '/admin',
    '/login',
    '/api/auth',
    '/wp-admin',
    '/phpmyadmin',
  ];

  const path = req.path.toLowerCase();

  // Check if the request path matches any suspicious paths
  const isSuspicious = suspiciousPaths.some((suspiciousPath) =>
    path.includes(suspiciousPath)
  );

  if (isSuspicious) {
    console.log(`[SECURITY] Suspicious request to ${req.path} from ${req.ip}`);
    
    // Log additional information for analysis
    const securityLog = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      path: req.path,
      headers: req.headers,
      query: req.query,
      body: req.method !== 'GET' ? sanitizeRequestData(req.body) : undefined,
    };
    
    // In a real app, you might want to store this in a database or dedicated logging service
    if (config.env === 'development') {
      console.log('Security log:', JSON.stringify(securityLog, null, 2));
    }
  }

  next();
};

export default {
  limiter,
  authLimiter,
  csrfProtection,
  secureHeaders,
  securityLogger,
}; 