import { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';

import { logger } from '../config';
import { BadRequestException } from '../exceptions/http.exception';

/**
 * Validate request body using Zod schema
 * @deprecated Use zodValidateMiddleware from zod.middleware.ts instead
 */
export const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // This middleware is kept for backward compatibility
  // Please use zodValidateMiddleware from zod.middleware.ts for new routes
  next();
};

/**
 * Validate request body, query, or params using Zod schema
 * @param schema Zod schema (can be ZodObject or ZodEffects)
 * @param type Request property to validate ('body', 'query', 'params')
 * @returns Express middleware
 */
export const validate = (schema: z.ZodTypeAny, type: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request data against schema
      const data = await schema.parseAsync(req[type]);

      // Handle assignment properly for different request types
      if (type === 'query') {
        // For query, we need to use Object.defineProperty or reassign the entire object
        Object.assign(req.query, data);
      } else {
        // For body and params, direct assignment works
        req[type] = data;
      }

      next();
    } catch (error) {
      logger.warn('Validation error:', error);

      if (error instanceof ZodError) {
        // Format Zod errors
        const formattedErrors = error.issues.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message
        }));

        next(new BadRequestException('Validation Error', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};
