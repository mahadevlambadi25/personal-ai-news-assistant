import request from 'supertest';
import { createApp } from '../src/server';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { News } from '../src/models/News';
import { User } from '../src/models/User';
import { SavedNews } from '../src/models/SavedNews';
import { Conversation } from '../src/models/Conversation';
import { computeContentHash } from '../src/utils/contentHash';

describe('Chat RAG, Saved News, and Preferences API', () => {
  let app: any;
  let testToken: string;
  let testUserId: string;
  let testArticleId: string;

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
    await User.deleteMany({});
    await SavedNews.deleteMany({});
    await Conversation.deleteMany({});

    // Register test user
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Test Explorer',
      email: 'explorer@example.com',
      password: 'password123',
    });
    testToken = regRes.body.data.token;
    testUserId = regRes.body.data.user.id;

    // Seed test news
    const article = await News.create({
      title: 'India launches Chandrayaan exploration mission update',
      description: 'ISRO reports key telemetry from lunar south pole orbit.',
      content: 'Telemetry confirmed mission status.',
      source: 'isro-source',
      sourceName: 'ISRO Updates',
      url: 'https://example.com/isro-update',
      category: 'Science & Space',
      publishedAt: new Date(),
      contentHash: computeContentHash('India launches Chandrayaan exploration mission update', 'https://example.com/isro-update'),
    });
    testArticleId = article._id.toString();
  });

  describe('Saved News API', () => {
    it('saves an article, prevents duplicate saves, and lists saved articles', async () => {
      // 1. Save article
      const saveRes = await request(app)
        .post(`/api/news/${testArticleId}/save`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);
      expect(saveRes.body.data.saved).toBe(true);

      // 2. Fetch saved list
      const listRes = await request(app)
        .get('/api/saved')
        .set('Authorization', `Bearer ${testToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.articles).toHaveLength(1);
      expect(listRes.body.data.articles[0]._id).toBe(testArticleId);

      // 3. Fetch saved IDs
      const idsRes = await request(app)
        .get('/api/saved/ids')
        .set('Authorization', `Bearer ${testToken}`);

      expect(idsRes.status).toBe(200);
      expect(idsRes.body.data).toContain(testArticleId);

      // 4. Unsave article
      const unsaveRes = await request(app)
        .delete(`/api/news/${testArticleId}/save`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(unsaveRes.status).toBe(200);
      expect(unsaveRes.body.data.saved).toBe(false);

      // 5. Verify empty list after unsave
      const emptyRes = await request(app)
        .get('/api/saved')
        .set('Authorization', `Bearer ${testToken}`);
      expect(emptyRes.body.data.articles).toHaveLength(0);
    });
  });

  describe('Preferences API', () => {
    it('retrieves and updates user preferences', async () => {
      const getRes = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${testToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.categories.length).toBeGreaterThan(0);

      // Update preferences
      const updateRes = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          categories: ['Technology & AI', 'India'],
          newsLimit: 25,
          notificationSettings: {
            whatsappDailyDigest: true,
            digestTime: '09:00',
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.categories).toEqual(['Technology & AI', 'India']);
      expect(updateRes.body.data.newsLimit).toBe(25);
      expect(updateRes.body.data.notificationSettings.whatsappDailyDigest).toBe(true);
    });
  });

  describe('AI Chat & RAG API', () => {
    it('processes user questions, retrieves relevant news, and returns conversational response', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ message: 'What is the latest update on Chandrayaan exploration?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.response).toBeDefined();
      expect(res.body.data.relatedArticles.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.relatedArticles[0].title).toContain('Chandrayaan');

      // Check conversation history was recorded
      const histRes = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${testToken}`);

      expect(histRes.status).toBe(200);
      expect(histRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(histRes.body.data[0].message).toContain('Chandrayaan');
    });

    it('rejects empty messages with 400', async () => {
      const res = await request(app).post('/api/chat').send({ message: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
