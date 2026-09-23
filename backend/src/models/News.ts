import { Schema, Document, model, models } from 'mongoose';
import { NEWS_CATEGORIES, NewsCategory } from '../types/categories';

export interface INewsArticle {
  title: string;
  description: string;
  content: string;
  source: string;
  sourceName: string;
  url: string;
  author: string;
  imageUrl: string;
  category: NewsCategory;
  tags: string[];
  publishedAt: Date;
  updatedAt?: Date;
  fetchedAt: Date;
  contentHash: string;
  language: string;
  aiProcessed: boolean;
  createdAt?: Date;
}

export interface INews extends Document, INewsArticle {
  _id: any;
}

const NewsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      required: [true, 'Source identifier is required'],
      trim: true,
      index: true,
    },
    sourceName: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: NEWS_CATEGORIES,
      required: [true, 'Category is required'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    publishedAt: {
      type: Date,
      required: [true, 'Published date is required'],
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    contentHash: {
      type: String,
      required: [true, 'Content hash is required'],
      unique: true,
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    aiProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed queries
NewsSchema.index({ category: 1, publishedAt: -1 });
NewsSchema.index({ publishedAt: -1 });
NewsSchema.index({ title: 'text', description: 'text' });

export const News = models.News || model<INews>('News', NewsSchema);
