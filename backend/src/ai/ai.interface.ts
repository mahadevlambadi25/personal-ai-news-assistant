import { NewsCategory } from '../types/categories';

export interface AIProcessedNews {
  category: NewsCategory;
  summary: string;
  whyItMatters: string;
  background: string;
  keyFacts: string[];
  knowledge: {
    topic: string;
    simpleExplanation: string;
  };
  confidence: number;
}

export interface ArticleInput {
  title: string;
  description?: string;
  content?: string;
  categoryHint?: string;
  sourceName?: string;
}

export interface IAIService {
  readonly providerName: string;
  processArticle(article: ArticleInput): Promise<AIProcessedNews>;
  generateChatResponse(
    userMessage: string,
    contextArticles: Array<{
      title: string;
      description?: string;
      summary?: string;
      sourceName?: string;
      publishedAt?: Date | string;
    }>
  ): Promise<string>;
}
