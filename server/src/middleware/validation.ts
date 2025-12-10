import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Validation target types
type ValidationTarget = 'body' | 'query' | 'params';

// Validation error response format
interface ValidationErrorResponse {
  error: string;
  details: {
    field: string;
    message: string;
  }[];
}

// Generic validation middleware factory
export function validate<T>(
  schema: ZodSchema<T>,
  target: ValidationTarget = 'body'
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = req[target];
      const validated = await schema.parseAsync(data);

      // Replace the target with validated data
      req[target] = validated as typeof req[typeof target];

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: ValidationErrorResponse = {
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };

        res.status(400).json(errorResponse);
        return;
      }

      // Re-throw non-Zod errors
      next(error);
    }
  };
}

// Convenience functions for common targets
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate(schema, 'body');
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate(schema, 'query');
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return validate(schema, 'params');
}
