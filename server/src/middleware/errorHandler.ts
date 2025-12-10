import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factories
export const NotFoundError = (resource: string) =>
  new ApiError(`${resource} not found`, 404);

export const UnauthorizedError = (message: string = 'Unauthorized') =>
  new ApiError(message, 401);

export const ForbiddenError = (message: string = 'Forbidden') =>
  new ApiError(message, 403);

export const BadRequestError = (message: string) =>
  new ApiError(message, 400);

export const ConflictError = (message: string) =>
  new ApiError(message, 409);

// Error response format
interface ErrorResponse {
  error: string;
  statusCode: number;
  stack?: string;
}

// Global error handler middleware
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Default to 500 if no status code
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message,
      statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Build error response
  const response: ErrorResponse = {
    error: message,
    statusCode,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// 404 handler for undefined routes
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error = new ApiError(`Route not found: ${req.method} ${req.path}`, 404);
  next(error);
}

// Async wrapper to catch errors in async route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
