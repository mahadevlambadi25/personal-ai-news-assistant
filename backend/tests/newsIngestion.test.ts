import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { News } from '../src/models/News';
import { computeContentHash, isValidUrl, normalizeText } from '../src/utils/contentHash';
import { classifyArticleCategory } from '../src/news/categoryClassifier';
import { NewsCollector } from '../src/news/news.collector';
import { INewsProvider, RawArticle } from '../src/news/INewsProvider';

class MockNewsProvider implements INewsProvider {
  readonly name = 'MockNewsProvider';
  private articles: RawArticle[];

  constructor(articles: RawArticle[]) {
    this.articles = articles;
  }

  async fetchArticles(): Promise<RawArticle[]> {
    return this.articles;
  }
}

describe('Phase 3: News Ingestion & Deduplication Pipeline', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await News.deleteMany({});
  });

  describe('URL Validation & Content Normalization', () => {
    it('validates http and https URLs correctly and rejects invalid URLs', () => {
      expect(isValidUrl('https://www.thehindu.com/news/national/article123.ece')).toBe(true);
      expect(isValidUrl('http://bbc.co.uk/news/world-123')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    it('normalizes text by stripping punctuation and excess whitespace', () => {
      const text = '  Breaking News: India\'s economy surges 7.2%!!  ';
      expect(normalizeText(text)).toBe('breaking news indias economy surges 72');
    });

    it('produces identical SHA-256 hash regardless of tracking query parameters', () => {
      const url1 = 'https://example.com/news/article-1?utm_source=twitter&utm_medium=social';
      const url2 = 'https://example.com/news/article-1?utm_campaign=daily&utm_content=btn';
      const url3 = 'https://example.com/news/article-1';

      const hash1 = computeContentHash('New AI model released', url1);
      const hash2 = computeContentHash('New AI model released', url2);
      const hash3 = computeContentHash('New AI model released', url3);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });
  });

  describe('Category Classification', () => {
    it('accurately classifies articles into appropriate categories based on keywords', () => {
      expect(classifyArticleCategory('ISRO launches new lunar orbiter from Sriharikota')).toBe('India');
      expect(classifyArticleCategory('OpenAI reveals GPT-5 with autonomous reasoning')).toBe('Technology & AI');
      expect(classifyArticleCategory('NASA James Webb discovers oldest galaxy in cosmos')).toBe('Science & Space');
      expect(classifyArticleCategory('Federal Reserve cuts interest rates amid slowing inflation')).toBe('Business & Economy');
      expect(classifyArticleCategory('Parliament passes new electoral reform legislation')).toBe('Politics');
      expect(classifyArticleCategory('Massive earthquake strikes off coast of Japan, triggering tsunami warning')).toBe('Major Incidents');
      expect(classifyArticleCategory('India defeats Australia in World Cup cricket final')).toBe('Sports');
      expect(classifyArticleCategory('Global carbon emissions reach record high at climate summit')).toBe('Environment');
    });
  });

  describe('NewsCollector Pipeline & Deduplication', () => {
    const mockArticles: RawArticle[] = [
      {
        title: 'India achieves record solar power generation in 2026',
        description: 'New solar installations in Rajasthan lead renewable surge.',
        url: 'https://example.com/solar-india',
        source: 'mock-source',
        sourceName: 'Mock Times',
        publishedAt: new Date().toISOString(),
      },
      {
        title: 'Astronomers discover water vapor on exoplanet',
        description: 'Atmospheric analysis reveals signs of life-supporting compounds.',
        url: 'https://example.com/space-water',
        source: 'mock-source',
        sourceName: 'Mock Times',
        publishedAt: new Date().toISOString(),
      },
      {
        title: 'Invalid URL article',
        description: 'This article has an invalid link.',
        url: 'invalid-url-string',
        source: 'mock-source',
        sourceName: 'Mock Times',
        publishedAt: new Date().toISOString(),
      },
    ];

    it('collects valid articles, skips invalid URLs, and stores articles in MongoDB', async () => {
      const mockProvider = new MockNewsProvider(mockArticles);
      const collector = new NewsCollector([mockProvider]);

      const stats = await collector.collect();

      expect(stats.fetched).toBe(3);
      expect(stats.newArticles).toBe(2);
      expect(stats.skipped).toBe(1); // 1 invalid URL
      expect(stats.duplicates).toBe(0);

      const dbArticles = await News.find({});
      expect(dbArticles.length).toBe(2);
      expect(dbArticles.some((a) => a.title.includes('solar power'))).toBe(true);
      expect(dbArticles.some((a) => a.title.includes('Astronomers discover'))).toBe(true);
    });

    it('prevents duplicate articles when run a second time', async () => {
      const mockProvider = new MockNewsProvider(mockArticles);
      const collector = new NewsCollector([mockProvider]);

      // First run
      const stats1 = await collector.collect();
      expect(stats1.newArticles).toBe(2);

      // Second run with the exact same articles
      const stats2 = await collector.collect();
      expect(stats2.newArticles).toBe(0);
      expect(stats2.duplicates).toBe(2);

      // DB should still only have 2 articles
      const count = await News.countDocuments();
      expect(count).toBe(2);
    });

    it('handles provider failures gracefully without crashing the collection process', async () => {
      const faultyProvider: INewsProvider = {
        name: 'FaultyProvider',
        async fetchArticles(): Promise<RawArticle[]> {
          throw new Error('Connection refused by remote host');
        },
      };

      const validProvider = new MockNewsProvider([
        {
          title: 'Resilient system continues working even if one provider fails',
          description: 'Fault-tolerant architecture verified.',
          url: 'https://example.com/resilient-architecture',
          source: 'mock-source',
          sourceName: 'Mock News',
          publishedAt: new Date().toISOString(),
        },
      ]);

      const collector = new NewsCollector([faultyProvider, validProvider]);
      const stats = await collector.collect();

      expect(stats.newArticles).toBe(1);
      const count = await News.countDocuments();
      expect(count).toBe(1);
    });
  });
});
