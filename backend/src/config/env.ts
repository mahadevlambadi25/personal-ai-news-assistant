import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || '',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_news_assistant_insecure_default',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // External APIs
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  NEWS_API_KEY: process.env.NEWS_API_KEY || '',
  
  // WhatsApp Cloud API
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'news_assistant_verify_token_dev',
  WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION || 'v20.0',

  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isTest: (process.env.NODE_ENV || 'development') === 'test',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
};
