import { Request, Response, NextFunction } from 'express';
import config from '../config/config';

// Interface for custom errors
export interface AppError extends Error {
  statusCode?: number;
  errors?: any;
  code?: number;
  keyValue?: any;
  value?: any;
}

// Error handling middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  
  error.message = err.message;

  // Log error for development
  if (config.env === 'development') {
    console.error('Error stack:', err.stack);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new Error(message) as AppError;
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message) as AppError;
    error.statusCode = 400;
    error.keyValue = err.keyValue;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    error = new Error(message) as AppError;
    error.statusCode = 400;
    error.errors = err.errors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new Error(message) as AppError;
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new Error(message) as AppError;
    error.statusCode = 401;
  }

  // Standard response format
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(config.env === 'development' && { stack: err.stack, details: error.errors || error.keyValue }),
  });
};

// 404 Not Found middleware
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  next(error);
};

// Custom error class
export class ErrorResponse extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default { errorHandler, notFound, ErrorResponse }; 