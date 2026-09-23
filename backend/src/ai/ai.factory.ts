import { IAIService } from './ai.interface';
import { OpenAIService } from './openai.service';
import { LocalFallbackAIService } from './localFallback.service';
import { env } from '../config/env';

let aiInstance: IAIService | null = null;

export function getAIService(): IAIService {
  if (!aiInstance) {
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0) {
      aiInstance = new OpenAIService();
    } else {
      aiInstance = new LocalFallbackAIService();
    }
  }
  return aiInstance;
}
