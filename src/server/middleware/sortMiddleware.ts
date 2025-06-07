import { Request, Response, NextFunction } from 'express';

/**
 * Interface for sort options
 */
export interface SortOptions {
  [key: string]: 1 | -1;
}

/**
 * Parse sort parameters from the 'sort' query parameter
 * Examples:
 * - sort=createdAt (sort by createdAt ascending)
 * - sort=-createdAt (sort by createdAt descending)
 * - sort=priority,-dueDate (sort by priority ascending, then dueDate descending)
 * @param req Express Request
 * @param res Express Response
 * @param next Next function
 */
export const sortMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sortParam = req.query.sort as string;
  
  // Default sort (empty object means no specific sort order)
  const sortOptions: SortOptions = {};
  
  if (sortParam) {
    const sortFields = sortParam.split(',').filter(field => field.trim());
    
    sortFields.forEach(field => {
      const trimmedField = field.trim();
      
      if (trimmedField.startsWith('-')) {
        // Descending order
        sortOptions[trimmedField.substring(1)] = -1;
      } else {
        // Ascending order (default)
        sortOptions[trimmedField] = 1;
      }
    });
  }
  
  // Attach sort options to request object
  req.sortOptions = sortOptions;
  
  next();
};

/**
 * Apply sort options to a mongoose query
 * @param query Mongoose query
 * @param sortOptions Sort options
 * @returns Updated query
 */
export const applySort = (query: any, sortOptions: SortOptions) => {
  if (Object.keys(sortOptions).length > 0) {
    return query.sort(sortOptions);
  }
  
  // Default sort by creation date if no sort specified
  return query.sort({ createdAt: -1 });
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      sortOptions: SortOptions;
    }
  }
}

export default sortMiddleware; 