import Parser from 'rss-parser';
import { INewsProvider, RawArticle } from '../INewsProvider';
import { Logger } from '../../utils/logger';

const logger = new Logger('RSSProvider');

export interface FeedConfig {
  source: string;
  sourceName: string;
  url: string;
  categoryHint: string;
}

export const DEFAULT_FEEDS: FeedConfig[] = [
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
  {
    source: 'ndtv-india',
    sourceName: 'NDTV India',
    url: 'https://feeds.feedburner.com/ndtvnews-india-news',
    categoryHint: 'India',
  },

  // World News
  {
    source: 'bbc-world',
    sourceName: 'BBC World News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    categoryHint: 'World',
  },
  {
    source: 'aljazeera-world',
    sourceName: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    categoryHint: 'World',
  },

  // Business & Economy
  {
    source: 'bbc-business',
    sourceName: 'BBC Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    categoryHint: 'Business & Economy',
  },
  {
    source: 'the-hindu-businessline',
    sourceName: 'The Hindu BusinessLine',
    url: 'https://www.thehindubusinessline.com/news/feeder/default.rss',
    categoryHint: 'Business & Economy',
  },
  {
    source: 'cnbc-world',
    sourceName: 'CNBC International',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    categoryHint: 'Business & Economy',
  },

  // Technology & AI
  {
    source: 'techcrunch',
    sourceName: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    categoryHint: 'Technology & AI',
  },
  {
    source: 'the-verge',
    sourceName: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    categoryHint: 'Technology & AI',
  },
  {
    source: 'ars-technica',
    sourceName: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    categoryHint: 'Technology & AI',
  },

  // Science & Space
  {
    source: 'science-daily',
    sourceName: 'ScienceDaily',
    url: 'https://www.sciencedaily.com/rss/top/science.xml',
    categoryHint: 'Science & Space',
  },
  {
    source: 'scientific-american',
    sourceName: 'Scientific American',
    url: 'http://rss.sciam.com/ScientificAmerican-Global',
    categoryHint: 'Science & Space',
  },
  {
    source: 'nasa-news',
    sourceName: 'NASA News',
    url: 'https://www.nasa.gov/news-release/feed/',
    categoryHint: 'Science & Space',
  },

  // Sports
  {
    source: 'bbc-sport',
    sourceName: 'BBC Sport',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    categoryHint: 'Sports',
  },
  {
    source: 'sky-sports',
    sourceName: 'Sky Sports',
    url: 'https://www.skysports.com/rss/12040',
    categoryHint: 'Sports',
  },
  {
    source: 'guardian-sport',
    sourceName: 'The Guardian Sport',
    url: 'https://www.theguardian.com/sport/rss',
    categoryHint: 'Sports',
  },

  // Environment
  {
    source: 'un-climate',
    sourceName: 'UN News Climate Change',
    url: 'https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml',
    categoryHint: 'Environment',
  },
  {
    source: 'guardian-environment',
    sourceName: 'The Guardian Environment',
    url: 'https://www.theguardian.com/environment/rss',
    categoryHint: 'Environment',
  },

  // Major Incidents (Severe Disasters, Earthquakes, Tropical Storms)
  {
    source: 'usgs-earthquakes',
    sourceName: 'USGS Earthquakes M4.5+',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.atom',
    categoryHint: 'Major Incidents',
  },
  {
    source: 'noaa-nhc',
    sourceName: 'NOAA Hurricane Center',
    url: 'https://www.nhc.noaa.gov/index-at.xml',
    categoryHint: 'Major Incidents',
  },
];

/**
 * Strips HTML tags and unescapes common HTML entities for clean text storage.
 */
function cleanText(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts image URL from RSS item enclosures, media tags, or inline HTML <img> tags.
 */
function extractImageUrl(item: any): string {
  // 1. Enclosure check
  if (item.enclosure && item.enclosure.url && (!item.enclosure.type || item.enclosure.type.startsWith('image/'))) {
    return item.enclosure.url.trim();
  }

  // 2. Media:content check (handles array or single object)
  if (item.mediaContent) {
    const list = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
    for (const mc of list) {
      if (mc?.$?.url) return mc.$.url.trim();
      if (mc?.url) return mc.url.trim();
    }
  }

  // 3. Media:thumbnail check
  if (item.mediaThumbnail) {
    const list = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : [item.mediaThumbnail];
    for (const mt of list) {
      if (mt?.$?.url) return mt.$.url.trim();
      if (mt?.url) return mt.url.trim();
    }
  }

  // 4. HTML img tag extraction from content or description
  const html = item.contentEncoded || item.content || item.description || item.summary || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return '';
}

export class RSSProvider implements INewsProvider {
  readonly name = 'RSSProvider';
  private parser: Parser;
  private feeds: FeedConfig[];

  constructor(customFeeds?: FeedConfig[]) {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PersonalAINewsBot/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml;q=0.9, */*;q=0.8',
      },
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['media:thumbnail', 'mediaThumbnail'],
          ['content:encoded', 'contentEncoded'],
          ['enclosure', 'enclosure'],
        ],
      },
    });
    this.feeds = customFeeds || DEFAULT_FEEDS;
  }

  getFeeds(): FeedConfig[] {
    return this.feeds;
  }

  async fetchArticles(): Promise<RawArticle[]> {
    logger.info(`Fetching articles from ${this.feeds.length} configured RSS sources...`);
    const allArticles: RawArticle[] = [];

    // Parallel fetch with individual error containment
    const feedPromises = this.feeds.map(async (feed) => {
      try {
        const feedData = await this.parser.parseURL(feed.url);
        if (!feedData || !feedData.items) {
          logger.warn(`RSS feed [${feed.sourceName}]: returned no items.`);
          return [];
        }

        const articles: RawArticle[] = [];
        for (const item of feedData.items) {
          if (!item.title || !item.link) continue;

          const imageUrl = extractImageUrl(item);
          const rawDescription = item.contentSnippet || item.summary || item.description || item.content || '';
          const description = cleanText(rawDescription);
          const content = cleanText(item.content || item.contentSnippet || rawDescription);

          articles.push({
            title: cleanText(item.title),
            description,
            content: content || description,
            url: item.link.trim(),
            source: feed.source,
            sourceName: feed.sourceName,
            author: cleanText(item.creator || (item as any)['dc:creator'] || item.author || feed.sourceName),
            imageUrl,
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
            categoryHint: feed.categoryHint,
            language: 'en',
          });
        }
        logger.info(`RSS feed [${feed.sourceName}]: Successfully fetched ${articles.length} articles.`);
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
