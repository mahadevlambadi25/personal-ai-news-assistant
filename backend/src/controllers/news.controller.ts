import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/news.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export class NewsController {
  static async getNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, category, dateFrom, dateTo, sort } = req.query;

      const result = await NewsService.getNews({
        page: page ? String(page) : undefined,
        limit: limit ? String(limit) : undefined,
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
        sort: sort === 'oldest' ? 'oldest' : 'newest',
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getNewsById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { lang } = req.query;
      const result = await NewsService.getNewsById(id, typeof lang === 'string' ? lang : undefined);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getNewsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const { page, limit, search, sort } = req.query;

      const result = await NewsService.getNews({
        category,
        page: page ? String(page) : undefined,
        limit: limit ? String(limit) : undefined,
        search: search ? String(search) : undefined,
        sort: sort === 'oldest' ? 'oldest' : 'newest',
      });

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await NewsService.getCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  static async refreshNews(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await NewsService.refreshNews();
      sendSuccess(res, {
        message: 'News refresh completed successfully',
        stats,
      });
    } catch (err) {
      next(err);
    }
  }
}
