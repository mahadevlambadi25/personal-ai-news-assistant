import { Request, Response, NextFunction } from 'express';
import { KnowledgeService } from '../services/knowledge.service';
import { sendSuccess } from '../utils/responseHelper';

export class KnowledgeController {
  static async getKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = req.query;
      const result = await KnowledgeService.getKnowledge({
        page: page ? String(page) : undefined,
        limit: limit ? String(limit) : undefined,
        search: search ? String(search) : undefined,
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
