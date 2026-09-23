import request from 'supertest';
import { createApp } from '../src/server';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { News } from '../src/models/News';
import { Summary } from '../src/models/Summary';
import { computeContentHash } from '../src/utils/contentHash';

describe('Phase 4: News API Endpoints', () => {
  let app: any;
  let testNewsIds: string[] = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await News.deleteMany({});
    await Summary.deleteMany({});

    // Seed test news items
    const sampleArticles = [
      {
        title: 'India launches new digital public infrastructure mission',
        description: 'Aiming to scale digital payments across rural sectors.',
        content: 'Full article text on digital infrastructure in India.',
        source: 'the-hindu',
        sourceName: 'The Hindu',
        url: 'https://example.com/india-dpi',
        category: 'India',
        publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        contentHash: computeContentHash('India launches new digital public infrastructure mission', 'https://example.com/india-dpi'),
      },
      {
        title: 'Major Breakthrough in Quantum Computing announced',
        description: 'New qubit coherence record achieved by international team.',
        content: 'Quantum computing researchers made a breakthrough.',
        source: 'techcrunch',
        sourceName: 'TechCrunch',
        url: 'https://example.com/quantum-ai',
        category: 'Technology & AI',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        contentHash: computeContentHash('Major Breakthrough in Quantum Computing announced', 'https://example.com/quantum-ai'),
      },
      {
        title: 'Another technology update on semiconductor innovation',
        description: 'Next gen chips promise higher energy efficiency.',
        content: 'Silicon foundries scale manufacturing.',
        source: 'techcrunch',
        sourceName: 'TechCrunch',
        url: 'https://example.com/chips-tech',
        category: 'Technology & AI',
        publishedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        contentHash: computeContentHash('Another technology update on semiconductor innovation', 'https://example.com/chips-tech'),
      },
      {
        title: 'Global Climate Summit concludes with renewed pact',
        description: 'Nations agree on accelerated decarbonization deadlines.',
        content: 'Delegates approved target emission caps.',
        source: 'bbc-world',
        sourceName: 'BBC World News',
        url: 'https://example.com/climate-summit',
        category: 'Environment',
        publishedAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
        contentHash: computeContentHash('Global Climate Summit concludes with renewed pact', 'https://example.com/climate-summit'),
      },
    ];

    const docs = await News.insertMany(sampleArticles);
    testNewsIds = docs.map((d) => d._id.toString());
  });

  describe('GET /api/news', () => {
    it('returns paginated news articles sorted newest first by default', async () => {
      const res = await request(app).get('/api/news?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.articles).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(4);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasMore).toBe(true);

      // Verify newest first
      const time1 = new Date(res.body.data.articles[0].publishedAt).getTime();
      const time2 = new Date(res.body.data.articles[1].publishedAt).getTime();
      expect(time1).toBeGreaterThanOrEqual(time2);
    });

    it('filters news by category', async () => {
      const res = await request(app).get('/api/news?category=Technology%20%26%20AI');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.articles).toHaveLength(2);
      for (const article of res.body.data.articles) {
        expect(article.category).toBe('Technology & AI');
      }
    });

    it('searches news by query term in title or description', async () => {
      const res = await request(app).get('/api/news?search=Quantum');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.articles.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.articles[0].title).toContain('Quantum Computing');
    });
  });

  describe('GET /api/news/:id', () => {
    it('returns complete article detail with related articles and summary', async () => {
      const articleId = testNewsIds[1]; // Technology article

      // Seed summary for this article
      await Summary.create({
        newsId: articleId,
        summary: 'Researchers set a new benchmark for quantum coherence.',
        whyItMatters: 'Enables fault-tolerant quantum algorithms sooner.',
        background: 'Qubits are fragile and suffer from environmental noise.',
        keyFacts: ['Record coherence achieved', 'Uses superconducting circuits'],
        knowledge: {
          topic: 'Quantum Coherence',
          simpleExplanation: 'How long a quantum particle can hold information before losing it.',
        },
      });

      const res = await request(app).get(`/api/news/${articleId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.article).toBeDefined();
      expect(res.body.data.article._id).toBe(articleId);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.whyItMatters).toContain('fault-tolerant');
      expect(res.body.data.relatedNews).toBeDefined();
      expect(res.body.data.relatedNews.length).toBe(1); // The other Technology article
      expect(res.body.data.relatedNews[0]._id).not.toBe(articleId);
    });

    it('returns 400 for invalid mongo ID', async () => {
      const res = await request(app).get('/api/news/invalid-id-123');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('returns 404 for non-existent article', async () => {
      const res = await request(app).get('/api/news/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/categories', () => {
    it('returns all 10 categories with active article counts', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(10);

      const techCat = res.body.data.find((c: any) => c.name === 'Technology & AI');
      expect(techCat).toBeDefined();
      expect(techCat.count).toBe(2);

      const indiaCat = res.body.data.find((c: any) => c.name === 'India');
      expect(indiaCat).toBeDefined();
      expect(indiaCat.count).toBe(1);
    });
  });

  describe('GET /api/news/category/:category', () => {
    it('fetches articles specific to a given category endpoint', async () => {
      const res = await request(app).get('/api/news/category/Environment');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.articles).toHaveLength(1);
      expect(res.body.data.articles[0].title).toContain('Climate Summit');
    });
  });
});
