import { Preferences, IPreferences } from '../models/Preferences';
import { NEWS_CATEGORIES, NewsCategory } from '../types/categories';

export class PreferencesService {
  static async getPreferences(userId: string): Promise<IPreferences> {
    let prefs = await Preferences.findOne({ userId });
    if (!prefs) {
      prefs = await Preferences.create({
        userId,
        categories: [...NEWS_CATEGORIES],
      });
    }
    return prefs;
  }

  static async updatePreferences(
    userId: string,
    data: {
      categories?: NewsCategory[];
      language?: string;
      newsLimit?: number;
      notificationSettings?: {
        emailDailyDigest?: boolean;
        whatsappDailyDigest?: boolean;
        digestTime?: string;
      };
    }
  ): Promise<IPreferences> {
    const update: any = {};
    if (data.categories) {
      // Validate categories are valid
      const valid = data.categories.filter((c) => (NEWS_CATEGORIES as readonly string[]).includes(c));
      update.categories = valid;
    }
    if (data.language) update.language = data.language.trim();
    if (data.newsLimit) update.newsLimit = Math.min(50, Math.max(5, data.newsLimit));
    if (data.notificationSettings) {
      update.notificationSettings = data.notificationSettings;
    }

    const updated = await Preferences.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true }
    );
    return updated;
  }
}
