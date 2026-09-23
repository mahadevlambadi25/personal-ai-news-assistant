import { INewsProvider, RawArticle } from './INewsProvider';
import { RSSProvider } from './providers/rss.provider';
import { NewsAPIProvider } from './providers/newsapi.provider';
import { News, INews } from '../models/News';
import { computeContentHash, isValidUrl } from '../utils/contentHash';
import { classifyArticleCategory } from './categoryClassifier';
import { Logger } from '../utils/logger';

const logger = new Logger('NewsCollector');

export interface CollectorStats {
  fetched: number;
  newArticles: number;
  duplicates: number;
  skipped: number;
}

export class NewsCollector {
  private providers: INewsProvider[];

  constructor(customProviders?: INewsProvider[]) {
    this.providers = customProviders || [
      new RSSProvider(),
      new NewsAPIProvider(),
    ];
  }

  /**
   * Runs the complete end-to-end news ingestion pipeline:
   * 1. Fetches raw articles from registered providers concurrently
   * 2. Sanitizes and validates each article's URL and title
   * 3. Calculates deterministic SHA-256 content hashes
   * 4. Queries MongoDB to prevent duplicate articles
   * 5. Filters out stale articles older than 14 days
   * 6. Classifies into one of the 10 defined categories
   * 7. Batch inserts new validated articles into MongoDB
   */
  async collect(): Promise<CollectorStats> {
    logger.info(`Starting news collection across ${this.providers.length} providers...`);
    const stats: CollectorStats = {
      fetched: 0,
      newArticles: 0,
      duplicates: 0,
      skipped: 0,
    };

    // Step 1: Fetch articles from all providers concurrently
    const providerResults = await Promise.allSettled(
      this.providers.map(async (provider) => {
        try {
          return await provider.fetchArticles();
        } catch (err: any) {
          logger.error(`Provider [${provider.name}] failed during fetch: ${err.message}`);
          return [];
        }
      })
    );

    const rawArticles: RawArticle[] = [];
    for (const result of providerResults) {
      if (result.status === 'fulfilled') {
        rawArticles.push(...result.value);
      }
    }

    stats.fetched = rawArticles.length;
    logger.info(`Total raw articles collected from providers: ${stats.fetched}`);

    if (rawArticles.length === 0) {
      return stats;
    }

    // Step 2 & 3: Sanitize, validate, compute hash, and filter
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const candidates: Array<{
      raw: RawArticle;
      contentHash: string;
      publishedAt: Date;
    }> = [];

    // Local deduplication in current batch
    const seenHashesInBatch = new Set<string>();

    for (const raw of rawArticles) {
      // Validate title
      if (!raw.title || raw.title.trim().length < 5) {
        stats.skipped++;
        continue;
      }

      // Validate URL
      if (!raw.url || !isValidUrl(raw.url)) {
        stats.skipped++;
        continue;
      }

      // Compute content hash
      const hash = computeContentHash(raw.title, raw.url);
      if (seenHashesInBatch.has(hash)) {
        stats.duplicates++;
        continue;
      }
      seenHashesInBatch.add(hash);

      // Validate and parse date
      let pubDate = new Date(raw.publishedAt || Date.now());
      if (isNaN(pubDate.getTime()) || pubDate > new Date()) {
        pubDate = new Date();
      }

      // Freshness check: skip if older than 14 days
      if (pubDate < fourteenDaysAgo) {
        stats.skipped++;
        continue;
      }

      candidates.push({
        raw,
        contentHash: hash,
        publishedAt: pubDate,
      });
    }

    if (candidates.length === 0) {
      return stats;
    }

    // Step 4: Check existing hashes in MongoDB to prevent duplicate articles
    const hashes = candidates.map((c) => c.contentHash);
    const existingArticles = await News.find({ contentHash: { $in: hashes } })
      .select('contentHash')
      .lean();

    const existingHashSet = new Set(existingArticles.map((a: any) => a.contentHash));

    // Step 5 & 6: Classify category & prepare models for insertion
    const toInsert = [];
    for (const candidate of candidates) {
      if (existingHashSet.has(candidate.contentHash)) {
        stats.duplicates++;
        continue;
      }

      const category = classifyArticleCategory(
        candidate.raw.title,
        candidate.raw.description,
        candidate.raw.categoryHint
      );

      toInsert.push({
        title: candidate.raw.title.trim(),
        description: candidate.raw.description?.trim() || '',
        content: candidate.raw.content?.trim() || candidate.raw.description?.trim() || '',
        source: candidate.raw.source.trim(),
        sourceName: candidate.raw.sourceName.trim(),
        url: candidate.raw.url.trim(),
        author: candidate.raw.author?.trim() || '',
        imageUrl: candidate.raw.imageUrl?.trim() || '',
        category,
        tags: [category.toLowerCase()],
        publishedAt: candidate.publishedAt,
        fetchedAt: new Date(),
        contentHash: candidate.contentHash,
        language: candidate.raw.language || 'en',
        aiProcessed: false,
      });
    }

    // Step 7: Batch insert new articles
    if (toInsert.length > 0) {
      try {
        const inserted = await News.insertMany(toInsert, { ordered: false });
        stats.newArticles = inserted.length;
        logger.info(`Successfully stored ${stats.newArticles} new articles in database.`);
      } catch (insertError: any) {
        // In case of any concurrent duplicate key errors, count actual inserted
        if (insertError.insertedDocs) {
          stats.newArticles = insertError.insertedDocs.length;
        } else {
          logger.warn(`Bulk insert had partial duplicates: ${insertError.message}`);
        }
      }
    }

    logger.info(
      `Ingestion completed: ${stats.newArticles} new, ${stats.duplicates} duplicates, ${stats.skipped} skipped, ${stats.fetched} total fetched.`
    );

    return stats;
  }
}
