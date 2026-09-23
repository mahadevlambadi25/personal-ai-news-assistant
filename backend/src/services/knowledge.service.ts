import { Summary, ISummary } from '../models/Summary';
import { News } from '../models/News';

export interface KnowledgeItem {
  id: string;
  topic: string;
  simpleExplanation: string;
  whyItMatters: string;
  confidence: number;
  relatedArticle: {
    id: string;
    title: string;
    category: string;
    sourceName: string;
    publishedAt: Date;
    url: string;
  } | null;
  createdAt: Date;
}

export interface PaginatedKnowledgeResult {
  items: KnowledgeItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class KnowledgeService {
  static async getKnowledge(options: {
    page?: number | string;
    limit?: number | string;
    search?: string;
  }): Promise<PaginatedKnowledgeResult> {
    const page = Math.max(1, parseInt(String(options.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(options.limit || '12'), 10) || 12));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      'knowledge.topic': { $exists: true, $ne: '' },
    };

    if (options.search && options.search.trim().length > 0) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      filter.$or = [
        { 'knowledge.topic': searchRegex },
        { 'knowledge.simpleExplanation': searchRegex },
        { whyItMatters: searchRegex },
      ];
    }

    const [summaries, total] = await Promise.all([
      Summary.find(filter)
        .populate('newsId', 'title category sourceName publishedAt url')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Summary.countDocuments(filter),
    ]);

    const items: KnowledgeItem[] = summaries.map((s: any) => {
      const article = s.newsId;
      return {
        id: s._id.toString(),
        topic: s.knowledge?.topic || 'Knowledge Bite',
        simpleExplanation: s.knowledge?.simpleExplanation || '',
        whyItMatters: s.whyItMatters,
        confidence: s.confidence,
        relatedArticle: article
          ? {
              id: article._id.toString(),
              title: article.title,
              category: article.category,
              sourceName: article.sourceName,
              publishedAt: article.publishedAt,
              url: article.url,
            }
          : null,
        createdAt: s.createdAt,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }
}
