import { News } from '../models/News';
import { Summary } from '../models/Summary';
import { getAIService } from '../ai/ai.factory';
import { Logger } from '../utils/logger';

const logger = new Logger('AINewsProcessor');

export class AINewsProcessor {
  /**
   * Processes up to `batchSize` un-processed articles using the AI service.
   */
  static async processPendingArticles(batchSize = 10): Promise<{ processed: number; errors: number }> {
    const unProcessed = await News.find({ aiProcessed: false })
      .sort({ publishedAt: -1 })
      .limit(batchSize);

    if (unProcessed.length === 0) {
      return { processed: 0, errors: 0 };
    }

    logger.info(`Starting AI enrichment for ${unProcessed.length} pending articles...`);
    const aiService = getAIService();
    let processed = 0;
    let errors = 0;

    for (const article of unProcessed) {
      try {
        const aiOutput = await aiService.processArticle({
          title: article.title,
          description: article.description,
          content: article.content,
          categoryHint: article.category,
          sourceName: article.sourceName,
        });

        // Upsert summary
        await Summary.findOneAndUpdate(
          { newsId: article._id },
          {
            newsId: article._id,
            summary: aiOutput.summary,
            whyItMatters: aiOutput.whyItMatters,
            background: aiOutput.background,
            keyFacts: aiOutput.keyFacts,
            knowledge: aiOutput.knowledge,
            confidence: aiOutput.confidence,
          },
          { upsert: true, new: true }
        );

        article.aiProcessed = true;
        await article.save();
        processed++;
      } catch (err: any) {
        logger.error(`Error processing article ${article._id}: ${err.message}`);
        errors++;
      }
    }

    logger.info(`AI processing finished: ${processed} enriched, ${errors} errors.`);
    return { processed, errors };
  }
}
