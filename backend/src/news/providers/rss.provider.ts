import Parser from 'rss-parser';
import { INewsProvider, RawArticle } from '../INewsProvider';
import { Logger } from '../../utils/logger';

const logger = new Logger('RSSProvider');

interface FeedConfig {
  source: string;
  sourceName: string;
  url: string;
  categoryHint?: string;
}

const DEFAULT_FEEDS: FeedConfig[] = [
  // India & National
  {
    source: 'the-hindu-national',
    sourceName: 'The Hindu',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    categoryHint: 'India',
  },
  {
    source: 'toi-top',
    sourceName: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    categoryHint: 'India',
  },
  // World News
  {
    source: 'bbc-world',
    sourceName: 'BBC World News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    categoryHint: 'World',
  },
  // Technology & AI
  {
    source: 'techcrunch',
    sourceName: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    categoryHint: 'Technology & AI',
  },
  // Science & Space
  {
    source: 'science-daily',
    sourceName: 'ScienceDaily',
    url: 'https://www.sciencedaily.com/rss/top/science.xml',
    categoryHint: 'Science & Space',
  },
  // Business & Economy
  {
    source: 'bbc-business',
    sourceName: 'BBC Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    categoryHint: 'Business & Economy',
  },
  // Sports
  {
    source: 'bbc-sport',
    sourceName: 'BBC Sport',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    categoryHint: 'Sports',
  },
  // Environment
  {
    source: 'phys-earth',
    sourceName: 'Phys.org Earth',
    url: 'https://phys.org/rss-feed/earth-news/',
    categoryHint: 'Environment',
  },
];

export class RSSProvider implements INewsProvider {
  readonly name = 'RSSProvider';
  private parser: Parser;
  private feeds: FeedConfig[];

  constructor(customFeeds?: FeedConfig[]) {
    this.parser = new Parser({
      timeout: 8000,
      headers: {
        'User-Agent': 'PersonalAINewsBot/1.0 (+https://github.com/personal-news-assistant)',
      },
    });
    this.feeds = customFeeds || DEFAULT_FEEDS;
  }

  async fetchArticles(): Promise<RawArticle[]> {
    logger.info(`Fetching articles from ${this.feeds.length} configured RSS sources...`);
    const allArticles: RawArticle[] = [];

    // Parallel fetch with individual error containment
    const feedPromises = this.feeds.map(async (feed) => {
      try {
        const feedData = await this.parser.parseURL(feed.url);
        if (!feedData || !feedData.items) return [];

        const articles: RawArticle[] = [];
        for (const item of feedData.items) {
          if (!item.title || !item.link) continue;

          // Extract image if available in enclosure or media
          let imageUrl = '';
          if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image/')) {
            imageUrl = item.enclosure.url;
          }

          articles.push({
            title: item.title.trim(),
            description: (item.contentSnippet || item.content || item.summary || '').trim(),
            content: (item.content || item.contentSnippet || '').trim(),
            url: item.link.trim(),
            source: feed.source,
            sourceName: feed.sourceName,
            author: item.creator || item.author || feed.sourceName,
            imageUrl,
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
            categoryHint: feed.categoryHint,
            language: 'en',
          });
        }
        return articles;
      } catch (err: any) {
        logger.warn(`Failed to fetch RSS feed [${feed.sourceName}]: ${err.message}. Continuing with others.`);
        return [];
      }
    });

    const results = await Promise.allSettled(feedPromises);
    for (const res of results) {
      if (res.status === 'fulfilled') {
        allArticles.push(...res.value);
      }
    }

    logger.info(`Fetched ${allArticles.length} total raw articles across all RSS feeds.`);
    return allArticles;
  }
}
