import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { appLogger } from './utils/logger';
import { sendError } from './utils/responseHelper';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import newsRoutes from './routes/news.routes';
import categoriesRoutes from './routes/categories.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import chatRoutes from './routes/chat.routes';
import savedRoutes from './routes/saved.routes';
import preferencesRoutes from './routes/preferences.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import { errorHandler } from './middleware/errorHandler';
import rateLimit from 'express-rate-limit';

export function createApp(): Application {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  // Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.isTest ? 10000 : 300, // Limit each IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again after 15 minutes.',
      },
    },
  });
  app.use(globalLimiter);

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Logging Middleware
  if (!env.isTest) {
    app.use(morgan('short'));
  }

  // API Routes
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/saved', savedRoutes);
  app.use('/api/preferences', preferencesRoutes);
  app.use('/api/whatsapp', whatsappRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export async function startServer() {
  try {
    await connectDatabase();
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      appLogger.info(`Personal AI News & Knowledge Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      appLogger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        appLogger.info('Server and database shut down complete.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return { app, server };
  } catch (err: any) {
    appLogger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

// Start immediately when executed directly
if (require.main === module) {
  startServer();
}
