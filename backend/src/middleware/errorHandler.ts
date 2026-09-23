import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHelper';
import { Logger } from '../utils/logger';

const logger = new Logger('ErrorHandler');

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled request error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  sendError(res, code, message, statusCode);
}
