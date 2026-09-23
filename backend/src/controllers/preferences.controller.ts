import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { PreferencesService } from '../services/preferences.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export class PreferencesController {
  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const prefs = await PreferencesService.getPreferences(userId);
      sendSuccess(res, prefs);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const updated = await PreferencesService.updatePreferences(userId, req.body);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}
