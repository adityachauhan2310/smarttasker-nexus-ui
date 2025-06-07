import { Request, Response, NextFunction } from 'express';

/**
 * Interface for field selection
 */
export interface FieldSelection {
  select: string[];
  exclude: string[];
}

/**
 * Parse field selection from the 'fields' query parameter
 * Examples:
 * - fields=name,email,role (include only these fields)
 * - fields=-password,-__v (exclude these fields)
 * - fields=+name,+email,-__v (explicitly include some, exclude others)
 * @param req Express Request
 * @param res Express Response
 * @param next Next function
 */
export const fieldSelectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const fieldsParam = req.query.fields as string;
  
  // Default selection (no filtering)
  const fieldSelection: FieldSelection = {
    select: [],
    exclude: [],
  };
  
  if (fieldsParam) {
    const fields = fieldsParam.split(',').filter(field => field.trim());
    
    fields.forEach(field => {
      const trimmedField = field.trim();
      
      if (trimmedField.startsWith('-')) {
        // Exclusion
        fieldSelection.exclude.push(trimmedField.substring(1));
      } else if (trimmedField.startsWith('+')) {
        // Explicit inclusion
        fieldSelection.select.push(trimmedField.substring(1));
      } else {
        // Implicit inclusion
        fieldSelection.select.push(trimmedField);
      }
    });
  }
  
  // Attach field selection to request object
  req.fieldSelection = fieldSelection;
  
  next();
};

/**
 * Apply field selection to a mongoose query
 * @param query Mongoose query
 * @param fieldSelection Field selection options
 * @returns Updated query
 */
export const applyFieldSelection = (query: any, fieldSelection: FieldSelection) => {
  const { select, exclude } = fieldSelection;
  
  if (select.length > 0) {
    // If specific fields are selected, use only those
    return query.select(select.join(' '));
  } else if (exclude.length > 0) {
    // If fields are excluded, use - notation
    const excludeString = exclude.map(field => `-${field}`).join(' ');
    return query.select(excludeString);
  }
  
  // No field selection
  return query;
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      fieldSelection: FieldSelection;
    }
  }
}

export default fieldSelectionMiddleware; 