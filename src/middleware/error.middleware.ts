import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';
import { HttpException } from '../exceptions/http.exception';

export const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  const errors = error.errors;

  logger.error(`[${req.method}] ${req.path} >>> Error: ${message}`);

  if (error.stack) {
    logger.error(error.stack);
  }

  res.status(status).json({
    success: false,
    status,
    message,
    errors: errors || undefined,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};
