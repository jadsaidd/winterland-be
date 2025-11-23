import { NextFunction, Request, Response } from 'express';

import { parsePaginationParams } from '../utils/pagination.util';

/**
 * Middleware to parse and validate pagination query parameters
 * Adds validated pagination params to req.pagination
 * 
 * @param defaultLimit Default number of items per page (default: 10)
 * @param maxLimit Maximum allowed items per page (default: 100)
 */
export function paginationMiddleware(defaultLimit: number = 10, maxLimit: number = 100) {
    return (req: Request, res: Response, next: NextFunction) => {
        const { page, limit, skip } = parsePaginationParams(
            req.query.page,
            req.query.limit,
            defaultLimit,
            maxLimit
        );

        // Attach parsed pagination params to request object
        (req as any).pagination = { page, limit, skip };

        next();
    };
}
