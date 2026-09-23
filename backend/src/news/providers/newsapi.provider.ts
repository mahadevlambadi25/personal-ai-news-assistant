import axios from 'axios';
import { INewsProvider, RawArticle } from '../INewsProvider';
import { env } from '../../config/env';
import { Logger } from '../../utils/logger';

const logger = new Logger('NewsAPIProvider');

export class NewsAPIProvider implements INewsProvider {
  readonly name = 'NewsAPIProvider';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.NEWS_API_KEY;
  }

  async fetchArticles(): Promise<RawArticle[]> {
    if (!this.apiKey) {
      logger.info('NewsAPIProvider: NEWS_API_KEY is not set. Skipping NewsAPI ingestion gracefully.');
      return [];
    }

    try {
      logger.info('Fetching top headlines from NewsAPI...');
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          apiKey: this.apiKey,
          language: 'en',
          pageSize: 40,
        },
        timeout: 10000,
      });

      if (!response.data || !Array.isArray(response.data.articles)) {
        return [];
      }

      const articles: RawArticle[] = [];
      for (const item of response.data.articles) {
        if (!item.title || !item.url || item.title === '[Removed]') continue;

        articles.push({
          title: item.title,
          description: item.description || '',
          content: item.content || item.description || '',
          url: item.url,
          source: item.source?.id || 'news-api',
          sourceName: item.source?.name || 'NewsAPI Source',
          author: item.author || item.source?.name || '',
          imageUrl: item.urlToImage || '',
          publishedAt: item.publishedAt || new Date().toISOString(),
          language: 'en',
        });
      }

      logger.info(`NewsAPIProvider: Successfully retrieved ${articles.length} articles.`);
      return articles;
    } catch (err: any) {
      logger.warn(`NewsAPIProvider fetch error: ${err.message}. Proceeding without NewsAPI.`);
      return [];
    }
  }
}
