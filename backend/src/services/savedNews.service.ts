import { Types } from 'mongoose';
import { SavedNews } from '../models/SavedNews';
import { News } from '../models/News';

export class SavedNewsService {
  static async saveArticle(userId: string, newsId: string): Promise<{ saved: boolean }> {
    if (!Types.ObjectId.isValid(newsId)) {
      const error: any = new Error('Invalid news ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const newsExists = await News.findById(newsId);
    if (!newsExists) {
      const error: any = new Error('News article not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await SavedNews.findOneAndUpdate(
      { userId, newsId },
      { userId, newsId },
      { upsert: true, new: true }
    );

    return { saved: true };
  }

  static async unsaveArticle(userId: string, newsId: string): Promise<{ saved: boolean }> {
    if (!Types.ObjectId.isValid(newsId)) {
      const error: any = new Error('Invalid news ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    await SavedNews.findOneAndDelete({ userId, newsId });
    return { saved: false };
  }

  static async getSavedNews(
    userId: string,
    options: { page?: number | string; limit?: number | string; search?: string }
  ) {
    const page = Math.max(1, parseInt(String(options.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(options.limit || '20'), 10) || 20));
    const skip = (page - 1) * limit;

    const [savedRecords, total] = await Promise.all([
      SavedNews.find({ userId })
        .populate('newsId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedNews.countDocuments({ userId }),
    ]);

    let articles = savedRecords
      .map((r: any) => r.newsId)
      .filter((n: any) => n !== null);

    if (options.search && options.search.trim().length > 0) {
      const q = options.search.trim().toLowerCase();
      articles = articles.filter(
        (a: any) => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)
      );
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      articles,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  static async getUserSavedIds(userId: string): Promise<string[]> {
    const records = await SavedNews.find({ userId }).select('newsId').lean();
    return records.map((r: any) => r.newsId.toString());
  }
}
