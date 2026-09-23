import { Schema, Document, model, models, Types } from 'mongoose';

export interface IConversation extends Document {
  userId: Types.ObjectId;
  message: string;
  response: string;
  relatedNewsIds: Types.ObjectId[];
  createdAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'User message is required'],
      trim: true,
    },
    response: {
      type: String,
      required: [true, 'AI response is required'],
      trim: true,
    },
    relatedNewsIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'News',
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Conversation = models.Conversation || model<IConversation>('Conversation', ConversationSchema);
