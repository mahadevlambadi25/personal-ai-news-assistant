export type NewsCategory =
  | 'India'
  | 'World'
  | 'Politics'
  | 'Business & Economy'
  | 'Technology & AI'
  | 'Science & Space'
  | 'Environment'
  | 'Major Incidents'
  | 'Sports'
  | 'Knowledge';

export type AppLanguage = 'en' | 'hinglish';

export interface User {
  id: string;
  name: string;
  email: string;
  whatsappNumber?: string;
}

export interface SummaryData {
  summary: string;
  whyItMatters: string;
  background: string;
  keyFacts: string[];
  knowledge: {
    topic: string;
    simpleExplanation: string;
  };
  confidence?: number;
  language?: AppLanguage;
}

export interface NewsArticle {
  _id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  sourceName: string;
  url: string;
  author?: string;
  imageUrl?: string;
  category: NewsCategory;
  tags?: string[];
  publishedAt: string;
  fetchedAt?: string;
  contentHash?: string;
  language?: string;
  aiProcessed?: boolean;
}

export interface ArticleDetailResponse {
  article: NewsArticle;
  summary: SummaryData | null;
  relatedNews: NewsArticle[];
}

export interface PaginatedNews {
  articles: NewsArticle[];
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
    publishedAt: string;
    url: string;
  } | null;
  createdAt: string;
}

export interface PaginatedKnowledge {
  items: KnowledgeItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  relatedArticles?: Array<{
    id: string;
    title: string;
    sourceName: string;
    url: string;
    category: string;
  }>;
  timestamp: string;
}

export interface UserPreferences {
  categories: NewsCategory[];
  language: string;
  newsLimit: number;
  notificationSettings: {
    emailDailyDigest: boolean;
    whatsappDailyDigest: boolean;
    digestTime: string;
  };
}
