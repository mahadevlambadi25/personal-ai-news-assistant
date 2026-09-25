import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ChatService } from '../services/chat.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export class ChatController {
  static async ask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, articleId, language } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        sendError(res, 'VALIDATION_ERROR', 'Message is required', 400);
        return;
      }

      // If user is authenticated, use their ID; otherwise fallback to guest
      const userId = req.user?.userId || '000000000000000000000000';
      const result = await ChatService.askQuestion(userId, message, articleId, language);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }

      const history = await ChatService.getConversations(userId);
      sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  }
}
