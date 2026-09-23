import request from 'supertest';
import { createApp } from '../src/server';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { LocalFallbackAIService } from '../src/ai/localFallback.service';
import { AINewsProcessor } from '../src/services/aiNewsProcessor.service';
import { News } from '../src/models/News';
import { Summary } from '../src/models/Summary';
import { computeContentHash } from '../src/utils/contentHash';

describe('Phase 5: AI Engine & Knowledge System', () => {
  let app: any;

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
  });

  describe('LocalFallbackAIService Unit Tests', () => {
    const aiService = new LocalFallbackAIService();

    it('generates complete structured output with summary, impact, background, facts, and knowledge', async () => {
      const result = await aiService.processArticle({
        title: 'New national AI regulation bill introduced in Parliament',
        description: 'The framework introduces mandatory audits and safety testing for frontier AI models.',
        sourceName: 'The Hindu',
        categoryHint: 'Technology & AI',
      });

      expect(result.category).toBe('Technology & AI');
      expect(result.summary.length).toBeGreaterThan(15);
      expect(result.whyItMatters.length).toBeGreaterThan(15);
      expect(result.background.length).toBeGreaterThan(15);
      expect(Array.isArray(result.keyFacts)).toBe(true);
      expect(result.keyFacts.length).toBeGreaterThanOrEqual(1);
      expect(result.knowledge).toBeDefined();
      expect(result.knowledge.topic).toBeDefined();
      expect(result.knowledge.simpleExplanation.length).toBeGreaterThan(10);
    });

    it('maintains strict political neutrality on political news', async () => {
      const result = await aiService.processArticle({
        title: 'Opposition and Ruling coalition debate upcoming election schedule in parliament',
        description: 'Both parties presented differing arguments during the parliamentary session.',
        sourceName: 'National News',
        categoryHint: 'Politics',
      });

      expect(result.category).toBe('Politics');
      const fullText = JSON.stringify(result).toLowerCase();

      // Ensure zero partisan bias
      expect(fullText).not.toContain('vote for');
      expect(fullText).not.toContain('should support');
      expect(fullText).not.toContain('best party');
      expect(fullText).not.toContain('corrupt');
    });

    it('generates chat responses using provided context articles', async () => {
      const context = [
        {
          title: 'India launches digital public infrastructure',
          summary: 'Scales digital payments across rural regions.',
          sourceName: 'The Hindu',
        },
      ];

      const answer = await aiService.generateChatResponse('What happened in India today?', context);
      expect(answer).toContain('India launches digital public infrastructure');
      expect(answer).toContain('The Hindu');
    });
  });

  describe('AINewsProcessor Integration', () => {
    it('enriches pending articles in MongoDB with AI summary and marks them aiProcessed', async () => {
      const article = await News.create({
        title: 'Clean Energy transition accelerates globally',
        description: 'Solar and wind power capacity reached record additions.',
        content: 'Full story on solar technology.',
        source: 'bbc',
        sourceName: 'BBC News',
        url: 'https://example.com/clean-energy',
        category: 'Environment',
        publishedAt: new Date(),
        contentHash: computeContentHash('Clean Energy transition accelerates globally', 'https://example.com/clean-energy'),
        aiProcessed: false,
      });

      const stats = await AINewsProcessor.processPendingArticles(5);
      expect(stats.processed).toBe(1);
      expect(stats.errors).toBe(0);

      const updatedArticle = await News.findById(article._id);
      expect(updatedArticle?.aiProcessed).toBe(true);

      const summary = await Summary.findOne({ newsId: article._id });
      expect(summary).not.toBeNull();
      expect(summary?.whyItMatters).toBeDefined();
      expect(summary?.knowledge.topic).toBeDefined();
    });
  });

  describe('GET /api/knowledge', () => {
    it('returns educational knowledge cards with article attribution', async () => {
      const article = await News.create({
        title: 'Space telescope spots distant planetary atmosphere',
        description: 'New spectroscopy techniques reveal atmospheric components.',
        content: 'Full astronomy article.',
        source: 'science-daily',
        sourceName: 'ScienceDaily',
        url: 'https://example.com/telescope',
        category: 'Science & Space',
        publishedAt: new Date(),
        contentHash: computeContentHash('Space telescope spots distant planetary atmosphere', 'https://example.com/telescope'),
        aiProcessed: true,
      });

      await Summary.create({
        newsId: article._id,
        summary: 'Spectroscopy reveals exoplanet atmospheric components.',
        whyItMatters: 'Advances search for habitable planets.',
        background: 'Telescopes analyze light passing through planetary atmospheres.',
        keyFacts: ['Atmospheric data collected', 'Spectroscopy used'],
        knowledge: {
          topic: 'Spectroscopy',
          simpleExplanation: 'Analyzing light to identify which chemical elements are present.',
        },
      });

      const res = await request(app).get('/api/knowledge');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);

      const item = res.body.data.items[0];
      expect(item.topic).toBe('Spectroscopy');
      expect(item.simpleExplanation).toContain('Analyzing light');
      expect(item.relatedArticle).toBeDefined();
      expect(item.relatedArticle.title).toContain('Space telescope');
      expect(item.relatedArticle.sourceName).toBe('ScienceDaily');
    });

    it('searches knowledge items by topic keyword', async () => {
      const article = await News.create({
        title: 'Sample Article for Knowledge',
        url: 'https://example.com/sample',
        source: 'sample',
        sourceName: 'Sample Source',
        category: 'Technology & AI',
        publishedAt: new Date(),
        contentHash: computeContentHash('Sample Article for Knowledge', 'https://example.com/sample'),
      });

      await Summary.create({
        newsId: article._id,
        summary: 'Summary text',
        whyItMatters: 'Matters text',
        background: 'Background text',
        keyFacts: ['Fact 1'],
        knowledge: {
          topic: 'Artificial General Intelligence',
          simpleExplanation: 'Hypothetical software capable of human-level tasks.',
        },
      });

      const res = await request(app).get('/api/knowledge?search=General%20Intelligence');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].topic).toBe('Artificial General Intelligence');
    });
  });
});
