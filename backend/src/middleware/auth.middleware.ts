import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendError } from '../utils/responseHelper';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'TOKEN_EXPIRED', 'Authentication token has expired. Please login again.', 401);
      return;
    }
    sendError(res, 'INVALID_TOKEN', 'Invalid authentication token', 401);
    return;
  }
}
