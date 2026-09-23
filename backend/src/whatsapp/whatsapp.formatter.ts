import { INewsArticle } from '../models/News';
import { ISummary } from '../models/Summary';

export class WhatsAppFormatter {
  static formatHelp(): string {
    return `🤖 *Personal AI News & Knowledge Assistant*

Send any command or natural question:

📰 *Commands:*
• *today* — Top daily news across India, World, Tech & Knowledge
• *india news* — Top news from India
• *world news* — Top international stories
• *technology* / *ai* — Latest Tech & AI updates
• *business* — Economy & market updates
• *science* — Science & space discoveries
• *environment* — Climate & sustainability
• *sports* — Major sports updates
• *major incidents* — Disaster & emergency alerts
• *knowledge* — Today's educational concept
• *help* — Show this list

💬 *Or ask in plain English:*
"What happened in India today?"
"Explain recent AI news"
"Why is this important?"`;
  }

  static formatDailyDigest(
    dateStr: string,
    sections: Array<{
      categoryLabel: string;
      emoji: string;
      articles: Array<{
        title: string;
        summary: string;
        whyItMatters: string;
        sourceName: string;
        url: string;
      }>;
    }>,
    knowledge?: { topic: string; simpleExplanation: string }
  ): string {
    let msg = `📰 *TODAY'S IMPORTANT NEWS*\n${dateStr}\n\n`;

    let itemNumber = 1;
    const sourcesList: string[] = [];

    for (const section of sections) {
      if (section.articles.length === 0) continue;
      msg += `${section.emoji} *${section.categoryLabel.toUpperCase()}*\n\n`;

      for (const article of section.articles) {
        msg += `${itemNumber}️⃣ *${article.title}*\n`;
        msg += `*What happened:*\n${article.summary}\n\n`;
        msg += `*Why it matters:*\n${article.whyItMatters}\n\n`;

        if (!sourcesList.includes(article.sourceName)) {
          sourcesList.push(article.sourceName);
        }
        itemNumber++;
      }
    }

    if (knowledge) {
      msg += `🧠 *TODAY'S KNOWLEDGE*\n\n`;
      msg += `*Topic:* ${knowledge.topic}\n`;
      msg += `*Simple meaning:*\n${knowledge.simpleExplanation}\n\n`;
    }

    if (sourcesList.length > 0) {
      msg += `🔗 *Verified Sources:*\n`;
      sourcesList.forEach((src, idx) => {
        msg += `${idx + 1}. ${src}\n`;
      });
    }

    return msg.trim();
  }

  static formatCategoryNews(
    categoryName: string,
    articles: Array<{ title: string; summary?: string; description?: string; sourceName: string; url: string }>
  ): string {
    if (articles.length === 0) {
      return `No recent news articles found for *${categoryName}*. Check back shortly as new feeds are fetched!`;
    }

    let msg = `📰 *${categoryName.toUpperCase()} NEWS*\n\n`;
    articles.slice(0, 4).forEach((art, i) => {
      msg += `${i + 1}️⃣ *${art.title}*\n`;
      msg += `${art.summary || art.description || 'Recent coverage.'}\n`;
      msg += `_Source: ${art.sourceName}_\n\n`;
    });

    return msg.trim();
  }

  static formatKnowledgeItem(topic: string, simpleExplanation: string, whyItMatters?: string): string {
    let msg = `🧠 *DAILY KNOWLEDGE CONCEPT*\n\n`;
    msg += `*Topic:* ${topic}\n\n`;
    msg += `*Simple Explanation:*\n${simpleExplanation}\n\n`;
    if (whyItMatters) {
      msg += `*Why It Matters:*\n${whyItMatters}\n\n`;
    }
    msg += `_Send "today" to view today's top news stories._`;
    return msg;
  }
}
