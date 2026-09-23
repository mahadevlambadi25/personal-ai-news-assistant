import mongoose from 'mongoose';
import { env } from './env';
import { Logger } from '../utils/logger';

const logger = new Logger('Database');

let memoryServer: any = null;

export async function connectDatabase(): Promise<string> {
  const isProd = env.isProduction;

  if (isProd) {
    if (!env.MONGODB_URI) {
      throw new Error('FATAL: MONGODB_URI is required in production environment. In-memory database is strictly forbidden in production.');
    }
    logger.info('Connecting to production MongoDB...');
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info('Connected to production MongoDB successfully');
    return env.MONGODB_URI;
  }

  // Development or Test mode
  if (env.MONGODB_URI) {
    try {
      logger.info(`Attempting to connect to configured MongoDB URI: ${env.MONGODB_URI.split('@').pop()}`);
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('Connected to configured MongoDB successfully');
      return env.MONGODB_URI;
    } catch (err: any) {
      logger.warn(`Could not connect to external MongoDB: ${err.message}. Falling back to in-memory database for local development.`);
    }
  }

  // In-memory fallback for development and testing
  logger.info('Starting embedded in-memory MongoDB server for zero-config local development/testing...');
  process.env.MONGOMS_MD5_CHECK = 'false';
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create({
    binary: {
      checkMD5: false,
    },
  });
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  logger.info(`Connected to in-memory MongoDB instance at ${uri}`);
  return uri;
}

export async function disconnectDatabase(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    }
    if (memoryServer) {
      await memoryServer.stop();
      logger.info('Stopped in-memory MongoDB server');
      memoryServer = null;
    }
  } catch (err: any) {
    logger.error('Error disconnecting database', { error: err.message });
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
