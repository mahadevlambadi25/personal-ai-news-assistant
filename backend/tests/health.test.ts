import request from 'supertest';
import { createApp } from '../src/server';
import { connectDatabase, disconnectDatabase } from '../src/config/database';

describe('Phase 1: Health & System Baseline', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /api/health returns status 200 with database connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.timestamp).toBeDefined();
  });

  it('GET /api/unknown-route returns 404 with structured error', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
