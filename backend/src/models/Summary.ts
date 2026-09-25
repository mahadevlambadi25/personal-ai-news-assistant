import { Schema, Document, model, models, Types } from 'mongoose';

export interface ISummary extends Document {
  newsId: Types.ObjectId;
  summary: string;
  whatHappened?: string;
  whyDidItHappen?: string;
  whyItMatters: string;
  impact?: string;
  background: string;
  keyFacts: string[];
  easyExplanation?: string;
  whatNext?: string;
  knowledge: {
    topic: string;
    simpleExplanation: string;
  };
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

const SummarySchema = new Schema<ISummary>(
  {
    newsId: {
      type: Schema.Types.ObjectId,
      ref: 'News',
      required: [true, 'News ID is required'],
      unique: true,
      index: true,
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
    },
    whatHappened: {
      type: String,
      trim: true,
    },
    whyDidItHappen: {
      type: String,
      trim: true,
    },
    whyItMatters: {
      type: String,
      required: [true, 'Why it matters is required'],
      trim: true,
    },
    impact: {
      type: String,
      trim: true,
    },
    background: {
      type: String,
      required: [true, 'Background is required'],
      trim: true,
    },
    keyFacts: {
      type: [String],
      default: [],
    },
    easyExplanation: {
      type: String,
      trim: true,
    },
    whatNext: {
      type: String,
      trim: true,
    },
    knowledge: {
      topic: {
        type: String,
        required: true,
        trim: true,
      },
      simpleExplanation: {
        type: String,
        required: true,
        trim: true,
      },
    },
    confidence: {
      type: Number,
      default: 0.95,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const Summary = models.Summary || model<ISummary>('Summary', SummarySchema);
