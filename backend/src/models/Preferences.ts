import { Schema, Document, model, models, Types } from 'mongoose';
import { NEWS_CATEGORIES, NewsCategory } from '../types/categories';

export interface IPreferences extends Document {
  userId: Types.ObjectId;
  categories: NewsCategory[];
  language: string;
  newsLimit: number;
  notificationSettings: {
    emailDailyDigest: boolean;
    whatsappDailyDigest: boolean;
    digestTime: string; // e.g. "08:00"
  };
  createdAt: Date;
  updatedAt: Date;
}

const PreferencesSchema = new Schema<IPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    categories: {
      type: [String],
      enum: NEWS_CATEGORIES,
      default: [...NEWS_CATEGORIES],
    },
    language: {
      type: String,
      default: 'en',
      trim: true,
    },
    newsLimit: {
      type: Number,
      default: 20,
      min: 5,
      max: 50,
    },
    notificationSettings: {
      emailDailyDigest: { type: Boolean, default: false },
      whatsappDailyDigest: { type: Boolean, default: false },
      digestTime: { type: String, default: '08:00' },
    },
  },
  {
    timestamps: true,
  }
);

export const Preferences = models.Preferences || model<IPreferences>('Preferences', PreferencesSchema);
