import { Types } from 'mongoose';
import { News, INewsArticle } from '../models/News';
import { NEWS_CATEGORIES, NewsCategory } from '../types/categories';
import { NewsCollector, CollectorStats } from '../news/news.collector';

export interface NewsQueryOptions {
  page?: number | string;
  limit?: number | string;
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest';
}

export interface PaginatedNewsResult {
  articles: INewsArticle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CategoryCount {
  name: NewsCategory;
  count: number;
}

export class NewsService {
  /**
   * Retrieves paginated articles with search, category filtering, and date range support.
   */
  static async getNews(options: NewsQueryOptions): Promise<PaginatedNewsResult> {
    const page = Math.max(1, parseInt(String(options.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(options.limit || '20'), 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    // Category filter
    if (options.category && options.category !== 'all') {
      filter.category = options.category;
    }

    // Search filter across title and description
    if (options.search && options.search.trim().length > 0) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { sourceName: searchRegex },
      ];
    }

    // Date range filter
    if (options.dateFrom || options.dateTo) {
      filter.publishedAt = {};
      if (options.dateFrom) {
        const fromDate = new Date(options.dateFrom);
        if (!isNaN(fromDate.getTime())) {
          filter.publishedAt.$gte = fromDate;
        }
      }
      if (options.dateTo) {
        const toDate = new Date(options.dateTo);
        if (!isNaN(toDate.getTime())) {
          filter.publishedAt.$lte = toDate;
        }
      }
    }

    // Sort order: default newest first
    const sortOrder = options.sort === 'oldest' ? 1 : -1;

    const [articles, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      News.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      articles: articles as unknown as INewsArticle[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Fetches full article details along with its AI summary (if available) and related news.
   * Supports optional lang parameter (e.g. 'hinglish') to retrieve AI explanations in Hinglish.
   */
  static async getNewsById(id: string, lang = 'en'): Promise<{
    article: INewsArticle;
    summary: any | null;
    relatedNews: INewsArticle[];
  }> {
    if (!Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid article ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const articleDoc = await News.findById(id).lean();
    if (!articleDoc || Array.isArray(articleDoc)) {
      const error: any = new Error('News article not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    const articleId = (articleDoc as any)._id;

    // Fetch AI summary if exists (dynamically query Summary collection)
    const { Summary } = await import('../models/Summary');
    let summaryDoc: any = await Summary.findOne({ newsId: articleId }).lean();

    if (!summaryDoc) {
      try {
        const { getAIService } = await import('../ai/ai.factory');
        const aiService = getAIService();
        const aiResult = await aiService.processArticle({
          title: (articleDoc as any).title,
          description: (articleDoc as any).description,
          content: (articleDoc as any).content,
          categoryHint: (articleDoc as any).category,
          sourceName: (articleDoc as any).sourceName,
        });

        const created = await Summary.create({
          newsId: articleId,
          summary: aiResult.summary,
          whyItMatters: aiResult.whyItMatters,
          background: aiResult.background,
          keyFacts: aiResult.keyFacts,
          knowledge: aiResult.knowledge,
          confidence: aiResult.confidence,
        });
        summaryDoc = created.toObject ? created.toObject() : created;
        await News.findByIdAndUpdate(articleId, { aiProcessed: true });
      } catch {
        // fallback
      }
    }

    let processedSummary: any = summaryDoc || null;
    if (processedSummary && lang?.toLowerCase() === 'hinglish') {
      const { HinglishService } = await import('./hinglish.service');
      processedSummary = await HinglishService.translateSummary(processedSummary as any);
    }

    // Fetch related articles in the same category (excluding current)
    const relatedNews = await News.find({
      category: (articleDoc as any).category,
      _id: { $ne: articleId },
    })
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean();

    return {
      article: articleDoc as any,
      summary: processedSummary,
      relatedNews: relatedNews as any[],
    };
  }

  /**
   * Returns list of the 10 defined categories along with their respective article counts.
   */
  static async getCategories(): Promise<CategoryCount[]> {
    const counts = await News.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const item of counts) {
      countMap.set(item._id, item.count);
    }

    return NEWS_CATEGORIES.map((cat) => ({
      name: cat,
      count: countMap.get(cat) || 0,
    }));
  }

  /**
   * Triggers the news collection pipeline.
   */
  static async refreshNews(): Promise<CollectorStats> {
    const collector = new NewsCollector();
    return collector.collect();
  }
}
