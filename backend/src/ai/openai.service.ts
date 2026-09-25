import axios from 'axios';
import { IAIService, AIProcessedNews, ArticleInput } from './ai.interface';
import { LocalFallbackAIService } from './localFallback.service';
import { env } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('OpenAIService');

const SYSTEM_PROMPT = `You are a neutral, objective, and educational AI news editor and educator.
Your task is to analyze the provided news story and produce an easy-to-understand structured explanation for normal readers.

GUIDELINES:
1. Category must strictly be one of:
   ["India", "World", "Politics", "Business & Economy", "Technology & AI", "Science & Space", "Environment", "Major Incidents", "Sports", "Knowledge"]
2. "summary": Quick summary (2-3 sentences) capturing the core story for someone in a hurry.
3. "whatHappened": Detailed, clear explanation of the event answering Who, What, When, Where in simple language.
4. "whyDidItHappen": Supported reason or underlying factors from the report. If unknown or unverified, write "The exact underlying cause has not yet been officially confirmed by sources."
5. "whyItMatters": Explain why this story deserves attention (e.g. impact on citizens, economy, science, global events).
6. "impact": Who or what may be affected (distinguish confirmed facts from reported analysis).
7. "background": The necessary historical, economic, or technical context needed for a beginner to understand this story.
8. "keyFacts": Array of 3 to 6 distinct, verified factual bullet points strictly derived from the article.
9. "easyExplanation": Beginner-friendly explanation of complex concepts, jargon, or technical policy details as if explaining to a non-expert.
10. "whatNext": Confirmed upcoming steps, deadlines, or official processes (do NOT guess or make predictions).
11. "knowledge": An educational lesson related to the article:
   - "topic": Concept or term (e.g., "Repo Rate", "Humanoid Robot", "Fiscal Deficit", "AI Governance").
   - "simpleExplanation": Plain-language explanation for everyday readers.

POLITICAL NEWS & SAFETY RULES:
- Remain strictly neutral and objective at all times.
- Never tell the user who to support, vote for, or oppose.
- Never rank politicians or political parties.
- Do not invent facts, motives, or unverified claims.
- Attribute claims clearly ("According to the government...", "According to the court...").

RESPONSE FORMAT:
You MUST respond with valid raw JSON matching this schema:
{
  "category": "Technology & AI",
  "summary": "...",
  "whatHappened": "...",
  "whyDidItHappen": "...",
  "whyItMatters": "...",
  "impact": "...",
  "background": "...",
  "keyFacts": ["...", "..."],
  "easyExplanation": "...",
  "whatNext": "...",
  "knowledge": {
    "topic": "...",
    "simpleExplanation": "..."
  }
}`;

export class OpenAIService implements IAIService {
  readonly providerName = 'OpenAIService';
  private apiKey: string;
  private model: string;
  private fallback: LocalFallbackAIService;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || env.OPENAI_API_KEY;
    this.model = model || env.OPENAI_MODEL;
    this.fallback = new LocalFallbackAIService();
  }

  async processArticle(article: ArticleInput): Promise<AIProcessedNews> {
    if (!this.apiKey) {
      logger.info('OpenAI API key not set. Using LocalFallbackAIService.');
      return this.fallback.processArticle(article);
    }

    try {
      const userPrompt = `SOURCE: ${article.sourceName || 'News Source'}
TITLE: ${article.title}
DESCRIPTION: ${article.description || ''}
CONTENT: ${article.content || ''}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 1200,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      if (!parsed.summary || !parsed.whyItMatters || !parsed.knowledge?.topic) {
        throw new Error('Malformed JSON structure received from OpenAI');
      }

      return {
        category: parsed.category,
        summary: parsed.summary,
        whatHappened: parsed.whatHappened || parsed.summary,
        whyDidItHappen: parsed.whyDidItHappen || '',
        whyItMatters: parsed.whyItMatters,
        impact: parsed.impact || '',
        background: parsed.background || '',
        keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
        easyExplanation: parsed.easyExplanation || parsed.knowledge?.simpleExplanation || '',
        whatNext: parsed.whatNext || '',
        knowledge: {
          topic: parsed.knowledge.topic,
          simpleExplanation: parsed.knowledge.simpleExplanation,
        },
        confidence: 0.98,
      };
    } catch (err: any) {
      logger.warn(`OpenAI processing error: ${err.message}. Falling back to LocalFallbackAIService.`);
      return this.fallback.processArticle(article);
    }
  }

  async generateChatResponse(
    userMessage: string,
    contextArticles: Array<{
      title: string;
      description?: string;
      summary?: string;
      sourceName?: string;
      publishedAt?: Date | string;
    }>
  ): Promise<string> {
    if (!this.apiKey) {
      return this.fallback.generateChatResponse(userMessage, contextArticles);
    }

    try {
      const contextText = contextArticles
        .map(
          (a, i) =>
            `[Article ${i + 1}] Title: ${a.title} | Source: ${a.sourceName || 'Verified News'} | Published: ${
              a.publishedAt || ''
            }\nSummary: ${a.summary || a.description || ''}`
        )
        .join('\n\n');

      const chatSystemPrompt = `You are a helpful, clear, and objective personal AI news assistant.
Answer the user's question using ONLY the provided verified news context.
- If the question cannot be answered from the provided context, state that clearly without guessing.
- Keep answers accessible, well-structured, and concise.
- Always remain politically neutral. Do not express personal political opinions.
- Attribute key information to the sources provided.

CONTEXT ARTICLES:
${contextText || 'No recent articles found.'}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            { role: 'system', content: chatSystemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 600,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return response.data?.choices?.[0]?.message?.content || this.fallback.generateChatResponse(userMessage, contextArticles);
    } catch (err: any) {
      logger.warn(`OpenAI chat error: ${err.message}. Using fallback.`);
      return this.fallback.generateChatResponse(userMessage, contextArticles);
    }
  }
}
