import { News } from '../models/News';
import { Summary } from '../models/Summary';
import { WhatsAppFormatter } from './whatsapp.formatter';
import { ChatService } from '../services/chat.service';
import { Logger } from '../utils/logger';

const logger = new Logger('WhatsAppRouter');

export class WhatsAppRouter {
  static async handleIncomingMessage(sender: string, text: string): Promise<string> {
    const raw = (text || '').trim();
    const cmd = raw.toLowerCase();

    logger.info(`Routing WhatsApp message from ${sender}: "${raw}"`);

    if (cmd === 'help' || cmd === 'hi' || cmd === 'hello' || cmd === 'start') {
      return WhatsAppFormatter.formatHelp();
    }

    if (cmd === 'today' || cmd === 'news') {
      return this.handleTodayDigest();
    }

    if (cmd.includes('knowledge') || cmd === 'learn') {
      return this.handleKnowledge();
    }

    // Category commands
    if (cmd.includes('india')) {
      return this.handleCategoryQuery('India');
    }
    if (cmd.includes('world') || cmd.includes('global')) {
      return this.handleCategoryQuery('World');
    }
    if (cmd.includes('tech') || cmd.includes('ai') || cmd.includes('artificial')) {
      return this.handleCategoryQuery('Technology & AI');
    }
    if (cmd.includes('business') || cmd.includes('economy')) {
      return this.handleCategoryQuery('Business & Economy');
    }
    if (cmd.includes('science') || cmd.includes('space')) {
      return this.handleCategoryQuery('Science & Space');
    }
    if (cmd.includes('environment') || cmd.includes('climate')) {
      return this.handleCategoryQuery('Environment');
    }
    if (cmd.includes('politics') || cmd.includes('political')) {
      return this.handleCategoryQuery('Politics');
    }
    if (cmd.includes('sport') || cmd.includes('cricket')) {
      return this.handleCategoryQuery('Sports');
    }
    if (cmd.includes('incident') || cmd.includes('disaster') || cmd.includes('accident')) {
      return this.handleCategoryQuery('Major Incidents');
    }

    // Natural Language Query via ChatService RAG
    const chatResult = await ChatService.askQuestion(sender, raw);
    return chatResult.response;
  }

  private static async handleTodayDigest(): Promise<string> {
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Fetch top 1 article each for India, World, Tech
    const [indiaNews, worldNews, techNews, latestSummary] = await Promise.all([
      News.findOne({ category: 'India' }).sort({ publishedAt: -1 }).lean(),
      News.findOne({ category: 'World' }).sort({ publishedAt: -1 }).lean(),
      News.findOne({ category: 'Technology & AI' }).sort({ publishedAt: -1 }).lean(),
      Summary.findOne({ 'knowledge.topic': { $exists: true } }).sort({ createdAt: -1 }).lean(),
    ]);

    const sections = [];

    if (indiaNews) {
      const summary: any = await Summary.findOne({ newsId: (indiaNews as any)._id }).lean();
      sections.push({
        categoryLabel: 'India',
        emoji: '🇮🇳',
        articles: [
          {
            title: (indiaNews as any).title,
            summary: summary?.summary || (indiaNews as any).description || 'Latest update.',
            whyItMatters: summary?.whyItMatters || 'Impacts national policy and growth.',
            sourceName: (indiaNews as any).sourceName,
            url: (indiaNews as any).url,
          },
        ],
      });
    }

    if (worldNews) {
      const summary: any = await Summary.findOne({ newsId: (worldNews as any)._id }).lean();
      sections.push({
        categoryLabel: 'World',
        emoji: '🌍',
        articles: [
          {
            title: (worldNews as any).title,
            summary: summary?.summary || (worldNews as any).description || 'Latest international coverage.',
            whyItMatters: summary?.whyItMatters || 'Influences global international relations.',
            sourceName: (worldNews as any).sourceName,
            url: (worldNews as any).url,
          },
        ],
      });
    }

    if (techNews) {
      const summary: any = await Summary.findOne({ newsId: (techNews as any)._id }).lean();
      sections.push({
        categoryLabel: 'Technology & AI',
        emoji: '🤖',
        articles: [
          {
            title: (techNews as any).title,
            summary: summary?.summary || (techNews as any).description || 'Technological breakthrough reported.',
            whyItMatters: summary?.whyItMatters || 'Advances computational capabilities and industry tools.',
            sourceName: (techNews as any).sourceName,
            url: (techNews as any).url,
          },
        ],
      });
    }

    const knowledgeData = latestSummary
      ? {
          topic: (latestSummary as any).knowledge.topic,
          simpleExplanation: (latestSummary as any).knowledge.simpleExplanation,
        }
      : {
          topic: 'Continuous Learning',
          simpleExplanation: 'Understanding daily current events builds knowledge and objective perspectives.',
        };

    return WhatsAppFormatter.formatDailyDigest(dateFormatted, sections, knowledgeData);
  }

  private static async handleCategoryQuery(category: string): Promise<string> {
    const articles = await News.find({ category })
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    const formattedArticles = [];
    for (const art of articles) {
      const summary: any = await Summary.findOne({ newsId: (art as any)._id }).lean();
      formattedArticles.push({
        title: (art as any).title,
        summary: summary?.summary || (art as any).description,
        description: (art as any).description,
        sourceName: (art as any).sourceName,
        url: (art as any).url,
      });
    }

    return WhatsAppFormatter.formatCategoryNews(category, formattedArticles);
  }

  private static async handleKnowledge(): Promise<string> {
    const summary = await Summary.findOne({ 'knowledge.topic': { $exists: true } })
      .sort({ createdAt: -1 })
      .lean();

    if (summary) {
      return WhatsAppFormatter.formatKnowledgeItem(
        (summary as any).knowledge.topic,
        (summary as any).knowledge.simpleExplanation,
        (summary as any).whyItMatters
      );
    }

    return WhatsAppFormatter.formatKnowledgeItem(
      'AI & Digital Governance',
      'The set of rules and technological standards established to ensure artificial intelligence is deployed safely, fairly, and transparently.'
    );
  }
}
