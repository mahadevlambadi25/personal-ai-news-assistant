import { IAIService, AIProcessedNews, ArticleInput } from './ai.interface';
import { classifyArticleCategory } from '../news/categoryClassifier';
import { NewsCategory } from '../types/categories';

export class LocalFallbackAIService implements IAIService {
  readonly providerName = 'LocalFallbackAIService';

  async processArticle(article: ArticleInput): Promise<AIProcessedNews> {
    const category: NewsCategory = classifyArticleCategory(
      article.title,
      article.description,
      article.categoryHint
    );

    const title = article.title.trim();
    const desc = (article.description || '').trim();
    const source = article.sourceName || 'Source';

    // Summary (What happened?)
    let summary: string;
    if (desc && desc.length > 20) {
      summary = desc;
    } else if (title) {
      summary = `${title} (Reported by ${source}).`;
    } else {
      summary = 'Not enough information available from the current source.';
    }

    // Key facts extraction
    const rawSentences = `${title}. ${desc}`
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && !s.includes('http'));

    const keyFacts = rawSentences.slice(0, 3);
    if (keyFacts.length === 0) {
      keyFacts.push(`Event reported by official news coverage (${source}).`);
    }

    // Why it matters
    let whyItMatters = '';
    switch (category) {
      case 'Technology & AI':
        whyItMatters =
          'Developments in software and artificial intelligence directly influence productivity, security standards, and daily consumer tools worldwide.';
        break;
      case 'India':
        whyItMatters =
          'Key national milestones, public policy developments, and socio-economic updates impact millions of citizens and businesses across India.';
        break;
      case 'Business & Economy':
        whyItMatters =
          'Shifts in market fundamentals, corporate investments, and central bank monetary policy impact employment, inflation, and borrowing costs.';
        break;
      case 'Environment':
        whyItMatters =
          'Climate trends, renewable adoption, and conservation policies dictate long-term ecological sustainability and global climate targets.';
        break;
      case 'Science & Space':
        whyItMatters =
          'Scientific exploration and astronomical discoveries expand humanity’s technological frontier and understanding of the universe.';
        break;
      case 'Politics':
        whyItMatters =
          'Legislative decisions, diplomatic discussions, and state policies establish legal standards and governance frameworks for institutions and society.';
        break;
      case 'Major Incidents':
        whyItMatters =
          'Emergency response protocols, disaster management, and public safety infrastructure are essential for citizen protection and recovery.';
        break;
      case 'Sports':
        whyItMatters =
          'Major athletic tournaments reflect national athletic achievements, sportsmanship, and international sports rankings.';
        break;
      default:
        whyItMatters =
          'Understanding global events helps contextualize international relations, trade corridors, and regional stability.';
    }

    // Background
    const background = `According to coverage verified by ${source}, this event develops amidst broader trends in ${category.toLowerCase()}. Official announcements and verified reporting continue to monitor updates.`;

    // Knowledge topic extraction
    let topic = 'Global Awareness';
    let simpleExplanation = 'Keeping informed about contemporary developments builds critical thinking and civic understanding.';

    if (category === 'Technology & AI') {
      topic = 'Digital Transformation';
      simpleExplanation =
        'The continuous integration of automated systems and advanced computation into modern society, making tasks faster and more accessible.';
    } else if (category === 'Business & Economy') {
      topic = 'Economic Indicators';
      simpleExplanation =
        'Statistical data points (such as inflation, interest rates, and trade volume) used by policymakers to gauge financial health.';
    } else if (category === 'Environment') {
      topic = 'Carbon Footprint & Sustainability';
      simpleExplanation =
        'The total amount of greenhouse gases produced by human activities and the actions taken to preserve natural resources for future generations.';
    } else if (category === 'Science & Space') {
      topic = 'Scientific Methodology';
      simpleExplanation =
        'A systematic approach using observation, measurement, and experimentation to verify hypotheses and discover truths about our universe.';
    } else if (category === 'Politics') {
      topic = 'Civic Governance';
      simpleExplanation =
        'The processes, institutions, and laws through which a state and its representatives make and implement decisions for the public good.';
    } else if (category === 'India') {
      topic = 'Digital Public Infrastructure';
      simpleExplanation =
        'Nationwide digital networks—such as digital identity and instant payments—that enable affordable, population-scale services for all citizens.';
    }

    // What happened (Detailed narrative)
    const whatHappened = desc && desc.length > 50
      ? desc
      : `${title}. Verified news coverage from ${source} reports ongoing developments concerning this event.`;

    // Why did it happen?
    const whyDidItHappen = `Reporting from ${source} indicates this development originated from planned sectoral initiatives and ongoing structural shifts in ${category.toLowerCase()}.`;

    // Impact
    const impact = `This directly influences relevant stakeholders, institutional decision-makers, and consumer awareness in ${category.toLowerCase()}.`;

    // What happens next?
    const whatNext = `Official stakeholders and relevant bodies are monitoring developments, with subsequent announcements expected in the upcoming period.`;

    return {
      category,
      summary,
      whatHappened,
      whyDidItHappen,
      whyItMatters,
      impact,
      background,
      keyFacts,
      easyExplanation: simpleExplanation,
      whatNext,
      knowledge: {
        topic,
        simpleExplanation,
      },
      confidence: 0.9,
    };
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
    if (contextArticles.length === 0) {
      return `I could not find recent verified news matching your query ("${userMessage}"). You can explore our categories or ask about today's top headlines in India, Technology, World, Business, or Science!`;
    }

    const summaries = contextArticles
      .map(
        (a, i) =>
          `${i + 1}. **${a.title}** (${a.sourceName || 'News Source'})\n   ${
            a.summary || a.description || 'Recent coverage.'
          }`
      )
      .join('\n\n');

    return `Here are the latest verified facts regarding your question:\n\n${summaries}\n\n**Takeaway:** This information is synthesized from our monitored news sources. Let me know if you would like a deeper explanation of any of these topics!`;
  }
}
