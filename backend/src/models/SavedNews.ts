import { Schema, Document, model, models, Types } from 'mongoose';

export interface ISavedNews extends Document {
  userId: Types.ObjectId;
  newsId: Types.ObjectId;
  createdAt: Date;
}

const SavedNewsSchema = new Schema<ISavedNews>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    newsId: {
      type: Schema.Types.ObjectId,
      ref: 'News',
      required: [true, 'News ID is required'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique compound index so a user cannot duplicate save the same article
SavedNewsSchema.index({ userId: 1, newsId: 1 }, { unique: true });

export const SavedNews = models.SavedNews || model<ISavedNews>('SavedNews', SavedNewsSchema);
