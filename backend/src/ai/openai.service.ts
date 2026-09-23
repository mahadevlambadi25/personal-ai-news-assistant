import axios from 'axios';
import { IAIService, AIProcessedNews, ArticleInput } from './ai.interface';
import { LocalFallbackAIService } from './localFallback.service';
import { env } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('OpenAIService');

const SYSTEM_PROMPT = `You are a neutral, objective, and educational AI news editor and educator.
Your task is to analyze the provided news story and produce a structured JSON response.

GUIDELINES:
1. Category must strictly be one of:
   ["India", "World", "Politics", "Business & Economy", "Technology & AI", "Science & Space", "Environment", "Major Incidents", "Sports", "Knowledge"]
2. "summary": Clear, simple overview of what happened (2-3 sentences).
3. "whyItMatters": Explain the real-world significance and implications in simple terms.
4. "background": The necessary historical, political, or technical context needed to understand this event.
5. "keyFacts": Array of 2 to 4 distinct, verified factual bullet points strictly derived from the article.
6. "knowledge": An educational lesson related to the article:
   - "topic": Concept or term (e.g., "Carbon Tax", "Semiconductor Lithography", "Fiscal Deficit", "AI Governance").
   - "simpleExplanation": Beginner-friendly explanation of this concept.

POLITICAL NEWS & SAFETY RULES:
- Remain strictly neutral and objective at all times.
- Never tell the user who to support, vote for, or oppose.
- Never rank politicians or political parties.
- Do not invent facts, motives, or unverified claims.
- If information is insufficient or speculative, write: "Not enough information available from the current source."

RESPONSE FORMAT:
You MUST respond with valid raw JSON matching this schema:
{
  "category": "Technology & AI",
  "summary": "...",
  "whyItMatters": "...",
  "background": "...",
  "keyFacts": ["...", "..."],
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
          max_tokens: 800,
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
        whyItMatters: parsed.whyItMatters,
        background: parsed.background || '',
        keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
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
