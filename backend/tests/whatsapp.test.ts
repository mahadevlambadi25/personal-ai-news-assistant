import request from 'supertest';
import { createApp } from '../src/server';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { env } from '../src/config/env';
import { WhatsAppRouter } from '../src/whatsapp/whatsapp.router';
import { WhatsAppService } from '../src/whatsapp/whatsapp.service';
import { News } from '../src/models/News';
import { Summary } from '../src/models/Summary';
import { computeContentHash } from '../src/utils/contentHash';

describe('Phase 9: Meta WhatsApp Cloud API Integration', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    app = createApp();

    await News.deleteMany({ url: 'https://example.com/green-hydrogen' });
    // Seed test news for WhatsApp digest
    const art = await News.create({
      title: 'India achieves clean hydrogen milestone',
      description: 'National green hydrogen mission operationalizes first commercial plant.',
      source: 'the-hindu',
      sourceName: 'The Hindu',
      url: 'https://example.com/green-hydrogen',
      category: 'India',
      publishedAt: new Date(),
      contentHash: computeContentHash('India achieves clean hydrogen milestone', 'https://example.com/green-hydrogen'),
      aiProcessed: true,
    });

    await Summary.create({
      newsId: art._id,
      summary: 'Commercial green hydrogen facility begins operations.',
      whyItMatters: 'Reduces industrial carbon footprint significantly.',
      background: 'Green hydrogen uses renewable electricity for electrolysis.',
      keyFacts: ['First commercial plant', 'Zero carbon emissions'],
      knowledge: {
        topic: 'Green Hydrogen',
        simpleExplanation: 'Hydrogen generated through water electrolysis using renewable energy.',
      },
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /api/whatsapp/webhook (Meta Verification)', () => {
    it('verifies challenge when mode and verify_token match', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': env.WHATSAPP_VERIFY_TOKEN,
          'hub.challenge': 'meta_challenge_code_98765',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('meta_challenge_code_98765');
    });

    it('rejects verification when token does not match', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': 'some_challenge',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('WhatsAppRouter Command Engine', () => {
    it('returns formatted help menu when commanded "help"', async () => {
      const response = await WhatsAppRouter.handleIncomingMessage('+1234567890', 'help');
      expect(response).toContain('Personal AI News & Knowledge Assistant');
      expect(response).toContain('*today*');
      expect(response).toContain('*knowledge*');
    });

    it('formats today digest with emojis, sections, and source attribution', async () => {
      const response = await WhatsAppRouter.handleIncomingMessage('+1234567890', 'today');
      expect(response).toContain("TODAY'S IMPORTANT NEWS");
      expect(response).toContain('What happened:');
      expect(response).toContain('Why it matters:');
      expect(response).toContain('Sources:');
    });

    it('returns knowledge bite when commanded "knowledge"', async () => {
      const response = await WhatsAppRouter.handleIncomingMessage('+1234567890', 'knowledge');
      expect(response).toContain('DAILY KNOWLEDGE CONCEPT');
      expect(response).toContain('Topic:');
      expect(response).toContain('Simple Explanation:');
    });

    it('handles natural language queries gracefully', async () => {
      const response = await WhatsAppRouter.handleIncomingMessage('+1234567890', 'What happened in India?');
      expect(response.length).toBeGreaterThan(20);
    });
  });

  describe('POST /api/whatsapp/webhook (Inbound Events)', () => {
    it('acknowledges webhook with 200 EVENT_RECEIVED immediately and processes payload', async () => {
      const metaPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '12345', phone_number_id: '67890' },
                  messages: [
                    {
                      from: '+1234567890',
                      id: 'wamid.HBgL...',
                      timestamp: '1600000000',
                      text: { body: 'today' },
                      type: 'text',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await request(app).post('/api/whatsapp/webhook').send(metaPayload);
      expect(res.status).toBe(200);
      expect(res.text).toBe('EVENT_RECEIVED');
    });
  });
});
