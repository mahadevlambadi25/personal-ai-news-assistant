import { News } from '../models/News';
import { Summary } from '../models/Summary';
import { Conversation } from '../models/Conversation';
import { getAIService } from '../ai/ai.factory';
import { Logger } from '../utils/logger';

const logger = new Logger('ChatService');

export class ChatService {
  /**
   * Performs targeted RAG retrieval and answers user queries with verified recent context.
   */
  static async askQuestion(
    userId: string,
    message: string,
    articleId?: string,
    language?: string
  ): Promise<{
    message: string;
    response: string;
    relatedArticles: any[];
  }> {
    const cleanMessage = message.trim();
    logger.info(`Processing user chat query: "${cleanMessage.substring(0, 50)}..." [Article Context: ${articleId || 'None'}]`);

    let relevantNews: any[] = [];

    // If a specific article context is passed (e.g. from News Detail -> Ask AI), fetch it first
    if (articleId) {
      try {
        const { Types } = await import('mongoose');
        if (Types.ObjectId.isValid(articleId)) {
          const directArticle = await News.findById(articleId).lean();
          if (directArticle) {
            relevantNews.push(directArticle);
          }
        }
      } catch {
        // ignore direct fetch failure
      }
    }

    // Extract significant search keywords from query (excluding common stop words)
    const stopWords = new Set([
      'what', 'happened', 'today', 'the', 'in', 'and', 'about', 'tell', 'me', 'give', 'is', 'are', 'was',
      'this', 'news', 'world', 'for', 'with', 'from', 'explain', 'why', 'important', 'know', 'how'
    ]);

    const words = cleanMessage
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    if (words.length > 0) {
      const keywordRegexes = words.map((w) => new RegExp(w, 'i'));
      const found = await News.find({
        $or: [
          { title: { $in: keywordRegexes } },
          { description: { $in: keywordRegexes } },
          { category: { $in: keywordRegexes } },
        ],
        ...(articleId ? { _id: { $ne: articleId } } : {}),
      })
        .sort({ publishedAt: -1 })
        .limit(4)
        .lean();
      relevantNews.push(...found);
    }

    // If keyword query yielded 0 results, fall back to top recent news
    if (relevantNews.length === 0) {
      relevantNews = await News.find({})
        .sort({ publishedAt: -1 })
        .limit(4)
        .lean();
    }

    // Fetch summaries for the retrieved articles
    const articleIds = relevantNews.map((a) => a._id);
    const summaries = await Summary.find({ newsId: { $in: articleIds } }).lean();
    const summaryMap = new Map<string, string>();
    for (const s of summaries) {
      summaryMap.set(s.newsId.toString(), s.summary);
    }

    const contextForAI = relevantNews.map((a) => ({
      title: a.title,
      description: a.description,
      summary: summaryMap.get(a._id.toString()) || a.description,
      sourceName: a.sourceName,
      publishedAt: a.publishedAt,
    }));

    // Generate response using active AI service (OpenAI or LocalFallback)
    const aiService = getAIService();
    const rawAnswer = await aiService.generateChatResponse(cleanMessage, contextForAI);

    let finalAnswer = rawAnswer;
    if (language?.toLowerCase() === 'hinglish') {
      const { HinglishService } = await import('./hinglish.service');
      finalAnswer = HinglishService.synthesizeHinglishSentence(rawAnswer);
    }

    // Save conversation history
    await Conversation.create({
      userId,
      message: cleanMessage,
      response: finalAnswer,
      relatedNewsIds: articleIds,
    });

    const relatedArticlesFormatted = relevantNews.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      sourceName: a.sourceName,
      url: a.url,
      category: a.category,
      publishedAt: a.publishedAt,
    }));

    return {
      message: cleanMessage,
      response: finalAnswer,
      relatedArticles: relatedArticlesFormatted,
    };
  }

  static async getConversations(userId: string, limit = 20) {
    return Conversation.find({ userId })
      .populate('relatedNewsIds', 'title url sourceName category')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
