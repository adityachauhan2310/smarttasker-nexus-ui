import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate an ETag for a response
 * @param data Response data to generate ETag for
 * @returns ETag string
 */
export const generateETag = (data: any): string => {
  const jsonString = JSON.stringify(data);
  const hash = crypto.createHash('md5').update(jsonString).digest('hex');
  return `"${hash}"`;
};

/**
 * Middleware to handle ETag generation and conditional requests
 * @param req Express Request
 * @param res Express Response
 * @param next Next function
 */
export const etagMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function (body) {
      // Generate ETag from response body
      const etag = generateETag(body);
      
      // Set the ETag header
      res.setHeader('ETag', etag);
      
      // Check if the client sent If-None-Match header
      const ifNoneMatch = req.headers['if-none-match'];
      
      // If the ETag matches, return 304 Not Modified
      if (ifNoneMatch === etag) {
        res.status(304).end();
        return this;
      }
      
      // Otherwise, proceed with the original json method
      return originalJson.call(this, body);
    };
    
    next();
  };
};

/**
 * Middleware for handling OPTIONS requests
 * @param req Express Request
 * @param res Express Response
 * @param next Next function
 */
export const optionsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
    
    // Set allowed methods based on route
    res.setHeader('Allow', methods.join(', '));
    res.status(204).end();
    return;
  }
  
  next();
};

/**
 * Middleware for handling HEAD requests (like GET but without body)
 * This should be used on routes that support both GET and HEAD
 * @param req Express Request
 * @param res Express Response
 * @param next Next function
 */
export const headRequestMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'HEAD') {
    // Store the original end method
    const originalEnd = res.end;
    
    // Replace send/json/etc to prevent sending body
    res.send = res.json = res.write = () => res;
    
    // Override end method
    res.end = function() {
      // Set Content-Length to 0 since we're not sending a body
      res.setHeader('Content-Length', '0');
      return originalEnd.call(this);
    };
  }
  
  next();
};

export default {
  etagMiddleware,
  optionsMiddleware,
  headRequestMiddleware,
}; 