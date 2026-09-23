import request from 'supertest';
import { createApp } from '../src/server';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { AuthService } from '../src/services/auth.service';
import { User } from '../src/models/User';

describe('Phase 2: Authentication System', () => {
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
    await User.deleteMany({});
  });

  describe('Password Hashing Unit Logic', () => {
    it('hashes passwords with salt and verifies successfully', async () => {
      const password = 'mySecretPassword123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await AuthService.comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthService.comparePassword('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Token Generation and Verification', () => {
    it('generates valid JWT and verifies payload correctly', () => {
      const token = AuthService.generateToken('user123', 'test@example.com');
      expect(typeof token).toBe('string');

      const payload = AuthService.verifyToken(token);
      expect(payload.userId).toBe('user123');
      expect(payload.email).toBe('test@example.com');
    });

    it('rejects invalid or tampered token', () => {
      expect(() => AuthService.verifyToken('invalid.token.here')).toThrow();
    });
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns JWT token and user profile without passwordHash', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        whatsappNumber: '+1234567890',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.name).toBe('Jane Doe');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Check DB directly
      const savedUser = await User.findOne({ email: 'jane@example.com' });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.passwordHash).not.toBe('password123');
    });

    it('rejects registration with existing email', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Jane Doe',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Another Jane',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('validates required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A', // too short
        email: 'not-an-email',
        password: '123', // too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'correctPassword123',
      });
    });

    it('logs in successfully with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'correctPassword123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('john@example.com');
    });

    it('rejects login with invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'wrongPassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@example.com',
        password: 'anyPassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me & authenticateToken Middleware', () => {
    let validToken: string;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Auth User',
        email: 'authuser@example.com',
        password: 'securePassword99',
      });
      validToken = res.body.data.token;
    });

    it('allows access with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('authuser@example.com');
      expect(res.body.data.preferences).toBeDefined();
      expect(Array.isArray(res.body.data.preferences.categories)).toBe(true);
    });

    it('rejects request with missing Authorization header', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects request with malformed or invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally.fake.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
