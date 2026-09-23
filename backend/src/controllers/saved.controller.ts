import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { SavedNewsService } from '../services/savedNews.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export class SavedNewsController {
  static async save(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      const result = await SavedNewsService.saveArticle(userId, id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async unsave(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { id } = req.params;
      const result = await SavedNewsService.unsaveArticle(userId, id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getSaved(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { page, limit, search } = req.query;
      const result = await SavedNewsService.getSavedNews(userId, {
        page: page ? String(page) : undefined,
        limit: limit ? String(limit) : undefined,
        search: search ? String(search) : undefined,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getSavedIds(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const ids = await SavedNewsService.getUserSavedIds(userId);
      sendSuccess(res, ids);
    } catch (err) {
      next(err);
    }
  }
}
