import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  whatsappNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400, parsed.error.format());
        return;
      }

      const result = await AuthService.register(parsed.data);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400, parsed.error.format());
        return;
      }

      const result = await AuthService.login(parsed.data);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
        return;
      }

      const result = await AuthService.getCurrentUser(req.user.userId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
}
