import { Request, Response, NextFunction } from 'express';

/**
 * Interface for pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Interface for pagination result
 */
export interface PaginationResult {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Add pagination parameters to the request object
 * @param req Express Request
 * @param res Express Response
 * @param next Next function
 */
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get pagination parameters from query
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  // Validate and set bounds
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Cap at 100 items per page
  
  // Calculate skip value
  const skip = (validPage - 1) * validLimit;
  
  // Attach pagination to request object
  req.pagination = {
    page: validPage,
    limit: validLimit,
    skip,
  };
  
  next();
};

/**
 * Create pagination result data
 * @param options Current pagination options
 * @param totalItems Total count of items
 * @returns Pagination result object
 */
export const createPaginationResult = (options: PaginationOptions, totalItems: number): PaginationResult => {
  const totalPages = Math.ceil(totalItems / options.limit);
  
  return {
    page: options.page,
    limit: options.limit,
    totalPages,
    totalItems,
    hasNextPage: options.page < totalPages,
    hasPrevPage: options.page > 1,
  };
};

/**
 * Apply pagination to a mongoose query
 * @param query Mongoose query
 * @param options Pagination options
 * @returns Updated query
 */
export const applyPagination = (query: any, options: PaginationOptions) => {
  return query.skip(options.skip).limit(options.limit);
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      pagination: PaginationOptions;
    }
  }
}

export default paginationMiddleware; 